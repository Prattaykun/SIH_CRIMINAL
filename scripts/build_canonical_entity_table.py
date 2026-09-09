import os
import json
import pandas as pd

def main():
    nodes_path = os.path.join("data", "case_type_cyber", "graphs", "ner_nodes_full_v4.json")
    features_path = os.path.join("data", "case_type_cyber", "ml", "graph_features_rich.csv")
    anomaly_path = os.path.join("data", "case_type_cyber", "ml", "anomaly_scores.csv")
    out_path = os.path.join("data", "case_type_cyber", "ml", "canonical_entity_features.csv")
    
    with open(nodes_path, "r", encoding="utf-8") as f:
        nodes = json.load(f)
    df_nodes = pd.DataFrame(nodes)
    df_nodes = df_nodes.rename(columns={"id": "node_id"})
    
    print(f"Source nodes row count: {len(df_nodes)}")
    
    # Aggregate duplicates
    # Group by node_id, preserving the first label and text
    df_canonical = df_nodes.groupby('node_id').agg({
        'label': 'first',
        'text': 'first'
    }).reset_index()
    
    df_canonical = df_canonical.rename(columns={"label": "entity_type", "text": "entity_text"})
    
    print(f"Canonical entities after aggregating duplicates: {len(df_canonical)}")
    
    # Load features and aggregate to 1 row per node_id
    df_feat = pd.read_csv(features_path, escapechar="\\")
    df_feat_canonical = df_feat.groupby('node_id').first().reset_index()
    
    # Load anomaly and aggregate
    df_anomaly = pd.read_csv(anomaly_path, escapechar="\\")
    df_anomaly_canonical = df_anomaly.groupby('node_id').first().reset_index()
    
    # Left join
    df_final = pd.merge(df_canonical, df_feat_canonical.drop(columns=['entity_type', 'entity_text'], errors='ignore'), on='node_id', how='left')
    df_final = pd.merge(df_final, df_anomaly_canonical[['node_id', 'anomaly_score', 'is_anomaly']], on='node_id', how='left')
    
    print(f"Final merged row count: {len(df_final)}")
    
    # Unmatched
    unmatched_feat = set(df_feat['node_id']) - set(df_canonical['node_id'])
    unmatched_anom = set(df_anomaly['node_id']) - set(df_canonical['node_id'])
    print(f"Features missing from canonical nodes: {len(unmatched_feat)}")
    print(f"Anomaly missing from canonical nodes: {len(unmatched_anom)}")
    
    df_final.to_csv(out_path, index=False, escapechar="\\")
    print(f"Saved canonical table to {out_path}")

if __name__ == "__main__":
    main()
