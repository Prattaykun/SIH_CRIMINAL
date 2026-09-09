import os
import json

def main():
    existing_path = os.path.join("data", "case_type_cyber", "annotations", "ner", "doccano_all_labeled.jsonl")
    fin_path = os.path.join("data", "case_type_financial", "ner", "financial_cases_labeled.jsonl")
    out_path = os.path.join("data", "case_type_cyber", "annotations", "ner", "doccano_all_labeled_with_financial.jsonl")
    
    records = []
    
    if os.path.exists(existing_path):
        with open(existing_path, "r", encoding="utf-8") as f:
            records.extend([json.loads(line) for line in f if line.strip()])
        print(f"Loaded {len(records)} existing records.")
        
    if os.path.exists(fin_path):
        with open(fin_path, "r", encoding="utf-8") as f:
            fin_records = [json.loads(line) for line in f if line.strip()]
        records.extend(fin_records)
        print(f"Loaded {len(fin_records)} financial records.")
        
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec) + "\n")
            
    print(f"Saved {len(records)} total records to {out_path}")

if __name__ == "__main__":
    main()
