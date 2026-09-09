import os
import json

def main():
    existing_path = os.path.join("data", "case_type_cyber", "annotations", "ner", "doccano_all_labeled_full.jsonl")
    kidnap_path = os.path.join("data", "case_type_kidnapping", "ner", "kidnapping_cases_labeled.jsonl")
    out_path = os.path.join("data", "ner", "doccano_all_labeled_unified.jsonl")
    
    seen_texts = set()
    records = []
    
    if os.path.exists(existing_path):
        with open(existing_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    rec = json.loads(line)
                    text = rec.get("text", "")
                    if text not in seen_texts:
                        seen_texts.add(text)
                        records.append(rec)
        print(f"Loaded {len(records)} existing unique records from {existing_path}.")
        
    if os.path.exists(kidnap_path):
        kidnap_added = 0
        with open(kidnap_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    rec = json.loads(line)
                    text = rec.get("text", "")
                    if text not in seen_texts:
                        seen_texts.add(text)
                        records.append(rec)
                        kidnap_added += 1
        print(f"Added {kidnap_added} NEW kidnapping records.")

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec) + "\n")
            
    print(f"Saved {len(records)} total unique records to {out_path}")

if __name__ == "__main__":
    main()
