import os
import pandas as pd
import numpy as np

def main():
    features_path = os.path.join("data", "case_type_cyber", "ml", "graph_features_rich.csv")
    out_path = os.path.join("data", "case_type_cyber", "ml", "entity_weak_labels.csv")
    
    if not os.path.exists(features_path):
        print(f"ERROR: {features_path} not found.")
        return
        
    df = pd.read_csv(features_path, escapechar="\\")
    
    # Identify identifier column
    id_col = 'node_id' if 'node_id' in df.columns else 'entity_id'
    
    print("These labels are automatically generated proxies and have not been validated by investigators.")
    
    p95_degree = df['degree'].quantile(0.95)
    p95_pagerank = df['pagerank'].quantile(0.95)
    p95_comp = df['connected_component_size'].quantile(0.95)
    
    p30_degree = df['degree'].quantile(0.30)
    p30_pagerank = df['pagerank'].quantile(0.30)
    
    weak_labels = []
    reasons = []
    confidences = []
    methods = []
    
    for _, row in df.iterrows():
        cond1 = row['degree'] >= p95_degree
        cond2 = row['pagerank'] >= p95_pagerank
        cond4 = row['number_of_connected_entity_types'] >= 3
        
        low_cond1 = row['degree'] <= p30_degree
        low_cond2 = row['pagerank'] <= p30_pagerank
        
        if (cond1 and cond2) or (cond1 and cond4):
            weak_labels.append(1)
            reasons.append("High degree and pagerank/types (>= 95th percentile)")
            confidences.append("High")
            methods.append("Automated Network Centrality Proxy")
        elif low_cond1 and low_cond2:
            weak_labels.append(0)
            reasons.append("Low degree and pagerank (<= 30th percentile)")
            confidences.append("Medium")
            methods.append("Automated Network Centrality Proxy")
        else:
            weak_labels.append(np.nan)
            reasons.append("Insufficient evidence")
            confidences.append("Low")
            methods.append("None")
            
    out_df = pd.DataFrame({
        id_col: df[id_col],
        "weak_label": weak_labels,
        "weak_label_reason": reasons,
        "weak_label_confidence": confidences,
        "weak_label_method": methods
    })
    
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    out_df.to_csv(out_path, index=False)
    
    pos_count = (out_df['weak_label'] == 1).sum()
    neg_count = (out_df['weak_label'] == 0).sum()
    unk_count = out_df['weak_label'].isna().sum()
    total = len(out_df)
    
    print(f"Total entities: {total}")
    print(f"Provisional positive count: {pos_count} ({(pos_count/total)*100:.2f}%)")
    print(f"Provisional negative count: {neg_count} ({(neg_count/total)*100:.2f}%)")
    print(f"Unknown count: {unk_count} ({(unk_count/total)*100:.2f}%)")
    
    print("\nExact thresholds and rules used:")
    print(f" - Positive criteria: (degree >= {p95_degree:.2f} AND pagerank >= {p95_pagerank:.6f}) OR (degree >= {p95_degree:.2f} AND connected_types >= 3)")
    print(f" - Negative criteria: (degree <= {p30_degree:.2f} AND pagerank <= {p30_pagerank:.6f})")

if __name__ == "__main__":
    main()
