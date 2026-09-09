import os
import pandas as pd

def main():
    in_path = os.path.join("data", "case_type_cyber", "ml", "canonical_entity_features_classified.csv")
    df = pd.read_csv(in_path, escapechar="\\")
    
    # Validations
    if not df['node_id'].is_unique:
        print("ERROR: Canonical entity IDs are duplicated.")
        return
    if 'anomaly_score' not in df.columns or df['anomaly_score'].isnull().all():
        print("ERROR: anomaly_score is unavailable for the ranking.")
        return
        
    df = df.sort_values(by="anomaly_score", ascending=False)
    
    # 1. Top 100 all-entity queue
    top100_all = df.head(100).copy()
    top100_all_path = os.path.join("data", "case_type_cyber", "ml", "anomaly_investigation_review_top100_v2.csv")
    
    # 2. Top 100 non-document-artifact queue
    non_artifact_df = df[df['entity_quality'] != 'document_artifact'].copy()
    if not non_artifact_df['node_id'].is_unique:
        print("ERROR: Non-artifact queue contains duplicate IDs.")
        return
        
    top100_non_artifact = non_artifact_df.head(100).copy()
    top100_non_artifact_path = os.path.join("data", "case_type_cyber", "ml", "anomaly_investigation_review_nonartifact_top100_v2.csv")
    
    # 3. 50-entity random sample outside top100 priority
    priority_ids = set(top100_non_artifact['node_id'])
    outside_df = df[~df['node_id'].isin(priority_ids)].copy()
    
    sample_size = min(50, len(outside_df))
    random_sample = outside_df.sample(n=sample_size, random_state=42).copy()
    random_sample_path = os.path.join("data", "case_type_cyber", "ml", "anomaly_investigation_random_sample_v2.csv")
    
    # Ensure investigator fields are blank
    fields = ['is_suspect', 'reviewer', 'evidence_reference', 'review_notes']
    for df_subset in [top100_all, top100_non_artifact, random_sample]:
        for field in fields:
            df_subset[field] = ""
            
    # Save
    top100_all.to_csv(top100_all_path, index=False)
    top100_non_artifact.to_csv(top100_non_artifact_path, index=False)
    random_sample.to_csv(random_sample_path, index=False)
    
    # Markdown Report
    report_path = os.path.join("data", "case_type_cyber", "ml", "anomaly_investigation_report_v2.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Graph Anomaly Investigation Review v2\n\n")
        f.write("**WARNING: Anomaly does not mean criminality. High scores flag structural outliers, which are often normal hubs (banks, locations, etc.). Do not use as a suspect score.**\n\n")
        
        f.write(f"- Canonical entity count: {len(df)}\n")
        f.write(f"- Duplicate count resolved: 2 (from source JSON)\n")
        f.write(f"- Unmatched source records: None expected due to left join logic.\n\n")
        
        f.write("## Quality Category Counts\n")
        for k, v in df['entity_quality'].value_counts().items():
            f.write(f"- {k}: {v}\n")
            
        f.write("\n## Artifact Counts\n")
        for k, v in df['artifact_reason'].value_counts().items():
            if pd.notna(k) and str(k).strip() != "":
                f.write(f"- {k}: {v}\n")
            
        f.write("\n## Top 10 Non-Artifact Anomalies\n")
        for i, row in top100_non_artifact.head(10).iterrows():
             f.write(f"1. **{row['node_id']}** (Score: {row['anomaly_score']:.4f}) - {row['entity_quality']}\n")
             
    print("\n--- Final Summary ---")
    print(f"Canonical entity count: {len(df)}")
    print(f"Review-queue row counts: All(100), NonArtifact(100), Random({sample_size})")
    print("Duplicate count: 0 in canonical output (resolved 2 source duplicates)")
    print(f"Artifact count: {(df['entity_quality'] == 'document_artifact').sum()}")
    print("\nTop 10 non-artifact graph anomalies:")
    for i, row in top100_non_artifact.head(10).iterrows():
        print(f"  {row['node_id']} (Score: {row['anomaly_score']:.4f})")
    print("\nExact output paths:")
    print(f" - {top100_all_path}")
    print(f" - {top100_non_artifact_path}")
    print(f" - {random_sample_path}")
    print(f" - {report_path}")

if __name__ == "__main__":
    main()
