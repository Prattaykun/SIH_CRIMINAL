import os
import json

def main():
    existing_path = os.path.join("data", "case_type_cyber", "annotations", "ner", "doccano_all_labeled_with_financial_and_violent.jsonl")
    kidnap_path = os.path.join("data", "case_type_kidnapping", "ner", "kidnapping_cases_labeled.jsonl")
    murder_path = os.path.join("data", "case_type_murder", "ner", "murder_cases_labeled.jsonl")
    out_path = os.path.join("data", "case_type_cyber", "annotations", "ner", "doccano_all_labeled_full.jsonl")
    
    records = []
    
    if os.path.exists(existing_path):
        with open(existing_path, "r", encoding="utf-8") as f:
            records.extend([json.loads(line) for line in f if line.strip()])
        print(f"Loaded {len(records)} existing records.")
        
    if os.path.exists(kidnap_path):
        with open(kidnap_path, "r", encoding="utf-8") as f:
            kidnap_records = [json.loads(line) for line in f if line.strip()]
        records.extend(kidnap_records)
        print(f"Loaded {len(kidnap_records)} kidnapping records.")

    if os.path.exists(murder_path):
        with open(murder_path, "r", encoding="utf-8") as f:
            murder_records = [json.loads(line) for line in f if line.strip()]
        records.extend(murder_records)
        print(f"Loaded {len(murder_records)} murder records.")
        
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec) + "\n")
            
    print(f"Saved {len(records)} total records to {out_path}")

if __name__ == "__main__":
    main()
