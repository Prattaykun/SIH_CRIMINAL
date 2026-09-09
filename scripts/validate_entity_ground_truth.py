import os
import pandas as pd
import json

def main():
    gt_path = os.path.join("data", "case_type_cyber", "ml", "entity_ground_truth.csv")
    out_valid_path = os.path.join("data", "case_type_cyber", "ml", "entity_ground_truth_validated.csv")
    report_path = os.path.join("data", "case_type_cyber", "ml", "label_validation_report.json")
    
    if not os.path.exists(gt_path):
        print(f"Ground-truth file not found at {gt_path}. Complete the review file first.")
        return
        
    df = pd.read_csv(gt_path, escapechar="\\")
    errors = []
    
    # 1. Check stable identifier
    id_col = None
    for col in ['node_id', 'entity_id']:
        if col in df.columns:
            id_col = col
            break
            
    if not id_col:
        errors.append("No stable entity identifier column found (expected node_id or entity_id).")
    else:
        if df[id_col].isnull().any() or (df[id_col] == "").any():
            errors.append("Identifier column contains blank values.")
        if not df[id_col].is_unique:
            errors.append("Identifier column contains duplicate entities.")
            
    # 2. Check is_suspect
    if 'is_suspect' not in df.columns:
        errors.append("is_suspect column missing.")
    else:
        if df['is_suspect'].isnull().any() or (df['is_suspect'] == "").any():
            errors.append("is_suspect contains missing labels. All rows must be labeled.")
            
        unique_vals = df['is_suspect'].dropna().unique()
        valid_vals = {0, 1, 0.0, 1.0, '0', '1'}
        invalid_vals = set(unique_vals) - valid_vals
        if invalid_vals:
            errors.append(f"is_suspect contains non-binary values: {invalid_vals}")
        else:
            df['is_suspect'] = df['is_suspect'].astype(float).astype(int)
            counts = df['is_suspect'].value_counts()
            if len(counts) < 2:
                errors.append("is_suspect must contain both 0 and 1 classes.")
            elif counts.min() < 5:
                errors.append(f"is_suspect has insufficient examples for evaluation. Counts: {counts.to_dict()}")
                
    # 3. Check metadata presence for labeled rows
    for meta_col in ['reviewer', 'evidence_reference']:
        if meta_col not in df.columns:
            errors.append(f"{meta_col} column missing.")
        else:
            missing_meta_count = df[df['is_suspect'].notnull() & (df[meta_col].isnull() | (df[meta_col] == ""))].shape[0]
            if missing_meta_count > 0:
                errors.append(f"Missing {meta_col} for {missing_meta_count} labeled rows.")

    if errors:
        print("Validation Failed:")
        for e in errors:
            print(f" - {e}")
        with open(report_path, "w") as f:
            json.dump({"valid": False, "errors": errors}, f)
        print("Do not train Random Forest.")
    else:
        counts = df['is_suspect'].value_counts()
        pcts = df['is_suspect'].value_counts(normalize=True) * 100
        print("Class counts:")
        for c, count in counts.items():
            print(f" Class {c}: {count} ({pcts[c]:.2f}%)")
            
        with open(report_path, "w") as f:
            json.dump({"valid": True, "counts": counts.to_dict()}, f)
            
        df.to_csv(out_valid_path, index=False)
        print(f"Saved validated labels to: {out_valid_path}")
        print("Ground truth validated. Random Forest training is now permitted.")

if __name__ == "__main__":
    main()
