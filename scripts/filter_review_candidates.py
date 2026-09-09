import os
import json
import pandas as pd

def contains_verb_slash_long(text):
    text = str(text)
    if '/' in text or '\\' in text:
        return True, "Contains slash or backslash"
    words = text.split()
    if len(words) >= 5:
        return True, "Long sentence fragment (>= 5 words)"
    # Basic heuristics
    instruct_words = ["seizure", "excerpt", "memo", "action", "initial", "preservation", "disbursal", "reference", "counterparty", "narration", "batch", "tasks", "entity", "details", "report", "statement"]
    lower_text = text.lower()
    for w in instruct_words:
        if w in lower_text.split():
            return True, f"Contains document/instructional term '{w}'"
    return False, ""

def classify_and_correct(row):
    text = str(row['entity_text']).lower().strip()
    orig_type = str(row['entity_type']).upper()
    
    # Defaults
    status = "VALID_CANDIDATE"
    reason = "None"
    req_review = 0
    c_type = "UNKNOWN"
    
    payment_terms = ['upi', 'upi id', 'inr', 'kyc', 'cdr', 'digital', 'rtgs', 'neft']
    if text in payment_terms:
        return "EXCLUDED", "Payment/Telecom term", "TECHNICAL_TERM", 0
        
    if "first information report" in text or "complaint" in text or "case file" in text:
        return "EXCLUDED", "Document heading", "DOCUMENT_ARTIFACT", 0
        
    infra = ['rto', 'fsl', 'telecom', 'police', 'bank', 'hospital']
    if any(i in text for i in infra):
        return "EXCLUDED", "Public infrastructure/institution", "INFRASTRUCTURE", 0
        
    has_flag, flag_reason = contains_verb_slash_long(row['entity_text'])
    if has_flag:
        return "EXCLUDED", flag_reason, "DOCUMENT_ARTIFACT", 0
        
    locations = ['gomti nagar', 'vibhuti khand', 'mumbai', 'pune', 'delhi', 'jaipur', 'lucknow', 'khand']
    if any(loc in text for loc in locations):
        return "EXCLUDED", "Generic location", "LOCATION", 0
        
    if orig_type == "LOCATION":
        return "EXCLUDED", "Standard location", "LOCATION", 0
        
    if orig_type == "PERSON":
        c_type = "PERSON_CANDIDATE"
        req_review = 1
    elif orig_type == "ORGANIZATION":
        c_type = "ORGANIZATION_CANDIDATE"
        req_review = 1
    else:
        status = "REVIEW_REQUIRED"
        c_type = orig_type
        req_review = 1
        reason = "Uncertain classification"
        
    return status, reason, c_type, req_review

def main():
    print("WARNING: Graph anomaly is not evidence of criminality. Structural outliers often represent normal central infrastructure.\n")
    
    feat_path = os.path.join("data", "case_type_cyber", "ml", "graph_features_rich_cleaned.csv")
    anom_path = os.path.join("data", "case_type_cyber", "ml", "anomaly_scores_cleaned.csv")
    
    if not os.path.exists(feat_path) or not os.path.exists(anom_path):
        print("Required files not found.")
        return
        
    df_feat = pd.read_csv(feat_path, escapechar="\\")
    df_anom = pd.read_csv(anom_path, escapechar="\\")
    
    id_col = 'node_id' if 'node_id' in df_feat.columns else 'entity_id'
    
    # Ensure one row per node
    df_feat = df_feat.drop_duplicates(subset=[id_col])
    df_anom = df_anom.drop_duplicates(subset=[id_col])
    
    df = pd.merge(df_feat, df_anom[[id_col, 'anomaly_score', 'is_anomaly']], on=id_col, how='inner')
    
    status_list = []
    reason_list = []
    ctype_list = []
    review_list = []
    
    for i, row in df.iterrows():
        st, rs, ct, req = classify_and_correct(row)
        status_list.append(st)
        reason_list.append(rs)
        ctype_list.append(ct)
        review_list.append(req)
        
    df['candidate_status'] = status_list
    df['exclusion_reason'] = reason_list
    df['corrected_entity_type'] = ctype_list
    df['requires_human_review'] = review_list
    
    for field in ['is_suspect', 'reviewer', 'evidence_reference', 'review_notes']:
        df[field] = ""
        
    df_excluded = df[df['candidate_status'] == 'EXCLUDED']
    df_valid = df[df['candidate_status'] != 'EXCLUDED']
    
    valid_types = ["PERSON_CANDIDATE", "ORGANIZATION_CANDIDATE"]
    df_valid_filtered = df_valid[df_valid['corrected_entity_type'].isin(valid_types)]
    top50 = df_valid_filtered.sort_values(by='anomaly_score', ascending=False).head(50)
    
    out_valid = os.path.join("data", "case_type_cyber", "ml", "review_candidates_clean.csv")
    out_excluded = os.path.join("data", "case_type_cyber", "ml", "review_excluded_entities.csv")
    
    top50.to_csv(out_valid, index=False, escapechar="\\")
    df_excluded.to_csv(out_excluded, index=False, escapechar="\\")
    
    print(f"Total canonical nodes: {len(df)}")
    print(f"Valid candidate count: {len(df_valid)}")
    print(f"Duplicate count: {len(df) - df[id_col].nunique()}")
    
    print("\nExcluded count by reason:")
    print(df_excluded['exclusion_reason'].value_counts().to_string())
    
    print("\nCorrected entity-type counts:")
    print(df['corrected_entity_type'].value_counts().to_string())
    
    print("\nTop 20 valid candidates:")
    for i, row in top50.head(20).iterrows():
        print(f"  {row[id_col]} (Score: {row['anomaly_score']:.4f}) - {row['corrected_entity_type']}")

if __name__ == "__main__":
    main()
