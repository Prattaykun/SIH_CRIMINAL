import os
import json

def main():
    existing_path = os.path.join("data", "ner", "doccano_all_labeled_unified.jsonl")
    murder_path = os.path.join("data", "case_type_murder", "ner", "murder_cases_labeled.jsonl")
    out_path = os.path.join("data", "ner", "doccano_all_labeled_unified_v6.jsonl")
    
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
        
    if os.path.exists(murder_path):
        murder_added = 0
        with open(murder_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    rec = json.loads(line)
                    text = rec.get("text", "")
                    if text not in seen_texts:
                        seen_texts.add(text)
                        records.append(rec)
                        murder_added += 1
        print(f"Added {murder_added} NEW murder records.")

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec) + "\n")
            
    print(f"Saved {len(records)} total unique records to {out_path}")

if __name__ == "__main__":
    main()
