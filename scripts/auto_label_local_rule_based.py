import os
import json
import spacy

def main():
    in_path = os.path.join("data", "case_type_cyber", "annotations", "ner", "doccano_import.jsonl")
    out_path = os.path.join("data", "case_type_cyber", "annotations", "ner", "doccano_auto_labeled_local.jsonl")
    
    if not os.path.exists(in_path):
        print(f"ERROR: Input file not found at {in_path}")
        return
        
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        import subprocess
        import sys
        print("Downloading en_core_web_sm...")
        subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
        nlp = spacy.load("en_core_web_sm")
        
    with open(in_path, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]
        
    print(f"Loaded {len(records)} records. Running local NER...")
    
    label_map = {
        "PERSON": "PERSON",
        "ORG": "ORGANIZATION",
        "GPE": "LOCATION",
        "LOC": "LOCATION",
        "FAC": "LOCATION"
    }
    
    labeled_records = []
    
    for i, record in enumerate(records):
        text = record.get("text", "")
        doc = nlp(text)
        
        doccano_entities = []
        for ent in doc.ents:
            if ent.label_ in label_map:
                doccano_entities.append([ent.start_char, ent.end_char, label_map[ent.label_]])
                
        record["entities"] = doccano_entities
        labeled_records.append(record)
        
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for rec in labeled_records:
            f.write(json.dumps(rec) + "\n")
            
    print(f"Finished processing {len(records)} records.")
    print(f"Output written to {out_path}")

if __name__ == "__main__":
    main()
