import os
import argparse
import csv
import json
import datetime
from pathlib import Path

MANIFEST_PATH = Path("data/case_type_cyber/case_manifest.csv")
EXTRACTED_DIR = Path("data/case_type_cyber/extracted")
ANNOTATIONS_DIR = Path("data/case_type_cyber/annotations/ner")
REPORTS_DIR = Path("data/case_type_cyber/reports")

def load_manifest():
    if not MANIFEST_PATH.exists():
        raise FileNotFoundError(f"Manifest not found at {MANIFEST_PATH}")
    cases = []
    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cases.append(row)
    return cases

def process_doccano_import(args):
    cases = load_manifest()
    
    canonical_cases = [c for c in cases if c.get('canonical_status', '').upper() == 'TRUE']
    excluded_duplicates = len(cases) - len(canonical_cases)
    
    # Sort deterministically by case ID
    canonical_cases.sort(key=lambda x: x['internal_id'])
    
    stats = {
        "cases_available": len(canonical_cases),
        "cases_processed": 0,
        "excluded_duplicates": excluded_duplicates,
        "total_extracted_pages_available": 0,
        "total_non_empty_pages_exported": 0,
        "pages_skipped": 0,
        "hash_mismatches": 0,
        "missing_extracted_json": 0,
        "duplicate_records": 0,
        "manifest_warnings": 0,
        "records_per_case": {},
        "records_per_subtype": {},
        "records_per_section": {}
    }
    
    seen_records = set()
    records_to_export = []
    
    for case in canonical_cases:
        case_id = case['internal_id']
        
        if args.case_id and case_id != args.case_id:
            continue
            
        json_path = EXTRACTED_DIR / case_id / "document.json"
        
        if not json_path.exists():
            stats["missing_extracted_json"] += 1
            stats["manifest_warnings"] += 1
            if not args.dry_run and not args.validate_only:
                print(f"Error: Missing extracted JSON for {case_id}")
            continue
            
        with open(json_path, 'r', encoding='utf-8') as f:
            doc = json.load(f)
            
        # Verify hash
        expected_hash = case.get('sha256', '')
        actual_hash = doc.get('source_sha256', '')
        if expected_hash and actual_hash and expected_hash != actual_hash:
            stats["hash_mismatches"] += 1
            stats["manifest_warnings"] += 1
            
        stats["cases_processed"] += 1
        stats["records_per_case"][case_id] = 0
        subtype = doc.get('crime_subtype', 'UNKNOWN')
        if subtype not in stats["records_per_subtype"]:
            stats["records_per_subtype"][subtype] = 0
            
        pages = doc.get('pages', [])
        pages.sort(key=lambda x: x.get('page_number', 0))
        stats["total_extracted_pages_available"] += len(pages)
        
        for page in pages:
            page_num = page.get('page_number')
            text = page.get('normalized_text', '')
            
            if not text or not text.strip():
                stats["pages_skipped"] += 1
                continue
                
            doc_id = doc.get('document_id', '')
            record_key = (case_id, doc_id, page_num)
            
            if record_key in seen_records:
                stats["duplicate_records"] += 1
                stats["manifest_warnings"] += 1
                raise ValueError(f"Duplicate record detected: {record_key}")
                
            seen_records.add(record_key)
            
            section_categories = []
            section_rule_ids = []
            
            candidates = page.get('section_candidates', [])
            for c in candidates:
                cat = c.get('category')
                rid = c.get('rule_id')
                if cat and cat not in section_categories:
                    section_categories.append(cat)
                    stats["records_per_section"][cat] = stats["records_per_section"].get(cat, 0) + 1
                if rid and rid not in section_rule_ids:
                    section_rule_ids.append(rid)
                    
            record = {
                "text": text,
                "meta": {
                    "dataset_schema_version": "1.0",
                    "case_id": case_id,
                    "document_id": doc_id,
                    "page_number": page_num,
                    "source_filename": doc.get('source_filename', 'source.pdf'),
                    "source_sha256": actual_hash,
                    "source_classification": doc.get('source_classification', 'SYNTHETIC_OR_DEIDENTIFIED_BENCHMARK'),
                    "crime_family": doc.get('crime_family', 'CYBER_ENABLED_ECONOMIC_FINANCIAL_CRIME'),
                    "crime_subtype": subtype,
                    "section_categories": section_categories,
                    "section_detection_rule_ids": section_rule_ids
                }
            }
            
            records_to_export.append(record)
            stats["total_non_empty_pages_exported"] += 1
            stats["records_per_case"][case_id] += 1
            stats["records_per_subtype"][subtype] += 1

    out_path = ANNOTATIONS_DIR / "doccano_import.jsonl"
    
    if args.validate_only or args.dry_run:
        status = "PASS" if stats["missing_extracted_json"] == 0 and stats["duplicate_records"] == 0 else "FAIL"
        stats["status"] = status
        return stats
        
    if out_path.exists() and not args.force:
        print(f"Output file {out_path} already exists. Use --force to overwrite.")
        stats["status"] = "FAIL"
        return stats

    os.makedirs(ANNOTATIONS_DIR, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for rec in records_to_export:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    stats["status"] = "PASS" if stats["missing_extracted_json"] == 0 and stats["duplicate_records"] == 0 else "FAIL"
    
    # Reports
    os.makedirs(REPORTS_DIR, exist_ok=True)
    report = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "stats": stats,
        "output_path": str(out_path.as_posix())
    }
    
    with open(REPORTS_DIR / "doccano_import_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    md = [
        "# Doccano Import Report",
        "",
        f"- **Dataset-generation timestamp:** {report['timestamp']}",
        f"- **Canonical cases available:** {stats['cases_available']}",
        f"- **Canonical cases processed:** {stats['cases_processed']}",
        f"- **Excluded duplicate files:** {stats['excluded_duplicates']}",
        f"- **Total extracted pages available:** {stats['total_extracted_pages_available']}",
        f"- **Total non-empty pages exported:** {stats['total_non_empty_pages_exported']}",
        f"- **Pages skipped (empty/whitespace):** {stats['pages_skipped']}",
        f"- **Hash mismatch count:** {stats['hash_mismatches']}",
        f"- **Missing extracted JSON count:** {stats['missing_extracted_json']}",
        f"- **Duplicate record count:** {stats['duplicate_records']}",
        f"- **Manifest/schema validation warnings:** {stats['manifest_warnings']}",
        f"- **Output JSONL path:** {report['output_path']}",
        f"- **Pass/fail result:** {stats['status']}",
        "",
        "## Records per case"
    ]
    
    for case_id, count in stats["records_per_case"].items():
        md.append(f"- {case_id}: {count}")
        
    md.append("\n## Records per crime subtype")
    for subtype, count in stats["records_per_subtype"].items():
        md.append(f"- {subtype}: {count}")
        
    md.append("\n## Records containing detected section category")
    for sec, count in stats["records_per_section"].items():
        md.append(f"- {sec}: {count}")
        
    with open(REPORTS_DIR / "doccano_import_report.md", "w", encoding="utf-8") as f:
        f.write("\n".join(md))
        
    return stats

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--case-id", type=str)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    
    try:
        stats = process_doccano_import(args)
        if args.dry_run or args.validate_only:
            print("Run complete. " + json.dumps(stats, indent=2))
        else:
            print(f"Export finished. Status: {stats.get('status')}")
    except Exception as e:
        print(f"Failed: {e}")
        exit(1)

if __name__ == "__main__":
    main()
