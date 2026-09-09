import os
import json
import pandas as pd

def main():
    # 1. Load kidnapping case entities
    kidnap_path = os.path.join("data", "case_type_kidnapping", "ner", "kidnapping_cases_labeled.jsonl")
    kidnapping_entities = set()
    
    if os.path.exists(kidnap_path):
        with open(kidnap_path, "r", encoding="utf-8") as f:
            for line in f:
                rec = json.loads(line)
                text = rec.get("text", "")
                ents = rec.get("entities", [])
                for ent in ents:
                    start, end, label = ent[0], ent[1], ent[2]
                    snippet = text[start:end].strip()
                    if snippet:
                        node_id = f"{label}|{snippet}"
                        kidnapping_entities.add(node_id)
                        
    # 2. Load anomaly scores
    anomaly_path = os.path.join("data", "case_type_cyber", "ml", "anomaly_scores_cleaned_v5.csv")
    df_anom = pd.read_csv(anomaly_path, escapechar="\\")
    
    # 3. Load proxy labels
    proxy_path = os.path.join("data", "case_type_cyber", "ml", "context_proxy_predictions_v2.csv")
    df_proxy = pd.DataFrame()
    if os.path.exists(proxy_path):
        df_proxy = pd.read_csv(proxy_path, escapechar="\\")
    
    # 4. Merge data
    df = df_anom.copy()
    if not df_proxy.empty:
        id_col = 'node_id' if 'node_id' in df.columns else 'entity_id'
        proxy_id_col = 'node_id' if 'node_id' in df_proxy.columns else 'entity_id'
        df = pd.merge(df, df_proxy[[proxy_id_col, 'proxy_prediction']], left_on=id_col, right_on=proxy_id_col, how='left')
    else:
        df['proxy_prediction'] = "N/A"
        
    id_col = 'node_id' if 'node_id' in df.columns else 'entity_id'
    
    # 5. Filter artifacts and sort
    # Clean up non-artifacts
    df_clean = df[~df['entity_type'].isin(['DOCUMENT_ARTIFACT', 'TECHNICAL_TERM', 'INFRASTRUCTURE'])].copy()
    
    # Add kidnapping flag
    df_clean['in_kidnapping_case'] = df_clean[id_col].apply(lambda x: x in kidnapping_entities)
    
    # Get top 20 general anomalies
    top20 = df_clean.sort_values(by='anomaly_score', ascending=False).head(20)
    
    # Get kidnapping specific anomalies
    kidnapping_anomalies = df_clean[df_clean['in_kidnapping_case']].sort_values(by='anomaly_score', ascending=False).head(20)
    
    print("\n=======================================================")
    print("TOP 20 NON-ARTIFACT ANOMALIES ACROSS ALL CASES (v5)")
    print("=======================================================")
    print(f"{'Node ID':<35} | {'Score':<8} | {'Degree':<6} | {'Proxy Label':<12} | {'Kidnapping?':<10}")
    print("-" * 80)
    for _, row in top20.iterrows():
        proxy = row.get('proxy_prediction', 'N/A')
        print(f"{str(row[id_col])[:35]:<35} | {row['anomaly_score']:<8.4f} | {row['degree']:<6.0f} | {str(proxy):<12} | {str(row['in_kidnapping_case']):<10}")

    print("\n=======================================================")
    print("TOP ANOMALIES FROM NEW KIDNAPPING CASES (v5)")
    print("=======================================================")
    print(f"{'Node ID':<35} | {'Score':<8} | {'Degree':<6} | {'Proxy Label':<12}")
    print("-" * 80)
    for _, row in kidnapping_anomalies.iterrows():
        proxy = row.get('proxy_prediction', 'N/A')
        print(f"{str(row[id_col])[:35]:<35} | {row['anomaly_score']:<8.4f} | {row['degree']:<6.0f} | {str(proxy):<12}")

    out_csv = os.path.join("data", "case_type_kidnapping", "ml", "kidnapping_candidates_review.csv")
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)
    kidnapping_anomalies.to_csv(out_csv, index=False, escapechar="\\")
    print(f"\nSaved detailed kidnapping candidates to: {out_csv}")

if __name__ == "__main__":
    main()
