import os
import json
import pandas as pd

def categorize_source(filename):
    fname = str(filename).lower()
    
    # Derived / duplicate files
    if fname in ['train.jsonl', 'dev.jsonl', 'val.jsonl', 'test.jsonl']:
        return "EXCLUDED", "Derived split file"
    if 'auto_labeled' in fname:
        return "EXCLUDED", "Derived auto-labeled file"
    if 'doccano_all_labeled' in fname:
        return "EXCLUDED", "Merged historical copy"
    if 'import.jsonl' in fname:
        return "EXCLUDED", "Import/export historical copy"
        
    return "KEPT", "Authoritative source"

def main():
    print("WARNING: Repeated appearances in derived datasets are not independent evidence. Review unique source occurrences only.\n")
    
    in_path = os.path.join("data", "case_type_cyber", "ml", "entity_context_review.csv")
    
    if not os.path.exists(in_path):
        print("Required file not found.")
        return
        
    df = pd.read_csv(in_path, escapechar="\\")
    
    original_row_count = len(df)
    
    # Categorize sources
    source_status = []
    source_reason = []
    for f in df['source_file']:
        st, rs = categorize_source(f)
        source_status.append(st)
        source_reason.append(rs)
        
    df['source_status'] = source_status
    df['duplicate_reason'] = source_reason
    
    # Files
    excluded_files = set(df[df['source_status'] == 'EXCLUDED']['source_file'])
    retained_files = set(df[df['source_status'] == 'KEPT']['source_file'])
    
    # Split df
    df_kept = df[df['source_status'] == 'KEPT'].copy()
    df_excluded = df[df['source_status'] == 'EXCLUDED'].copy()
    
    # Deduplicate within kept (by node_id, case_id, page_number, char_start)
    df_kept['canonical_key'] = df_kept['node_id'].astype(str) + "_" + df_kept['case_id'].astype(str) + "_" + df_kept['page_number'].astype(str) + "_" + df_kept['char_start'].astype(str)
    
    # Mark duplicates
    is_dup = df_kept.duplicated(subset=['canonical_key'], keep='first')
    
    df_unique = df_kept[~is_dup].copy()
    df_kept_dups = df_kept[is_dup].copy()
    df_kept_dups['duplicate_reason'] = "Exact occurrence duplicate in authoritative sources"
    df_kept_dups['source_status'] = "EXCLUDED"
    
    # Combine all duplicates
    df_duplicates = pd.concat([df_excluded, df_kept_dups], ignore_index=True)
    
    # Summary (Candidate level)
    summary_rows = []
    for node_id, group in df_unique.groupby('node_id'):
        row0 = group.iloc[0]
        
        unique_cases = group['case_id'].nunique()
        unique_pages = group['page_number'].nunique()
        unique_docs = group['source_file'].nunique()
        
        first_occ = group['source_file'].iloc[0]
        last_occ = group['source_file'].iloc[-1]
        
        summary_rows.append({
            "node_id": node_id,
            "original_entity_text": row0['original_entity_text'],
            "original_ner_entity_type": row0['original_ner_entity_type'],
            "corrected_semantic_category": row0['corrected_semantic_category'],
            "candidate_status": row0['candidate_status'],
            "anomaly_score": row0['anomaly_score'],
            "degree": row0.get('degree', ''),
            "pagerank": row0.get('pagerank', ''),
            "is_generic_artifact": row0.get('is_generic_artifact', ''),
            "unique_case_count": unique_cases,
            "unique_page_count": unique_pages,
            "unique_doc_count": unique_docs,
            "first_source_occurrence": first_occ,
            "last_source_occurrence": last_occ,
            "context_entity_type": "",
            "context_role": "",
            "is_suspect": "",
            "reviewer": "",
            "evidence_reference": "",
            "review_notes": "",
            "review_status": ""
        })
        
    df_summary = pd.DataFrame(summary_rows)
    # Sort summary by anomaly score
    if not df_summary.empty:
        df_summary = df_summary.sort_values(by='anomaly_score', ascending=False)
    
    out_summary = os.path.join("data", "case_type_cyber", "ml", "entity_context_review_deduplicated.csv")
    out_occ = os.path.join("data", "case_type_cyber", "ml", "entity_context_occurrences_unique.csv")
    out_dup = os.path.join("data", "case_type_cyber", "ml", "entity_context_duplicates.csv")
    out_json = os.path.join("data", "case_type_cyber", "ml", "entity_context_dedup_report.json")
    
    df_summary.to_csv(out_summary, index=False, escapechar="\\")
    
    review_cols = [
        "context_entity_type", "context_role", "is_suspect", 
        "reviewer", "evidence_reference", "review_notes", "review_status"
    ]
    for c in review_cols:
        df_unique[c] = ""
        if not df_duplicates.empty:
            df_duplicates[c] = ""
            
    df_unique.drop(columns=['canonical_key', 'source_status', 'duplicate_reason'], errors='ignore').to_csv(out_occ, index=False, escapechar="\\")
    
    if not df_duplicates.empty:
        df_duplicates.drop(columns=['canonical_key', 'source_status'], errors='ignore').to_csv(out_dup, index=False, escapechar="\\")
    else:
        pd.DataFrame(columns=list(df_unique.columns) + ['duplicate_reason']).to_csv(out_dup, index=False)
    
    multi_context = (df_unique['node_id'].value_counts() > 1).sum()
    
    report_dict = {
        "original_row_count": original_row_count,
        "unique_occurrence_count": len(df_unique),
        "duplicate_row_count": len(df_duplicates),
        "candidate_count": len(df_summary),
        "unique_case_count": int(df_unique['case_id'].nunique()) if not df_unique.empty else 0,
        "unique_page_count": int(df_unique['page_number'].nunique()) if not df_unique.empty else 0,
        "source_files_retained": list(retained_files),
        "source_files_excluded": list(excluded_files),
        "candidates_with_multiple_contexts": int(multi_context)
    }
    
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(report_dict, f, indent=4)
        
    print(f"Original row count: {original_row_count}")
    print(f"Unique occurrence count: {len(df_unique)}")
    print(f"Duplicate row count: {len(df_duplicates)}")
    print(f"Candidate count: {len(df_summary)}")
    print(f"Unique case count: {report_dict['unique_case_count']}")
    print(f"Unique page count: {report_dict['unique_page_count']}")
    
    print("\nSource files retained:")
    for rf in retained_files: print(f" - {rf}")
    
    print("\nSource files excluded as derived duplicates:")
    for ef in excluded_files: print(f" - {ef}")
    
    print(f"\nCandidates with multiple genuine contexts: {multi_context}")

if __name__ == "__main__":
    main()
