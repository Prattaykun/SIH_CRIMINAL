import os
import json
import pandas as pd
import re

def normalize_text(text):
    text = str(text)
    text = text.strip()
    text = re.sub(r'\s+', ' ', text)
    text = text.replace('–', '-').replace('—', '-')
    return text

def contains_any(text_lower, patterns):
    # Match as full words or obvious substrings
    # Some are substrings (like 'upi'), some should be words.
    # Simple substring match works based on prompt constraints.
    return any(p in text_lower for p in patterns)

def classify_semantic(row):
    orig_text = str(row['entity_text'])
    norm_text = normalize_text(orig_text)
    text = norm_text.lower()
    
    tech_terms = ['upi', 'upi id', 'cpu', 'digital', 'phone', 'mobile', 'imsi', 'ip', 'inr', 'cdr', 'kyc', 'aadhaar', 'account', 'bank', 'payment', 'telecom']
    doc_terms = ['exhibit', 'dossier', 'sheet', 'analysis', 'reconstruction', 'movement', 'memo', 'statement', 'register', 'details', 'narrative', 'reference', 'task', 'action', 'preservation', 'excerpt', 'seized', 'batch', 'disbursal']
    loc_terms = ['wagholi', 'village rajeana', 'anaura kalan', 'mumbai', 'pune', 'lucknow', 'kolkata', 'jaipur', 'bhopal', 'patna', 'coimbatore', 'road', 'nagar', 'khand', 'chowk', 'station', 'outpost']
    veh_terms = ['honda', 'toyota', 'maruti', 'vehicle', 'bicycle', 'frame', 'tire', 'serial', 'chassis', 'house']
    leg_terms = ['ipc', 'magistrate', 'persons', 'custody', 'accused', 'fir', 'complaint', 'section', 'order']
    
    # Exact match for short acronyms like ip, cdr
    if text in tech_terms or contains_any(text, tech_terms):
        return "EXCLUDED", "TECHNICAL_TERM", "Matches technical term", 0
    if contains_any(text, doc_terms):
        return "EXCLUDED", "DOCUMENT_ARTIFACT", "Matches document artifact", 0
    if contains_any(text, loc_terms):
        return "EXCLUDED", "LOCATION", "Matches generic location", 0
    if contains_any(text, veh_terms):
        return "EXCLUDED", "VEHICLE_OR_OBJECT", "Matches vehicle/object", 0
    if contains_any(text, leg_terms):
        return "EXCLUDED", "LEGAL_OR_DOCUMENT_TERM", "Matches legal term", 0
        
    has_digits = bool(re.search(r'\d', text))
    has_weird_punct = bool(re.search(r'[/\\:-]', text))
    tokens = text.split()
    num_tokens = len(tokens)
    
    if 2 <= num_tokens <= 4 and not has_digits and not has_weird_punct and row.get('entity_type', '').upper() == 'PERSON':
        return "VALID_CANDIDATE", "PERSON_CANDIDATE", "None", 1
        
    if 1 <= num_tokens <= 6 and not has_digits and not has_weird_punct and row.get('entity_type', '').upper() == 'ORGANIZATION':
        return "VALID_CANDIDATE", "ORGANIZATION_CANDIDATE", "None", 1
        
    return "REVIEW_REQUIRED", "UNCERTAIN", "Does not strictly match candidate rules", 1

def main():
    print("These are graph-anomaly review candidates, not suspects. Human evidence review is required.\n")
    
    feat_path = os.path.join("data", "case_type_cyber", "ml", "graph_features_rich_cleaned.csv")
    anom_path = os.path.join("data", "case_type_cyber", "ml", "anomaly_scores_cleaned.csv")
    
    df_feat = pd.read_csv(feat_path, escapechar="\\")
    df_anom = pd.read_csv(anom_path, escapechar="\\")
    
    id_col = 'node_id' if 'node_id' in df_feat.columns else 'entity_id'
    
    df_feat = df_feat.drop_duplicates(subset=[id_col])
    df_anom = df_anom.drop_duplicates(subset=[id_col])
    
    df = pd.merge(df_feat, df_anom[[id_col, 'anomaly_score', 'is_anomaly']], on=id_col, how='inner')
    
    print(f"Original queue size (full canonical graph): {len(df)}")
    
    df['normalized_entity_text'] = df['entity_text'].apply(normalize_text)
    
    status_list = []
    category_list = []
    reason_list = []
    review_list = []
    ctype_list = []
    
    for i, row in df.iterrows():
        st, cat, rs, req = classify_semantic(row)
        status_list.append(st)
        category_list.append(cat)
        reason_list.append(rs)
        review_list.append(req)
        ctype_list.append(cat)
        
    df['candidate_status'] = status_list
    df['semantic_category'] = category_list
    df['exclusion_reason'] = reason_list
    df['quality_confidence'] = ["High" if st == "EXCLUDED" else "Medium" for st in status_list]
    df['requires_human_review'] = review_list
    df['corrected_entity_type'] = ctype_list
    
    for field in ['is_suspect', 'reviewer', 'evidence_reference', 'review_notes']:
        df[field] = ""
        
    df_valid = df[df['semantic_category'].isin(["PERSON_CANDIDATE", "ORGANIZATION_CANDIDATE"])].copy()
    df_excluded = df[~df['semantic_category'].isin(["PERSON_CANDIDATE", "ORGANIZATION_CANDIDATE"])].copy()
    
    df_valid = df_valid.sort_values(by='anomaly_score', ascending=False)
    top_valid = df_valid.head(50)
    
    out_valid = os.path.join("data", "case_type_cyber", "ml", "review_candidates_semantic.csv")
    out_exclude = os.path.join("data", "case_type_cyber", "ml", "review_candidates_excluded_semantic.csv")
    out_json = os.path.join("data", "case_type_cyber", "ml", "semantic_candidate_quality_report.json")
    
    top_valid.to_csv(out_valid, index=False, escapechar="\\")
    df_excluded.to_csv(out_exclude, index=False, escapechar="\\")
    
    counts = df['semantic_category'].value_counts()
    
    report_dict = {
        "original_queue_size": len(df),
        "final_queue_size": len(top_valid),
        "semantic_category_counts": counts.to_dict(),
        "duplicate_identifiers": int(len(df) - df[id_col].nunique())
    }
    
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(report_dict, f, indent=4)
        
    print(f"Final queue size: {len(top_valid)}")
    print(f"Duplicate count: {report_dict['duplicate_identifiers']}")
    print("\nCounts by semantic category:")
    print(counts.to_string())
    print("\nExcluded counts by reason:")
    print(df_excluded['exclusion_reason'].value_counts().to_string())
    
    print("\nFinal top 20 candidates:")
    for i, row in top_valid.head(20).iterrows():
        print(f"  {row[id_col]} (Score: {row['anomaly_score']:.4f}) - {row['semantic_category']}")

if __name__ == "__main__":
    main()
