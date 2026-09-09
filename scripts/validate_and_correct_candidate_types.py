import os
import json
import pandas as pd

def apply_conservative_corrections(row):
    text = str(row['entity_text']).lower().strip()
    
    loc_patterns = ["road", "nagar", "khand", "kolkata", "mumbai", "pune", "lucknow", "jaipur", "bhopal", "patna", "coimbatore", "chhatna", "station", "outpost"]
    veh_patterns = ["honda", "toyota", "maruti", "vehicle", "bicycle", "frame", "serial", "mh-", "registration", "chassis", "mobile", "phone", "imsi"]
    leg_patterns = ["ipc", "magistrate", "persons", "identifier register", "seized", "in cust", "statement", "memo", "reference", "narration", "action", "preservation", "excerpt", "details", "tasks", "entity", "initial", "rcp", "location"]
    
    # 1. Legal or Document Term
    if any(p in text for p in leg_patterns):
        return "EXCLUDED", "LEGAL_OR_DOCUMENT_TERM", "Matches legal/document terminology", 0
        
    # 2. Location
    if any(p in text for p in loc_patterns):
        return "EXCLUDED", "LOCATION", "Matches location terminology", 0
        
    # 3. Vehicle or Object
    if any(p in text for p in veh_patterns):
        return "EXCLUDED", "VEHICLE_OR_OBJECT", "Matches vehicle/object terminology", 0
        
    orig_type = str(row.get('entity_type')).upper()
    
    if orig_type == "PERSON":
        return "VALID_CANDIDATE", "PERSON_CANDIDATE", "None", 1
    elif orig_type == "ORGANIZATION":
        return "VALID_CANDIDATE", "ORGANIZATION_CANDIDATE", "None", 1
    else:
        return "EXCLUDED", orig_type, "Not a valid candidate type", 0

def main():
    print("These are graph-anomaly review candidates, not suspects. Human evidence review is required.\n")
    
    nodes_path = os.path.join("data", "case_type_cyber", "graphs", "ner_nodes_cleaned.json")
    feat_path = os.path.join("data", "case_type_cyber", "ml", "graph_features_rich_cleaned.csv")
    anom_path = os.path.join("data", "case_type_cyber", "ml", "anomaly_scores_cleaned.csv")
    
    with open(nodes_path, "r", encoding="utf-8") as f:
        nodes = json.load(f)
        
    df_nodes = pd.DataFrame(nodes).rename(columns={"id": "node_id", "label": "entity_type"})
    df_feat = pd.read_csv(feat_path, escapechar="\\")
    df_anom = pd.read_csv(anom_path, escapechar="\\")
    
    id_col = 'node_id' if 'node_id' in df_feat.columns else 'entity_id'
    
    # Remove duplicates
    df_nodes = df_nodes.drop_duplicates(subset=[id_col])
    df_feat = df_feat.drop_duplicates(subset=[id_col])
    df_anom = df_anom.drop_duplicates(subset=[id_col])
    
    df = pd.merge(df_feat, df_anom[[id_col, 'anomaly_score', 'is_anomaly']], on=id_col, how='inner')
    
    print(f"Row count before processing: {len(df)}")
    
    status_list = []
    reason_list = []
    ctype_list = []
    review_list = []
    
    for i, row in df.iterrows():
        st, ct, rs, req = apply_conservative_corrections(row)
        status_list.append(st)
        ctype_list.append(ct)
        reason_list.append(rs)
        review_list.append(req)
        
    df['candidate_status'] = status_list
    df['corrected_entity_type'] = ctype_list
    df['exclusion_reason'] = reason_list
    df['type_correction_reason'] = reason_list
    df['requires_human_review'] = review_list
    
    for field in ['is_suspect', 'reviewer', 'evidence_reference', 'review_notes']:
        df[field] = ""
        
    df_valid = df[df['candidate_status'] == 'VALID_CANDIDATE'].copy()
    df_rejected = df[df['candidate_status'] == 'EXCLUDED'].copy()
    
    df_valid = df_valid.sort_values(by='anomaly_score', ascending=False)
    top_valid = df_valid.head(50)
    
    out_valid = os.path.join("data", "case_type_cyber", "ml", "review_candidates_validated.csv")
    out_reject = os.path.join("data", "case_type_cyber", "ml", "review_candidates_rejected.csv")
    out_json = os.path.join("data", "case_type_cyber", "ml", "candidate_type_validation_report.json")
    out_md = os.path.join("data", "case_type_cyber", "ml", "candidate_type_validation_report.md")
    
    top_valid.to_csv(out_valid, index=False, escapechar="\\")
    df_rejected.to_csv(out_reject, index=False, escapechar="\\")
    
    counts = df['corrected_entity_type'].value_counts()
    
    report_dict = {
        "actual_row_count": len(df),
        "expected_queue_size": 50,
        "duplicate_identifiers": int(len(df) - df[id_col].nunique()),
        "missing_identifiers": int(df[id_col].isnull().sum()),
        "entity_type_counts": counts.to_dict(),
        "valid_candidate_total": len(df_valid),
        "rejected_total": len(df_rejected)
    }
    
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(report_dict, f, indent=4)
        
    with open(out_md, "w", encoding="utf-8") as f:
        f.write("# Candidate Type Validation Report\n\n")
        f.write("**WARNING: These are graph-anomaly review candidates, not suspects. Human evidence review is required.**\n\n")
        f.write(f"- Actual row count: {len(df)}\n")
        f.write(f"- Expected queue size: 50\n")
        f.write(f"- Duplicate identifiers: {report_dict['duplicate_identifiers']}\n")
        f.write(f"- Missing identifiers: {report_dict['missing_identifiers']}\n\n")
        f.write("## Entity Type Counts\n")
        for k, v in counts.items():
            f.write(f"- {k}: {v}\n")
            
        f.write("\n## Top 20 Valid Candidates\n")
        for i, row in top_valid.head(20).iterrows():
            f.write(f"1. **{row[id_col]}** (Score: {row['anomaly_score']:.4f}) - {row['corrected_entity_type']}\n")
            
    print("\nReport:")
    print(f" - Actual row count: {len(df)}")
    print(f" - Expected queue size: 50")
    print(f" - Duplicate identifiers: {report_dict['duplicate_identifiers']}")
    print(f" - Missing identifiers: {report_dict['missing_identifiers']}")
    
    print("\nEntity type counts:")
    for k, v in counts.items():
        print(f"  {k}: {v}")
        
    print("\nTop 20 Valid Candidates:")
    for i, row in top_valid.head(20).iterrows():
        print(f"  {row[id_col]} (Score: {row['anomaly_score']:.4f}) - {row['corrected_entity_type']}")

if __name__ == "__main__":
    main()
