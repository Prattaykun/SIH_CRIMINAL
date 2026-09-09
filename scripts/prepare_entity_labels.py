import os
import pandas as pd
import json

def main():
    features_path = os.path.join("data", "case_type_cyber", "ml", "graph_features_rich.csv")
    if not os.path.exists(features_path):
        print(f"Features file {features_path} not found.")
        return
        
    df = pd.read_csv(features_path, escapechar="\\")
    
    # Check for existing label files
    candidate_files = [
        "entity_labels.csv",
        "reviewed_labels.csv",
        "ground_truth.csv",
        "entity_ground_truth.csv"
    ]
    
    ml_dir = os.path.join("data", "case_type_cyber", "ml")
    os.makedirs(ml_dir, exist_ok=True)
    
    valid_file = None
    target_col = None
    
    for fname in candidate_files:
        fpath = os.path.join(ml_dir, fname)
        if os.path.exists(fpath):
            labels_df = pd.read_csv(fpath)
            for col in labels_df.columns:
                if col.lower() in ['is_suspect', 'suspect', 'accused', 'target', 'ground_truth']:
                    # ensure there's an entity identifier
                    if 'node_id' in labels_df.columns or 'entity_id' in labels_df.columns:
                        valid_file = fpath
                        target_col = col
                        break
        if valid_file:
            break
            
    out_truth_path = os.path.join(ml_dir, "entity_ground_truth.csv")
    out_template_path = os.path.join(ml_dir, "entity_label_review_template.csv")
    
    if valid_file:
        print(f"Found existing label file: {valid_file}")
        labels_df = pd.read_csv(valid_file)
        
        # Validate binary
        unique_vals = labels_df[target_col].dropna().unique()
        if not set(unique_vals).issubset({0, 1, 0.0, 1.0, '0', '1'}):
            print(f"ERROR: Labels in {target_col} are not strictly binary (0/1). Values found: {unique_vals}")
            return
            
        print("Validation passed: Binary labels found.")
        print("Class distribution:")
        print(labels_df[target_col].value_counts())
        
        # Save normalized
        normalized = labels_df.copy()
        normalized[target_col] = normalized[target_col].astype(float)
        normalized.to_csv(out_truth_path, index=False)
        print(f"Saved normalized ground truth to {out_truth_path}")
        
    else:
        print("No verified labels found. Manual review is required before Random Forest training.")
        
        template_df = df[['node_id', 'entity_text', 'entity_type']].copy()
        template_df['is_suspect'] = ""
        template_df.to_csv(out_template_path, index=False)
        print(f"Created review template: {out_template_path}")

if __name__ == "__main__":
    main()
