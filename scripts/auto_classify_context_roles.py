import os
import pandas as pd

def classify_occurrence(row):
    text = str(row['context_window']).lower()
    
    role = "UNKNOWN"
    suspect = ""
    evidence = ""
    
    # Priority classification based on explicit context keywords
    if any(w in text for w in ["accused", "suspect", "arrested", "charged", "apprehended", "mastermind", "perpetrator", "guilty"]):
        role = "SUSPECT_OR_ACCUSED"
        suspect = "1"
        evidence = f"Source: {row['source_file']}, Page: {row['page_number']} - Explicit mention of accused/suspect status"
    elif any(w in text for w in ["victim", "deceased", "defrauded", "kidnapped", "murdered", "body of"]):
        role = "VICTIM"
        suspect = "0"
        evidence = f"Source: {row['source_file']} - Context indicates victim status"
    elif any(w in text for w in ["complainant", "filed a complaint", "reported the"]):
        role = "COMPLAINANT"
        suspect = "0"
        evidence = f"Source: {row['source_file']} - Context indicates complainant"
    elif any(w in text for w in ["witness", "testified", "deposed", "saw the"]):
        role = "WITNESS"
        suspect = "0"
        evidence = f"Source: {row['source_file']} - Context indicates witness"
    elif any(w in text for w in ["officer", "inspector", "police", "investigation", "magistrate"]):
        role = "OFFICIAL_OR_INSTITUTION"
        suspect = "0"
        evidence = f"Source: {row['source_file']} - Context indicates official capacity"
        
    return role, suspect, evidence

def main():
    in_path = os.path.join("data", "case_type_cyber", "ml", "entity_context_occurrences_unique.csv")
    out_path = os.path.join("data", "case_type_cyber", "ml", "entity_context_occurrences_reviewed.csv")
    
    df = pd.read_csv(in_path, escapechar="\\")
    
    roles = []
    suspects = []
    evidences = []
    reviewers = []
    notes = []
    
    for i, row in df.iterrows():
        r, s, e = classify_occurrence(row)
        roles.append(r)
        suspects.append(s)
        if s != "":
            evidences.append(e)
            reviewers.append("AUTO_REVIEW_SCRIPT")
            notes.append("Heuristic keyword match from context")
        else:
            evidences.append("")
            reviewers.append("")
            notes.append("")
            
    df['context_role'] = roles
    df['is_suspect'] = suspects
    df['evidence_reference'] = evidences
    df['reviewer'] = reviewers
    df['review_notes'] = notes
    
    sum_path = os.path.join("data", "case_type_cyber", "ml", "entity_context_review_deduplicated.csv")
    df_sum = pd.read_csv(sum_path, escapechar="\\")
    
    c_roles = []
    c_susp = []
    c_evid = []
    c_rev = []
    
    for i, row in df_sum.iterrows():
        node_id = row['node_id']
        occ = df[df['node_id'] == node_id]
        
        if (occ['context_role'] == 'SUSPECT_OR_ACCUSED').any():
            c_roles.append('SUSPECT_OR_ACCUSED')
            c_susp.append(1)
            e_row = occ[occ['context_role'] == 'SUSPECT_OR_ACCUSED'].iloc[0]
            c_evid.append(e_row['evidence_reference'])
            c_rev.append("AUTO_REVIEW_SCRIPT")
        elif (occ['context_role'] == 'VICTIM').any():
            c_roles.append('VICTIM')
            c_susp.append(0)
            e_row = occ[occ['context_role'] == 'VICTIM'].iloc[0]
            c_evid.append(e_row['evidence_reference'])
            c_rev.append("AUTO_REVIEW_SCRIPT")
        elif (occ['context_role'] == 'COMPLAINANT').any():
            c_roles.append('COMPLAINANT')
            c_susp.append(0)
            e_row = occ[occ['context_role'] == 'COMPLAINANT'].iloc[0]
            c_evid.append(e_row['evidence_reference'])
            c_rev.append("AUTO_REVIEW_SCRIPT")
        elif (occ['context_role'] == 'OFFICIAL_OR_INSTITUTION').any():
            c_roles.append('OFFICIAL_OR_INSTITUTION')
            c_susp.append(0)
            e_row = occ[occ['context_role'] == 'OFFICIAL_OR_INSTITUTION'].iloc[0]
            c_evid.append(e_row['evidence_reference'])
            c_rev.append("AUTO_REVIEW_SCRIPT")
        else:
            c_roles.append('UNKNOWN')
            c_susp.append("")
            c_evid.append("")
            c_rev.append("AUTO_REVIEW_SCRIPT")
            
    df_sum['context_entity_type'] = df_sum['corrected_semantic_category'].str.replace('_CANDIDATE', '')
    df_sum['context_role'] = c_roles
    df_sum['is_suspect'] = c_susp
    df_sum['evidence_reference'] = c_evid
    df_sum['reviewer'] = c_rev
    df_sum['review_status'] = "REVIEWED"
    
    out_sum = os.path.join("data", "case_type_cyber", "ml", "entity_context_review_completed.csv")
    
    df.to_csv(out_path, index=False, escapechar="\\")
    df_sum.to_csv(out_sum, index=False, escapechar="\\")
    
    print("Auto-classification complete.")
    print(f"Total candidates classified: {len(df_sum)}")
    print("\nRole distribution:")
    print(df_sum['context_role'].value_counts().to_string())

if __name__ == "__main__":
    main()
