import os
import json
import spacy
from spacy.tokens import DocBin

def convert_to_spacy(jsonl_path, out_path):
    nlp = spacy.blank("en")
    db = DocBin()
    
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            rec = json.loads(line)
            text = rec["text"]
            ents = rec.get("entities", [])
            
            doc = nlp.make_doc(text)
            spans = []
            for start, end, label in ents:
                span = doc.char_span(start, end, label=label, alignment_mode="contract")
                if span is not None:
                    spans.append(span)
            
            # handle overlaps
            filtered = spacy.util.filter_spans(spans)
            doc.ents = filtered
            db.add(doc)
            
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    db.to_disk(out_path)
    print(f"Saved {len(db)} docs to {out_path}")

def main():
    splits = ["train_v6", "val_v6"]
    for split in splits:
        in_p = os.path.join("data", "ner", f"{split}.jsonl")
        out_p = os.path.join("data", "spacy_format", f"{split}.spacy")
        convert_to_spacy(in_p, out_p)

if __name__ == "__main__":
    main()
