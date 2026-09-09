import os
import json
import spacy

def main():
    in_path = os.path.join("data", "case_type_violent", "ner", "violent_cases_raw.jsonl")
    out_path = os.path.join("data", "case_type_violent", "ner", "violent_cases_labeled.jsonl")
    model_path = os.path.join("models", "ner_v2", "model-best")
    
    if not os.path.exists(in_path):
        print(f"ERROR: {in_path} not found.")
        return
        
    with open(in_path, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]
        
    print(f"Loaded {len(records)} violent crime records. Labeling using {model_path}...")
    nlp = spacy.load(model_path)
    label_map = {"PERSON": "PERSON", "ORGANIZATION": "ORGANIZATION", "LOCATION": "LOCATION"}
    
    for rec in records:
        doc = nlp(rec.get("text", ""))
        ents = []
        for ent in doc.ents:
            if ent.label_ in label_map:
                ents.append([ent.start_char, ent.end_char, label_map[ent.label_]])
        rec["entities"] = ents
        
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec) + "\n")
            
    print(f"Saved {len(records)} labeled records to {out_path}")

if __name__ == "__main__":
    main()
