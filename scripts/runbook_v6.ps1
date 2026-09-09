# =======================================================================
# SIH-26189: Murder Case Integration Runbook (v6)
# =======================================================================
# Warning: This runbook assumes the 13 new PDFs are available in 
# D:\Sih\murder. Do not present proxy metrics as verified 
# suspect-detection performance. Graph anomaly is not evidence of criminality.
# =======================================================================

Write-Host "1. Organizing 13 new murder cases..." -ForegroundColor Cyan

# Find all PDFs in the murder directory
$murderPdfs = Get-ChildItem -Path "murder" -Filter "*.pdf" -File
if ($murderPdfs.Count -eq 0) {
    Write-Host "WARNING: No PDFs found in D:\Sih\murder. Proceeding with existing data." -ForegroundColor Yellow
} else {
    $counter = 1
    foreach ($pdf in $murderPdfs) {
        $caseId = "CASE-2026-SYN-MURDER-{0:D2}" -f $counter
        $targetDir = "data\case_type_murder\raw\$caseId"
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
        $targetPath = Join-Path $targetDir "case_murder_{0:D2}.pdf" -f $counter
        Move-Item -Force $pdf.FullName $targetPath
        $counter++
    }
    Write-Host "Moved $($murderPdfs.Count) PDFs to raw folders."
}

Write-Host "`n2. Extracting and labeling new cases..." -ForegroundColor Cyan
python scripts\extract_murder_cases_to_jsonl.py
python scripts\label_murder_cases_with_local_ner.py

Write-Host "`n3. Merging into unified NER dataset (v6)..." -ForegroundColor Cyan
python scripts\merge_murder_into_ner.py

Write-Host "`n4. Preparing updated splits (v6)..." -ForegroundColor Cyan
python scripts\prepare_ner_splits_v6.py

Write-Host "`n5. Converting to spaCy format..." -ForegroundColor Cyan
python scripts\convert_doccano_to_spacy_v6.py

Write-Host "`n6. Retraining NER model (v6)..." -ForegroundColor Cyan
python -m spacy train config.cfg --output ./models/ner_v6

Write-Host "`n7. Evaluating NER model (v6)..." -ForegroundColor Cyan
python scripts\evaluate_ner_model.py

Write-Host "`n8. Building network graph (v6) from unified labeled..." -ForegroundColor Cyan
(Get-Content scripts\build_network_graph.py) -replace '_v5\.json', '_v6.json' -replace 'ner_v5', 'ner_v6' | Set-Content scripts\build_network_graph.py
# Temporarily mock the input to the original script
Copy-Item "data\ner\doccano_all_labeled_unified_v6.jsonl" "data\ner\doccano_all_labeled_unified.jsonl" -Force
python scripts\build_network_graph.py

Write-Host "`n9. Cleaning graph entities (v6)..." -ForegroundColor Cyan
(Get-Content scripts\clean_graph_entities.py) -replace '_v5\.json', '_v6.json' | Set-Content scripts\clean_graph_entities.py
python scripts\clean_graph_entities.py

Write-Host "`n10. Building graph features (v6)..." -ForegroundColor Cyan
(Get-Content scripts\build_graph_features_for_ml.py) -replace '_v5\.json', '_v6.json' -replace '_v5\.csv', '_v6.csv' | Set-Content scripts\build_graph_features_for_ml.py
python scripts\build_graph_features_for_ml.py

Write-Host "`n11. Retraining Isolation Forest (v3)..." -ForegroundColor Cyan
(Get-Content scripts\train_isolation_forest.py) -replace '_v5\.csv', '_v6.csv' -replace '_v2\.pkl', '_v3.pkl' -replace '_v2_features\.json', '_v3_features.json' | Set-Content scripts\train_isolation_forest.py
python scripts\train_isolation_forest.py

Write-Host "`n12. Rebuilding candidate review queue..." -ForegroundColor Cyan
# Mock the generic names expected by the semantic gate suite
Copy-Item "data\case_type_cyber\ml\graph_features_rich_cleaned_v6.csv" "data\case_type_cyber\ml\graph_features_rich_cleaned.csv" -Force
Copy-Item "data\case_type_cyber\ml\anomaly_scores_cleaned_v6.csv" "data\case_type_cyber\ml\anomaly_scores_cleaned.csv" -Force

python scripts\filter_review_candidates.py
python scripts\semantic_candidate_quality_gate.py
python scripts\build_entity_context_review.py
python scripts\deduplicate_entity_context_review.py
python scripts\auto_classify_context_roles.py
python scripts\validate_context_review.py

Copy-Item "data\case_type_cyber\ml\entity_context_review_completed.csv" "data\case_type_cyber\ml\entity_context_review_completed_v6.csv" -Force

Write-Host "`n13. Retraining proxy Random Forest (v3)..." -ForegroundColor Cyan
(Get-Content scripts\train_random_forest_context_proxy.py) -replace '_v5\.csv', '_v6.csv' -replace '_v2\.pkl', '_v3.pkl' -replace '_v2_features\.json', '_v3_features.json' -replace '_predictions_v2\.csv', '_predictions_v3.csv' -replace '_v2_metrics\.json', '_v3_metrics.json' -replace '_LIMITATIONS_v2\.md', '_LIMITATIONS_v3.md' | Set-Content scripts\train_random_forest_context_proxy.py
python scripts\train_random_forest_context_proxy.py

Write-Host "`n14. Updating API and release manifest..." -ForegroundColor Cyan
(Get-Content app_ner_demo.py) -replace 'ner_v5', 'ner_v6' -replace 'random_forest_context_proxy_v2\.pkl', 'random_forest_context_proxy_v3.pkl' -replace 'release": "[a-f0-9]+"', 'release": "v6-murder-integration"' | Set-Content app_ner_demo.py

$manifestContent = @"
SIH 26189 Release Manifest
==========================
NER model: ner_v6
Graph model: cleaned graph features v6
Random Forest: context proxy v3
Random Forest status: experimental, automatically labeled

Date: $(Get-Date -Format 'yyyy-MM-dd')
"@
Set-Content -Path release_manifest.txt -Value $manifestContent

Write-Host "`nIntegration Pipeline Complete!" -ForegroundColor Green
Write-Host "WARNING: Models generated are for experimental analytical review only. Do not rely on proxy metrics for suspect classification." -ForegroundColor Yellow
