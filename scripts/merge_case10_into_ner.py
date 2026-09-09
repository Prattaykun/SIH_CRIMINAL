import os
import json
import spacy

def main():
    existing_path = os.path.join("data", "case_type_cyber", "annotations", "ner", "doccano_auto_labeled_local.jsonl")
    case10_path = os.path.join("data", "case_type_cyber", "annotations", "ner", "case10_import.jsonl")
    out_path = os.path.join("data", "case_type_cyber", "annotations", "ner", "doccano_all_labeled.jsonl")
    
    records = []
    
    # Load existing records
    if os.path.exists(existing_path):
        with open(existing_path, "r", encoding="utf-8") as f:
            records.extend([json.loads(line) for line in f if line.strip()])
        print(f"Loaded {len(records)} existing records.")
    
    # Load and process Case 10 records
    if os.path.exists(case10_path):
        with open(case10_path, "r", encoding="utf-8") as f:
            case10_records = [json.loads(line) for line in f if line.strip()]
        
        print(f"Loaded {len(case10_records)} new case 10 records. Labeling...")
        nlp = spacy.load("en_core_web_sm")
        label_map = {"PERSON": "PERSON", "ORG": "ORGANIZATION", "GPE": "LOCATION", "LOC": "LOCATION", "FAC": "LOCATION"}
        
        for rec in case10_records:
            doc = nlp(rec.get("text", ""))
            ents = [[ent.start_char, ent.end_char, label_map[ent.label_]] for ent in doc.ents if ent.label_ in label_map]
            rec["entities"] = ents
            records.append(rec)
            
    with open(out_path, "w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec) + "\n")
            
    print(f"Saved {len(records)} combined records to {out_path}")

if __name__ == "__main__":
    main()
