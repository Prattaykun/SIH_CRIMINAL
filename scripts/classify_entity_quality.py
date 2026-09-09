import os
import pandas as pd

def main():
    in_path = os.path.join("data", "case_type_cyber", "ml", "canonical_entity_features.csv")
    out_path = os.path.join("data", "case_type_cyber", "ml", "canonical_entity_features_classified.csv")
    
    df = pd.read_csv(in_path, escapechar="\\")
    
    is_generic = []
    artifact_reasons = []
    qualities = []
    review_reasons = []
    
    document_artifacts = [
        "immediate investigative tasks", "initial entity", "complaint narrative",
        "case file association", "doc", "cctv", "whatsapp", "inr", "cdr", "kyc"
    ]
    
    institutions = ["rto", "fsl", "telecom"]
    generic_tech = ["phone", "ip", "vehicle"]
    
    for _, row in df.iterrows():
        text = str(row['entity_text']).lower().strip()
        etype = str(row['entity_type']).upper()
        
        flagged = 1
        reason = ""
        quality = "unknown"
        r_reason = "No flag"
        
        # Exact matching against common lists
        if any(art == text for art in document_artifacts):
            reason = "Matches known document artifact"
            quality = "document_artifact"
            r_reason = "Artifact"
        elif any(inst == text for inst in institutions):
            reason = "Public institution or infrastructure"
            quality = "public_institution_or_infrastructure"
            r_reason = "Infrastructure"
        elif any(tech == text for tech in generic_tech):
            reason = "Generic technical/identifier class"
            quality = "generic_technical_term"
            r_reason = "Generic Term"
        # Type-based filtering
        elif etype == "LOCATION":
            flagged = 0
            quality = "location"
            r_reason = "Standard location"
        elif etype == "PERSON":
            flagged = 0
            quality = "person_candidate"
            r_reason = "Candidate person"
        else:
            flagged = 0
            quality = "unknown"
            
        is_generic.append(flagged)
        artifact_reasons.append(reason)
        qualities.append(quality)
        review_reasons.append(r_reason)
        
    df['is_generic_artifact'] = is_generic
    df['artifact_reason'] = artifact_reasons
    df['entity_quality'] = qualities
    df['review_reason'] = review_reasons
    
    df.to_csv(out_path, index=False)
    
    print("\n--- Classification Summary ---")
    print("\nEntity Quality Counts:")
    print(df['entity_quality'].value_counts())
    print("\nArtifact Reason Counts (where flagged):")
    print(df[df['is_generic_artifact'] == 1]['artifact_reason'].value_counts())
    print("\nEntity Type Counts:")
    print(df['entity_type'].value_counts())

if __name__ == "__main__":
    main()
