import os
import json
import pandas as pd

def audit_file(path, file_type):
    print(f"\n--- Auditing {os.path.basename(path)} ---")
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return None
        
    if file_type == 'json':
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            print("Unknown JSON format")
            return None
    else:
        df = pd.read_csv(path, escapechar="\\")
        
    print(f"Row count: {len(df)}")
    
    # Detect id col
    id_col = None
    for col in ['node_id', 'entity_id', 'id']:
        if col in df.columns:
            id_col = col
            break
            
    if not id_col:
        print(f"Could not find stable identifier column. Columns: {list(df.columns)}")
        return None
        
    print(f"Identifier column: {id_col}")
    unique_count = df[id_col].nunique()
    print(f"Unique identifier count: {unique_count}")
    
    dup_count = len(df) - unique_count
    print(f"Duplicate identifier count: {dup_count}")
    
    missing_count = df[id_col].isnull().sum()
    print(f"Missing identifier count: {missing_count}")
    
    print(f"Sample identifiers:\n{df[id_col].head(3).tolist()}")
    
    return {
        "file": os.path.basename(path),
        "row_count": len(df),
        "id_col": id_col,
        "unique": unique_count,
        "duplicates": dup_count,
        "missing": int(missing_count)
    }

def main():
    files = [
        ("data/case_type_cyber/ml/anomaly_scores.csv", 'csv'),
        ("data/case_type_cyber/ml/graph_features_rich.csv", 'csv'),
        ("data/case_type_cyber/graphs/ner_nodes_full_v4.json", 'json'),
        ("data/case_type_cyber/ml/anomaly_investigation_review_top100.csv", 'csv')
    ]
    
    results = []
    for path, typ in files:
        res = audit_file(path, typ)
        if res:
            results.append(res)
            
    out_path = os.path.join("data", "case_type_cyber", "ml", "graph_ml_join_audit.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=4)
        
    print("\nSaved audit to", out_path)

if __name__ == "__main__":
    main()
