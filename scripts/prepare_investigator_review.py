import os
import pandas as pd

def main():
    in_path = os.path.join("data", "case_type_cyber", "ml", "entity_label_review_template.csv")
    out_path = os.path.join("data", "case_type_cyber", "ml", "entity_labeling_batch_001.csv")
    instructions_path = os.path.join("data", "case_type_cyber", "ml", "LABELING_INSTRUCTIONS.md")
    
    if not os.path.exists(in_path):
        print(f"ERROR: {in_path} not found.")
        return
        
    df = pd.read_csv(in_path, escapechar="\\")
    
    cols_to_add = ['review_status', 'reviewer', 'review_notes', 'evidence_reference', 'reviewed_at']
    for col in cols_to_add:
        if col not in df.columns:
            df[col] = ""
            
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    df.to_csv(out_path, index=False)
    
    instructions = """# Entity Labeling Instructions

- `is_suspect = 1` only when case evidence or investigator review supports that the entity is a suspect/accused.
- `is_suspect = 0` when the evidence supports that it is not a suspect.
- Leave the value blank when evidence is insufficient.
- Do not label based only on degree, PageRank, anomaly score, entity type, or keyword matching.
- Use the case ID, document, or page as `evidence_reference`.
- Keep entity identifiers unchanged.
- Do not duplicate or delete entity rows.
"""
    with open(instructions_path, "w", encoding="utf-8") as f:
        f.write(instructions)
        
    print(f"Enhanced review file saved to: {out_path}")
    print(f"Instructions saved to: {instructions_path}")

if __name__ == "__main__":
    main()
