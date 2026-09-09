import os
import pandas as pd

def main():
    anomaly_path = os.path.join("data", "case_type_cyber", "ml", "anomaly_scores_cleaned.csv")
    features_path = os.path.join("data", "case_type_cyber", "ml", "graph_features_rich_cleaned.csv")
    out_path = os.path.join("data", "case_type_cyber", "ml", "provisional_labeling_batch.csv")
    
    df_anomaly = pd.read_csv(anomaly_path, escapechar="\\")
    df_feat = pd.read_csv(features_path, escapechar="\\")
    
    id_col = 'node_id' if 'node_id' in df_feat.columns else 'entity_id'
    
    df = pd.merge(df_feat, df_anomaly[[id_col, 'anomaly_score', 'is_anomaly']], on=id_col, how='inner')
    
    # Filter out known non-suspects
    valid_types = ['PERSON', 'ORGANIZATION', 'LOCATION']
    df = df[df['entity_type'].isin(valid_types)]
    
    df_sorted = df.sort_values(by='anomaly_score', ascending=False)
    
    top_queue = df_sorted.head(50).copy()
    
    for col in ['is_suspect', 'reviewer', 'evidence_reference', 'review_notes']:
        top_queue[col] = ""
        
    out_cols = [id_col, 'entity_text', 'entity_type', 'anomaly_score', 'is_suspect', 'reviewer', 'evidence_reference', 'review_notes']
    top_queue = top_queue[[c for c in out_cols if c in top_queue.columns]]
    
    top_queue.to_csv(out_path, index=False)
    print(f"Created provisional labeling batch with {len(top_queue)} valid entities at {out_path}")
    print("Top 10 entities in batch:")
    for i, row in top_queue.head(10).iterrows():
        print(f"  {row[id_col]} (Score: {row['anomaly_score']:.4f})")

if __name__ == "__main__":
    main()
