import os
import json
import pandas as pd
import glob
import re

def normalize_text_for_search(text):
    text = str(text)
    text = text.strip()
    text = re.sub(r'\s+', ' ', text)
    text = text.replace('–', '-').replace('—', '-')
    return text.lower()

def get_context(text, start, end, window=300):
    start_idx = max(0, start - window)
    end_idx = min(len(text), end + window)
    prefix = text[start_idx:start].replace('\n', ' ')
    suffix = text[end:end_idx].replace('\n', ' ')
    entity = text[start:end].replace('\n', ' ')
    return f"...{prefix} [[ {entity} ]] {suffix}..."

def main():
    print("WARNING: Graph anomaly is not evidence of criminality. Entity type must be corrected using surrounding text. Suspect status requires explicit case evidence. Uncertain entries must remain UNKNOWN.\n")
    
    cand_path = os.path.join("data", "case_type_cyber", "ml", "review_candidates_semantic.csv")
    feat_path = os.path.join("data", "case_type_cyber", "ml", "graph_features_rich_cleaned.csv")
    
    if not os.path.exists(cand_path):
        print(f"Candidates file not found: {cand_path}")
        return
        
    df_cand = pd.read_csv(cand_path, escapechar="\\")
    df_feat = pd.read_csv(feat_path, escapechar="\\")
    
    id_col = 'node_id' if 'node_id' in df_cand.columns else 'entity_id'
    
    candidates = {}
    for i, row in df_cand.iterrows():
        node_id = row[id_col]
        norm_text = normalize_text_for_search(row['entity_text'])
        # lookup features
        feat_row = df_feat[df_feat[id_col] == node_id]
        degree = feat_row['degree'].iloc[0] if not feat_row.empty else ""
        pagerank = feat_row['pagerank'].iloc[0] if not feat_row.empty else ""
        
        candidates[node_id] = {
            "node_id": node_id,
            "orig_text": row['entity_text'],
            "norm_text": norm_text,
            "semantic_category": row['semantic_category'],
            "anomaly_score": row['anomaly_score'],
            "degree": degree,
            "pagerank": pagerank,
            "is_generic_artifact": row.get('is_generic_artifact', 0),
            "candidate_status": row['candidate_status']
        }
    
    jsonl_files = glob.glob(os.path.join("data", "**", "*.jsonl"), recursive=True)
    occurrences = []
    
    for jf in jsonl_files:
        with open(jf, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip(): continue
                try:
                    data = json.loads(line)
                except:
                    continue
                    
                text = data.get("text", "")
                text_lower = text.lower()
                meta = data.get("meta", {})
                case_id = meta.get("case_id", "")
                page = meta.get("page_number", "")
                
                for node_id, cand in candidates.items():
                    norm_text = cand["norm_text"]
                    
                    idx = text_lower.find(norm_text)
                    start_pos = 0
                    while idx != -1:
                        end_idx = idx + len(norm_text)
                        context = get_context(text, idx, end_idx, 300)
                        
                        occurrences.append({
                            "node_id": node_id,
                            "original_entity_text": cand["orig_text"],
                            "original_ner_entity_type": cand["node_id"].split("|")[0] if "|" in cand["node_id"] else "",
                            "corrected_semantic_category": cand["semantic_category"],
                            "case_id": case_id,
                            "source_file": os.path.basename(jf),
                            "page_number": page,
                            "char_start": idx,
                            "char_end": end_idx,
                            "context_window": context,
                            "anomaly_score": cand["anomaly_score"],
                            "degree": cand["degree"],
                            "pagerank": cand["pagerank"],
                            "is_generic_artifact": cand["is_generic_artifact"],
                            "candidate_status": cand["candidate_status"],
                            "match_status": "MATCHED"
                        })
                        start_pos = end_idx
                        idx = text_lower.find(norm_text, start_pos)

    df_occ = pd.DataFrame(occurrences)
    
    matched_ids = set(df_occ['node_id']) if not df_occ.empty else set()
    unmatched = []
    
    for node_id, cand in candidates.items():
        if node_id not in matched_ids:
            unmatched.append({
                "node_id": node_id,
                "original_entity_text": cand["orig_text"],
                "original_ner_entity_type": cand["node_id"].split("|")[0] if "|" in cand["node_id"] else "",
                "corrected_semantic_category": cand["semantic_category"],
                "case_id": "",
                "source_file": "",
                "page_number": "",
                "char_start": "",
                "char_end": "",
                "context_window": "",
                "anomaly_score": cand["anomaly_score"],
                "degree": cand["degree"],
                "pagerank": cand["pagerank"],
                "is_generic_artifact": cand["is_generic_artifact"],
                "candidate_status": cand["candidate_status"],
                "match_status": "UNMATCHED"
            })
            
    df_unmatched = pd.DataFrame(unmatched)
    
    review_cols = [
        "context_entity_type", "context_role", "is_suspect", 
        "reviewer", "evidence_reference", "review_notes", "review_status"
    ]
    
    for col in review_cols:
        if not df_occ.empty:
            df_occ[col] = ""
        if not df_unmatched.empty:
            df_unmatched[col] = ""
            
    # Move match_status to before review_cols
    if not df_occ.empty:
        cols = list(df_occ.columns)
        for col in review_cols: cols.remove(col)
        df_occ = df_occ[cols + review_cols]
        
    out_review = os.path.join("data", "case_type_cyber", "ml", "entity_context_review.csv")
    out_unmatched = os.path.join("data", "case_type_cyber", "ml", "entity_context_unmatched.csv")
    out_instructions = os.path.join("data", "case_type_cyber", "ml", "entity_context_review_instructions.md")
    
    if not df_occ.empty:
        df_occ.to_csv(out_review, index=False, escapechar="\\")
    else:
        pd.DataFrame(columns=review_cols).to_csv(out_review, index=False)
        
    if not df_unmatched.empty:
        df_unmatched.to_csv(out_unmatched, index=False, escapechar="\\")
    else:
        pd.DataFrame(columns=review_cols).to_csv(out_unmatched, index=False)
        
    with open(out_instructions, "w", encoding="utf-8") as f:
        f.write("# Context-Aware Entity Review Instructions\n\n")
        f.write("**WARNING: Graph anomaly is not evidence of criminality.**\n\n")
        f.write("1. Entity type must be corrected using surrounding text in the `context_window`.\n")
        f.write("2. Suspect status (`is_suspect`) requires explicit case evidence.\n")
        f.write("3. Reviewer must record a case/page reference in `evidence_reference`.\n")
        f.write("4. Uncertain entries must remain UNKNOWN.\n\n")
        
        f.write("## Controlled Values\n")
        f.write("**context_entity_type:**\n")
        f.write("PERSON, ORGANIZATION, LOCATION, INFRASTRUCTURE, TECHNICAL_TERM, VEHICLE_OR_OBJECT, DOCUMENT_ARTIFACT, LEGAL_TERM, UNKNOWN\n\n")
        
        f.write("**context_role:**\n")
        f.write("SUSPECT_OR_ACCUSED, VICTIM, WITNESS, COMPLAINANT, OFFICIAL_OR_INSTITUTION, SERVICE_PROVIDER, LOCATION_REFERENCE, OBJECT_OR_IDENTIFIER, UNKNOWN\n\n")
        
    print(f"Candidate count: {len(candidates)}")
    print(f"Occurrence count: {len(df_occ)}")
    print(f"Matched candidates: {len(matched_ids)}")
    print(f"Unmatched candidates: {len(unmatched)}")
    
    if not df_occ.empty:
        multi_context = (df_occ['node_id'].value_counts() > 1).sum()
        print(f"Candidates with multiple contexts: {multi_context}")
        print("\nSource file distribution:")
        print(df_occ['source_file'].value_counts().to_string())
        
        print("\nSample context rows:")
        for i, row in df_occ.head(3).iterrows():
            print(f"\n--- {row['node_id']} in {row['source_file']} ---")
            print(f"Text: {row['context_window']}")

if __name__ == "__main__":
    main()
