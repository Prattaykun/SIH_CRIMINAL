# Cyber-Enabled Economic Financial Crime Dataset

## Overview
This dataset contains synthetic and de-identified benchmark case reports used for document parsing, entity extraction, annotation, and model training for the SIH 26189 AI-Assisted Criminal Network Analysis System.

## Constraints & Usage
- **Strictly Synthetic/De-identified Data:** These documents are synthetic benchmarks inspired by real case styles. They contain no real personally identifiable data.
- **No Guilt Prediction:** Do NOT use this data to train or claim automated guilt detection, criminality scoring, legal conclusions, or identity attribution.
- **Permitted ML Scope:** Candidate extraction, document-section detection, event extraction, relation proposals, and explainable review-priority signals.

## Structure
- `raw/{CASE_ID}/source.pdf`: Canonical source PDFs.
- `duplicates/`: Identical/alternate copies preserved for provenance (do not use as independent training samples).
- `case_manifest.csv`: Catalog of all documents, their hashes, page counts, and structural mapping.
