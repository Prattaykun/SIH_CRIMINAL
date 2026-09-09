# =======================================================================
# SIH-26189: Kidnapping Case Integration Runbook (v5)
# =======================================================================
# Warning: This runbook assumes the 4 new PDFs are available in 
# D:\Sih\kidnappingabduction. Do not present proxy metrics as verified 
# suspect-detection performance. Graph anomaly is not evidence of criminality.
# =======================================================================

$ErrorActionPreference = "Stop"

Write-Host "1. Organizing new kidnapping cases..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "data\case_type_kidnapping\raw\CASE-2026-SYN-KIDNAP-04"
New-Item -ItemType Directory -Force -Path "data\case_type_kidnapping\raw\CASE-2026-SYN-KIDNAP-05"
New-Item -ItemType Directory -Force -Path "data\case_type_kidnapping\raw\CASE-2026-SYN-KIDNAP-06"
New-Item -ItemType Directory -Force -Path "data\case_type_kidnapping\raw\CASE-2026-SYN-KIDNAP-07"

# Move PDFs if they exist
if (Test-Path "kidnappingabduction") {
    if (Test-Path "kidnappingabduction\kidnapping,abduction1.pdf") {
        Move-Item -Force "kidnappingabduction\kidnapping,abduction1.pdf" "data\case_type_kidnapping\raw\CASE-2026-SYN-KIDNAP-04\case_kidnap_04.pdf"
    }
    if (Test-Path "kidnappingabduction\kidnapping 2.pdf") {
        Move-Item -Force "kidnappingabduction\kidnapping 2.pdf" "data\case_type_kidnapping\raw\CASE-2026-SYN-KIDNAP-05\case_kidnap_05.pdf"
    }
    if (Test-Path "kidnappingabduction\kidnapping3.pdf") {
        Move-Item -Force "kidnappingabduction\kidnapping3.pdf" "data\case_type_kidnapping\raw\CASE-2026-SYN-KIDNAP-06\case_kidnap_06.pdf"
    }
    if (Test-Path "kidnappingabduction\kidnapping4.pdf") {
        Move-Item -Force "kidnappingabduction\kidnapping4.pdf" "data\case_type_kidnapping\raw\CASE-2026-SYN-KIDNAP-07\case_kidnap_07.pdf"
    }
} else {
    Write-Host "WARNING: kidnappingabduction folder not found. Proceeding with existing extraction." -ForegroundColor Yellow
}

Write-Host "`n2. Extracting and labeling new cases..." -ForegroundColor Cyan
python scripts\extract_kidnapping_cases_to_jsonl.py
python scripts\label_kidnapping_cases_with_local_ner.py

Write-Host "`n3. Merging unified NER dataset..." -ForegroundColor Cyan
python scripts\merge_kidnapping_and_murder_into_ner.py

Write-Host "`n4. Preparing updated splits..." -ForegroundColor Cyan
python scripts\prepare_ner_splits_full.py

Write-Host "`n5. Converting to spaCy format..." -ForegroundColor Cyan
python scripts\convert_doccano_to_spacy.py

Write-Host "`n6. Retraining NER model (v5)..." -ForegroundColor Cyan
python -m spacy train config.cfg --output ./models/ner_v5

Write-Host "`n7. Evaluating NER model (v5)..." -ForegroundColor Cyan
python scripts\evaluate_ner_model.py

Write-Host "`n8. Rebuilding network graph (v5)..." -ForegroundColor Cyan
python scripts\build_network_graph.py

Write-Host "`n9. Cleaning graph entities (v5)..." -ForegroundColor Cyan
python scripts\clean_graph_entities.py data\case_type_cyber\graphs\ner_nodes_full_v5.json data\case_type_cyber\graphs\ner_edges_full_v5.json data\case_type_cyber\graphs\ner_nodes_cleaned_v5.json data\case_type_cyber\graphs\ner_edges_cleaned_v5.json

Write-Host "`n10. Building graph features (v5)..." -ForegroundColor Cyan
python scripts\build_graph_features_for_ml.py data\case_type_cyber\graphs\ner_nodes_cleaned_v5.json data\case_type_cyber\graphs\ner_edges_cleaned_v5.json data\case_type_cyber\ml\graph_features_rich_cleaned_v5.csv

Write-Host "`n11. Retraining Isolation Forest (v2)..." -ForegroundColor Cyan
python scripts\train_isolation_forest.py data\case_type_cyber\ml\graph_features_rich_cleaned_v5.csv data\case_type_cyber\ml\anomaly_scores_cleaned_v5.csv

Write-Host "`n12. Rebuilding candidate review queue..." -ForegroundColor Cyan
Copy-Item "data\case_type_cyber\ml\graph_features_rich_cleaned_v5.csv" "data\case_type_cyber\ml\graph_features_rich_cleaned.csv" -Force
Copy-Item "data\case_type_cyber\ml\anomaly_scores_cleaned_v5.csv" "data\case_type_cyber\ml\anomaly_scores_cleaned.csv" -Force

python scripts\filter_review_candidates.py
python scripts\semantic_candidate_quality_gate.py
python scripts\build_entity_context_review.py
python scripts\deduplicate_entity_context_review.py
python scripts\auto_classify_context_roles.py
python scripts\validate_context_review.py

# Assuming auto_classify_context_roles / validate outputs to completed_v5 
Copy-Item "data\case_type_cyber\ml\entity_context_review_completed.csv" "data\case_type_cyber\ml\entity_context_review_completed_v5.csv" -ErrorAction SilentlyContinue

Write-Host "`n13. Retraining proxy Random Forest (v2)..." -ForegroundColor Cyan
python scripts\train_random_forest_context_proxy.py data\case_type_cyber\ml\entity_context_review_completed_v5.csv data\case_type_cyber\ml\graph_features_rich_cleaned_v5.csv

Write-Host "`nIntegration Pipeline Complete!" -ForegroundColor Green
Write-Host "WARNING: Models generated are for experimental analytical review only. Do not rely on proxy metrics for suspect classification." -ForegroundColor Yellow
