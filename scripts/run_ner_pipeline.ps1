<#
.SYNOPSIS
Helper script to configure environment variables and run the NER data pipeline for SIH-26189.
#>

$ErrorActionPreference = "Continue"

Write-Host "=== SIH-26189 NER Pipeline Setup ===" -ForegroundColor Cyan

# 1. Prompt for GCP config
$ProjectId = Read-Host "Enter your GCP Project ID"
if ([string]::IsNullOrWhiteSpace($ProjectId)) {
    Write-Host "Error: Project ID is required." -ForegroundColor Red
    exit 1
}

$Location = Read-Host "Enter your GCP Location/Region [default: us-central1]"
if ([string]::IsNullOrWhiteSpace($Location)) {
    $Location = "us-central1"
}

$Model = Read-Host "Enter Vertex Model name [default: gemini-1.5-pro-002]"
if ([string]::IsNullOrWhiteSpace($Model)) {
    $Model = "gemini-1.5-pro-002"
}

# 2. Set env variables for this session
$env:VERTEX_PROJECT = $ProjectId
$env:VERTEX_LOCATION = $Location
$env:VERTEX_MODEL = $Model

Write-Host "`n--- Configured Environment ---" -ForegroundColor Cyan
Write-Host "VERTEX_PROJECT : $env:VERTEX_PROJECT"
Write-Host "VERTEX_LOCATION: $env:VERTEX_LOCATION"
Write-Host "VERTEX_MODEL   : $env:VERTEX_MODEL"
Write-Host "----------------------------`n"

# 3. Check gcloud availability
if (-not (Get-Command "gcloud" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: 'gcloud' CLI is not found on your system." -ForegroundColor Red
    Write-Host "Please install the Google Cloud SDK and ensure it is in your PATH."
    exit 1
}

# 4. Check Vertex AI Authentication (ADC)
Write-Host "Checking Vertex AI Authentication..."
# We test auth by importing vertexai and trying to initialize it. 
# If ADC is missing, google-auth throws an exception.
$pyCmd = "import vertexai, os; vertexai.init(project=os.environ['VERTEX_PROJECT'], location=os.environ['VERTEX_LOCATION'])"
python -c $pyCmd 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nError: Authentication failed or Google Cloud ADC is not configured." -ForegroundColor Red
    Write-Host "Please run the following command to authenticate:" -ForegroundColor Yellow
    Write-Host "  gcloud auth application-default login" -ForegroundColor White
    Write-Host "Then re-run this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "Authentication verified. Starting NER Pipeline...`n" -ForegroundColor Green

# 5. Run Pipeline Scripts
Write-Host "[1/4] Running Auto-Labeling (Vertex AI)..." -ForegroundColor Cyan
python scripts/auto_label_vertex_doccano.py
if ($LASTEXITCODE -ne 0) { Write-Host "Pipeline failed at auto-labeling." -ForegroundColor Red; exit 1 }

Write-Host "`n[2/4] Running Sanity Checks..." -ForegroundColor Cyan
python scripts/sanity_check_auto_labels.py
if ($LASTEXITCODE -ne 0) { Write-Host "Pipeline failed at sanity check." -ForegroundColor Red; exit 1 }

Write-Host "`n[3/4] Preparing Train/Dev/Test Splits..." -ForegroundColor Cyan
python scripts/prepare_ner_splits.py
if ($LASTEXITCODE -ne 0) { Write-Host "Pipeline failed at split generation." -ForegroundColor Red; exit 1 }

Write-Host "`n[4/4] Converting Doccano to spaCy format..." -ForegroundColor Cyan
python scripts/convert_doccano_to_spacy.py
if ($LASTEXITCODE -ne 0) { Write-Host "Pipeline failed at spaCy conversion." -ForegroundColor Red; exit 1 }

# 6. Summary
Write-Host "`n=== PIPELINE COMPLETE ===" -ForegroundColor Green
Write-Host "The following files were successfully generated:"
Write-Host "  - data/case_type_cyber/annotations/ner/doccano_auto_labeled_vertex.jsonl"
Write-Host "  - data/case_type_cyber/annotations/ner/train.jsonl"
Write-Host "  - data/case_type_cyber/annotations/ner/dev.jsonl"
Write-Host "  - data/case_type_cyber/annotations/ner/test.jsonl"
Write-Host "  - data/case_type_cyber/annotations/ner/train.spacy"
Write-Host "  - data/case_type_cyber/annotations/ner/dev.spacy"
