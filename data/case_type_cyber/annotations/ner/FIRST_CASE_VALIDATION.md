# First Case Validation Instructions

Before proceeding with full annotation, you must validate your workflow on a single case.

1. **Annotate only CASE-2025-SYN-COMM-104 first.**
2. **Review all 8 pages manually.**
3. **Export the reviewed sample manually from Doccano as:**
   `data/case_type_cyber/annotations/ner/doccano_first_case_review.jsonl`

4. **Run only this command afterward:**
   ```powershell
   $env:PYTHONPATH="D:\SRAMAN\SIH-CRIMINAL"
   .\.venv\Scripts\python.exe apps\backend\app\ml\training\validate_and_split.py `
     --input data\case_type_cyber\annotations\ner\doccano_first_case_review.jsonl `
     --dry-run
   ```

5. **Understand `--dry-run` behavior:**
   The `--dry-run` flag must only validate structure. It must not create splits, reports, model artifacts, or training outputs.
   
6. **Interpret the results:**
   Passing structural validation does not prove label correctness; the annotator must manually inspect entity types and span boundaries.

7. **Final Export:**
   The final export must not be produced until all cases are annotated and reviewed.
