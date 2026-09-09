import os
import json
import pandas as pd
import numpy as np

def main():
    anomaly_path = os.path.join("data", "case_type_cyber", "ml", "anomaly_scores.csv")
    features_path = os.path.join("data", "case_type_cyber", "ml", "graph_features_rich.csv")
    
    if not os.path.exists(anomaly_path) or not os.path.exists(features_path):
        print("Missing required files.")
        return
        
    df_anomaly = pd.read_csv(anomaly_path, escapechar="\\")
    df_features = pd.read_csv(features_path, escapechar="\\")
    
    id_col = 'node_id' if 'node_id' in df_anomaly.columns else 'entity_id'
    
    # Merge
    df = pd.merge(df_features, df_anomaly[[id_col, 'anomaly_score', 'is_anomaly']], on=id_col, how='inner')
    
    # Add manual review columns
    review_cols = ['review_status', 'reviewer', 'is_suspect', 'evidence_reference', 'review_notes']
    for col in review_cols:
        df[col] = ""
        
    # Generic artifacts detection
    generic_terms = ['inr', 'cdr', 'kyc', 'cctv', 'phone', 'doc', 'telecom', 'complaint narrative', 'case file association', 'whatsapp']
    
    def check_generic(text):
        if pd.isna(text):
            return 0, ""
        lower_t = str(text).lower().strip()
        for term in generic_terms:
            if lower_t == term:
                return 1, f"Exact match with generic term '{term}'"
        return 0, ""

    res = df['entity_text'].apply(check_generic)
    df['is_generic_artifact'] = [r[0] for r in res]
    df['artifact_reason'] = [r[1] for r in res]
    
    # Ensure required columns
    out_cols = [
        id_col, 'entity_text', 'entity_type', 'case_id', 'cases', 'anomaly_score', 'is_anomaly',
        'degree', 'weighted_degree', 'betweenness_centrality', 'closeness_centrality',
        'pagerank', 'connected_component_size', 'number_of_unique_neighbors', 
        'number_of_connected_entity_types', 'is_generic_artifact', 'artifact_reason',
        'review_status', 'reviewer', 'is_suspect', 'evidence_reference', 'review_notes'
    ]
    
    # Filter available columns
    final_cols = [c for c in out_cols if c in df.columns]
    
    df = df[final_cols]
    
    # Sort by anomaly_score
    df_sorted = df.sort_values(by='anomaly_score', ascending=False)
    
    top100 = df_sorted.head(100)
    top100_path = os.path.join("data", "case_type_cyber", "ml", "anomaly_investigation_review_top100.csv")
    top100.to_csv(top100_path, index=False)
    
    df_non_generic = df_sorted[df_sorted['is_generic_artifact'] == 0]
    top50_non_generic = df_non_generic.head(50)
    
    # Random sample outside top 100
    outside_top100 = df_sorted.iloc[100:]
    if len(outside_top100) > 0:
        sample_size = min(50, len(outside_top100))
        random_sample = outside_top100.sample(n=sample_size, random_state=42)
        sample_path = os.path.join("data", "case_type_cyber", "ml", "anomaly_investigation_random_sample.csv")
        random_sample.to_csv(sample_path, index=False)
    
    # Report markdown
    report_path = os.path.join("data", "case_type_cyber", "ml", "anomaly_investigation_report.md")
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Graph Anomaly Investigation Review\n\n")
        f.write("**WARNING: Anomaly does not mean criminality. These lists contain structural outliers, which can be normal infrastructure. Manual verification is required.**\n\n")
        
        f.write(f"Total entities reviewed: {len(df)}\n")
        f.write(f"Flagged as generic artifacts: {df['is_generic_artifact'].sum()}\n\n")
        
        f.write("## Entity Type Counts (Top 100)\n")
        type_counts = top100['entity_type'].value_counts()
        for k, v in type_counts.items():
            f.write(f"- {k}: {v}\n")
            
        f.write("\n## Top 50 Non-Generic Anomalous Entities\n")
        for i, row in top50_non_generic.iterrows():
            f.write(f"- **{row[id_col]}** (Score: {row['anomaly_score']:.4f}) - Degree: {row['degree']}, Pagerank: {row['pagerank']:.4f}\n")
            
        f.write("\n## Explanations of Graph Signals\n")
        f.write("- **Anomaly Score**: Higher means the node is structurally distinct from the median nodes in the network.\n")
        f.write("- **Degree**: Total number of direct connections.\n")
        f.write("- **Betweenness Centrality**: Frequency a node acts as a bridge along the shortest path between two other nodes.\n")
        f.write("- **PageRank**: Reflects the overall network authority and connectivity flowing into the node.\n")
        
    print(f"Total entities reviewed: {len(df)}")
    print(f"Entities flagged as generic artifacts: {df['is_generic_artifact'].sum()}")
    print(f"Outputs generated:")
    print(f" - {top100_path}")
    print(f" - {sample_path}")
    print(f" - {report_path}")
    print("\nTop Non-Generic Entities:")
    for i, row in top50_non_generic.head(10).iterrows():
        print(f"  {row[id_col]} (Score: {row['anomaly_score']:.4f}) - Degree: {row['degree']}, Pagerank: {row['pagerank']:.4f}")

if __name__ == "__main__":
    main()
