import os
import argparse
import csv
import hashlib
import json
import re
import datetime
from pathlib import Path

# Try to import PyMuPDF
try:
    import fitz
    FITZ_VERSION = fitz.VersionBind
except ImportError:
    fitz = None
    FITZ_VERSION = None

MANIFEST_PATH = Path("data/case_type_cyber/case_manifest.csv")
EXTRACTED_DIR = Path("data/case_type_cyber/extracted")
REPORTS_DIR = Path("data/case_type_cyber/reports")

# Section Detection Patterns
SECTION_PATTERNS = {
    "CASE_OVERVIEW": r'(?i)^\s*(Case Overview)\b',
    "FIR": r'(?i)^\s*(First Information Report)\b',
    "CASE_DIARY": r'(?i)^\s*(Case Diary Entry)\b',
    "WITNESS_STATEMENT": r'(?i)^\s*(Witness Statement)\b',
    "BANK_TRANSACTION": r'(?i)^\s*(Bank Transaction Narrative)\b',
    "CDR": r'(?i)^\s*(Call Detail Record Summary)\b',
    "SURVEILLANCE": r'(?i)^\s*(Surveillance Log|Surveillance and Premises Inquiry Log)\b',
    "SEIZURE_MEMO": r'(?i)^\s*(Seizure Memo Excerpt)\b',
    "VEHICLE_RECORD": r'(?i)^\s*(Vehicle Ownership Record|Vehicle and Transport Record|Vehicle and Site-Visit Record)\b',
    "REMAND_APPLICATION": r'(?i)^\s*(Remand Application Excerpt)\b'
}

def compute_sha256(filepath):
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def normalize_text(text):
    original = text
    log = []
    
    # 1. Line endings
    text = text.replace('\r\n', '\n')
    if text != original:
        log.append("Normalized line endings to LF")
        
    # 2. Repeated blank lines (reduce 3+ to 2)
    step2 = re.sub(r'\n{3,}', '\n\n', text)
    if step2 != text:
        log.append("Reduced repeated blank lines")
        text = step2

    return text, log

def detect_sections(text):
    candidates = []
    for line_match in re.finditer(r'^.*$', text, flags=re.MULTILINE):
        line = line_match.group(0)
        for cat, pat in SECTION_PATTERNS.items():
            m = re.search(pat, line)
            if m:
                candidates.append({
                    "category": cat,
                    "heading_text": m.group(1),
                    "start_char": line_match.start(),
                    "end_char": line_match.end(),
                    "confidence": "high",
                    "rule_id": f"heading_match_{cat}"
                })
    return candidates

def load_manifest():
    if not MANIFEST_PATH.exists():
        raise FileNotFoundError(f"Manifest not found at {MANIFEST_PATH}")
    cases = []
    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cases.append(row)
    return cases

def process_case(case_row, args, stats):
    case_id = case_row['internal_id']
    is_canonical = case_row.get('canonical_status', '').upper() == 'TRUE'
    
    if not is_canonical:
        stats["duplicates_excluded"] += 1
        return None

    if args.case_id and case_id != args.case_id:
        return None

    stats["processed"] += 1
    
    source_pdf = Path(case_row['current_path'])
    expected_hash = case_row.get('sha256', '')

    out_dir = EXTRACTED_DIR / case_id
    out_json = out_dir / "document.json"

    # Validation Mode
    if args.validate_only:
        if not out_json.exists():
            stats["missing_outputs"] += 1
            stats["failed"] += 1
            return {"case_id": case_id, "status": "FAIL", "reason": "Missing output JSON"}
        # (further validation could be done here)
        stats["passed"] += 1
        return {"case_id": case_id, "status": "PASS"}

    # Output Existence Check
    if out_json.exists() and not args.force and not args.dry_run:
        print(f"[{case_id}] Output exists. Use --force to overwrite.")
        stats["failed"] += 1
        return {"case_id": case_id, "status": "FAIL", "reason": "Output exists"}

    # Source Validation
    if not source_pdf.exists():
        stats["failed"] += 1
        return {"case_id": case_id, "status": "FAIL", "reason": "PDF not found"}
        
    actual_hash = compute_sha256(source_pdf)
    hash_match = actual_hash == expected_hash
    if not hash_match:
        stats["hash_mismatches"] += 1
        print(f"[{case_id}] WARNING: Hash mismatch!")

    if args.dry_run:
        stats["passed"] += 1
        return {"case_id": case_id, "status": "PASS (DRY RUN)"}

    # Extraction
    try:
        doc = fitz.open(source_pdf)
    except Exception as e:
        stats["failed"] += 1
        return {"case_id": case_id, "status": "FAIL", "reason": f"PyMuPDF error: {str(e)}"}

    extracted_pages = []
    norm_changes = 0
    empty_pages = 0
    
    for i, page in enumerate(doc):
        raw_text = page.get_text()
        normalized_text, logs = normalize_text(raw_text)
        
        if logs:
            norm_changes += 1
            
        if len(raw_text.strip()) == 0:
            empty_pages += 1
            
        candidates = detect_sections(normalized_text)
        
        # update global stats
        for cand in candidates:
            cat = cand["category"]
            stats["section_counts"][cat] = stats["section_counts"].get(cat, 0) + 1

        extracted_pages.append({
            "page_number": i + 1,
            "raw_text": raw_text,
            "normalized_text": normalized_text,
            "char_count_raw": len(raw_text),
            "char_count_normalized": len(normalized_text),
            "normalization_log": logs,
            "section_candidates": candidates
        })
        
        stats["total_pages"] += 1
        stats["total_char_raw"] += len(raw_text)
        stats["total_char_norm"] += len(normalized_text)

    doc.close()
    
    manifest_page_count = int(case_row.get('page_count', 0))
    
    output_data = {
        "schema_version": "1.0",
        "case_id": case_id,
        "document_id": case_row.get('document_id', ''),
        "source_filename": "source.pdf",
        "source_classification": case_row.get('source_classification', ''),
        "crime_family": case_row.get('crime_family', ''),
        "crime_subtype": case_row.get('crime_subtype', ''),
        "source_sha256": actual_hash,
        "page_count": len(extracted_pages),
        "parser": {
            "name": "pymupdf",
            "version": FITZ_VERSION,
            "extracted_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        },
        "pages": extracted_pages
    }
    
    os.makedirs(out_dir, exist_ok=True)
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
        
    stats["empty_pages"] += empty_pages
    stats["passed"] += 1
    
    return {
        "case_id": case_id,
        "document_id": case_row.get('document_id', ''),
        "crime_subtype": case_row.get('crime_subtype', ''),
        "hash_match": hash_match,
        "manifest_page_count": manifest_page_count,
        "extracted_page_count": len(extracted_pages),
        "empty_pages": empty_pages,
        "normalization_changes": norm_changes,
        "output_path": str(out_json.as_posix()),
        "status": "PASS"
    }

def generate_reports(results, stats):
    os.makedirs(REPORTS_DIR, exist_ok=True)
    
    report_data = {
        "totals": {
            "processed": stats["processed"],
            "passed": stats["passed"],
            "failed": stats["failed"],
            "duplicates_excluded": stats["duplicates_excluded"],
            "total_pages_extracted": stats["total_pages"],
            "total_char_raw": stats["total_char_raw"],
            "total_char_norm": stats["total_char_norm"],
            "empty_pages": stats["empty_pages"],
            "hash_mismatches": stats["hash_mismatches"],
            "missing_outputs": stats["missing_outputs"],
            "manifest_inconsistencies": 0
        },
        "sections": stats["section_counts"],
        "cases": results
    }
    
    # JSON Report
    with open(REPORTS_DIR / "extraction_quality_report.json", "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)
        
    # MD Report
    md = [
        "# Extraction Quality Report",
        "",
        "## Summary",
        f"- Canonical Cases Processed: {stats['processed']}",
        f"- Passed: {stats['passed']}",
        f"- Failed: {stats['failed']}",
        f"- Duplicates Excluded: {stats['duplicates_excluded']}",
        f"- Total Pages Extracted: {stats['total_pages']}",
        f"- Empty Pages: {stats['empty_pages']}",
        f"- Hash Mismatches: {stats['hash_mismatches']}",
        f"- Total Raw Characters: {stats['total_char_raw']}",
        f"- Total Normalized Characters: {stats['total_char_norm']}",
        "",
        "## Sections Detected"
    ]
    
    for cat, count in stats["section_counts"].items():
        md.append(f"- {cat}: {count}")
        
    md.append("\n## Cases")
    for r in results:
        md.append(f"### {r.get('case_id', 'Unknown')}")
        for k, v in r.items():
            if k != 'case_id':
                md.append(f"- **{k}**: {v}")
                
    with open(REPORTS_DIR / "extraction_quality_report.md", "w", encoding="utf-8") as f:
        f.write("\n".join(md))

def main():
    parser = argparse.ArgumentParser(description="Extract text from SIH cases")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--case-id", type=str)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()

    if fitz is None:
        print("ERROR: PyMuPDF is not installed. Extraction cannot proceed.")
        exit(1)

    cases = load_manifest()
    
    stats = {
        "processed": 0,
        "passed": 0,
        "failed": 0,
        "duplicates_excluded": 0,
        "total_pages": 0,
        "total_char_raw": 0,
        "total_char_norm": 0,
        "empty_pages": 0,
        "hash_mismatches": 0,
        "missing_outputs": 0,
        "section_counts": {}
    }
    
    results = []
    errors = []
    
    for case in cases:
        try:
            res = process_case(case, args, stats)
            if res:
                results.append(res)
                if res.get("status") == "FAIL":
                    errors.append(res)
        except Exception as e:
            stats["failed"] += 1
            err = {"case_id": case.get('internal_id', 'unknown'), "error": str(e)}
            errors.append(err)
            
    if not args.dry_run and not args.validate_only:
        generate_reports(results, stats)
        
        if errors:
            os.makedirs(REPORTS_DIR, exist_ok=True)
            with open(REPORTS_DIR / "extraction_errors.json", "w", encoding="utf-8") as f:
                json.dump(errors, f, indent=2)

    print(f"Done. Processed {stats['processed']}. Passed: {stats['passed']}. Failed: {stats['failed']}.")

if __name__ == "__main__":
    main()
