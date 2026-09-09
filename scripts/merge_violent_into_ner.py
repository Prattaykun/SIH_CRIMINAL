import os
import json

def main():
    existing_path = os.path.join("data", "case_type_cyber", "annotations", "ner", "doccano_all_labeled_with_financial.jsonl")
    viol_path = os.path.join("data", "case_type_violent", "ner", "violent_cases_labeled.jsonl")
    out_path = os.path.join("data", "case_type_cyber", "annotations", "ner", "doccano_all_labeled_with_financial_and_violent.jsonl")
    
    records = []
    
    if os.path.exists(existing_path):
        with open(existing_path, "r", encoding="utf-8") as f:
            records.extend([json.loads(line) for line in f if line.strip()])
        print(f"Loaded {len(records)} existing records.")
        
    if os.path.exists(viol_path):
        with open(viol_path, "r", encoding="utf-8") as f:
            viol_records = [json.loads(line) for line in f if line.strip()]
        records.extend(viol_records)
        print(f"Loaded {len(viol_records)} violent crime records.")
        
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec) + "\n")
            
    print(f"Saved {len(records)} total records to {out_path}")

if __name__ == "__main__":
    main()
