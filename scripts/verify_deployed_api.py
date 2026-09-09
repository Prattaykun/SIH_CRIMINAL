import os
import sys
import json
import requests
import time

def main():
    url_base = os.getenv("DEPLOYED_API_URL")
    if not url_base:
        print("Production URL not found. Set DEPLOYED_API_URL before running remote verification.")
        sys.exit(1)
        
    url_base = url_base.rstrip("/")
    health_url = f"{url_base}/health"
    ner_url = f"{url_base}/ner"
    
    report = {
        "url": url_base,
        "health_status": "FAILED",
        "ner_status": "FAILED",
        "total_time_ms": 0,
        "pass": False
    }
    
    start_time = time.time()
    
    # 1. Health check
    try:
        r_health = requests.get(health_url, timeout=10)
        r_health.raise_for_status()
        health_data = r_health.json()
        
        # Validate
        is_ok = health_data.get("status") == "ok"
        has_ner = "ner_v4" in health_data.get("ner_model_version", "")
        no_paths = "\\" not in str(health_data) and "/" not in str(health_data)
        
        if is_ok and has_ner and no_paths:
            report["health_status"] = "PASSED"
            report["health_data"] = health_data
        else:
            report["health_status"] = f"FAILED_VALIDATION (ok: {is_ok}, ner_v4: {has_ner}, no_paths: {no_paths})"
    except Exception as e:
        report["health_status"] = f"ERROR: {str(e)}"
        
    # 2. NER check
    payload = {"text": "Kavita Srivastava filed a complaint in Mumbai."}
    try:
        r_ner = requests.post(ner_url, json=payload, timeout=10)
        r_ner.raise_for_status()
        ner_data = r_ner.json()
        
        entities = ner_data.get("entities", [])
        entity_texts = [e.get("text") for e in entities]
        
        has_person = "Kavita Srivastava" in entity_texts
        has_location = "Mumbai" in entity_texts
        no_paths = "\\" not in str(ner_data)
        
        if has_person and has_location and no_paths:
            report["ner_status"] = "PASSED"
            report["ner_entities"] = entities
        else:
            report["ner_status"] = f"FAILED_VALIDATION (person: {has_person}, location: {has_location})"
    except Exception as e:
        report["ner_status"] = f"ERROR: {str(e)}"
        
    end_time = time.time()
    report["total_time_ms"] = int((end_time - start_time) * 1000)
    
    if report["health_status"] == "PASSED" and report["ner_status"] == "PASSED":
        report["pass"] = True
        
    out_path = os.path.join("data", "deployment_verification_report.json")
    with open(out_path, "w") as f:
        json.dump(report, f, indent=4)
        
    print(f"Health Status: {report['health_status']}")
    if "health_data" in report:
        print(f"Reported Model: {report['health_data'].get('ner_model_version')}")
        
    print(f"NER Status: {report['ner_status']}")
    if "ner_entities" in report:
        print("Returned Entities:")
        for e in report["ner_entities"]:
            print(f" - {e['text']} ({e['label']})")
            
    print(f"Total Request Time: {report['total_time_ms']} ms")
    print(f"Pass/Fail Summary: {'PASS' if report['pass'] else 'FAIL'}")

if __name__ == "__main__":
    main()
