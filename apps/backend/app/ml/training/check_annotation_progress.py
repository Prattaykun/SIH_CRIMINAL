import csv
import json
import argparse
from pathlib import Path

MANIFEST_PATH = Path("data/case_type_cyber/case_manifest.csv")
EXTRACTED_DIR = Path("data/case_type_cyber/extracted")
TRACKER_PATH = Path("data/case_type_cyber/annotations/ner/annotation_progress.csv")

def check_progress(args):
    # Load manifest
    canonical_cases = set()
    if MANIFEST_PATH.exists():
        with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('canonical_status', '').upper() == 'TRUE':
                    canonical_cases.add(row['internal_id'])

    # Determine expected pages
    expected_pages = set() # (case_id, document_id, str(page_number))
    for case_id in canonical_cases:
        json_path = EXTRACTED_DIR / case_id / 'document.json'
        if json_path.exists():
            with open(json_path, 'r', encoding='utf-8') as f:
                doc = json.load(f)
                doc_id = doc.get('document_id', '')
                for p in doc.get('pages', []):
                    text = p.get('normalized_text', '')
                    if text and text.strip():
                        expected_pages.add((case_id, doc_id, str(p.get('page_number'))))

    # Read tracker
    stats = {
        "total_pages": len(expected_pages),
        "NOT_STARTED": 0,
        "IN_PROGRESS": 0,
        "ANNOTATED": 0,
        "REVIEWED": 0,
        "count_by_case": {},
        "missing_records": 0,
        "duplicate_records": 0,
        "invalid_cases": 0
    }
    
    seen_tracker = set()
    if TRACKER_PATH.exists():
        with open(TRACKER_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                case_id = row['case_id']
                doc_id = row['document_id']
                page_number = str(row['page_number'])
                status = row['annotation_status']
                
                # Check target case_id
                if args.case_id and case_id != args.case_id:
                    continue
                    
                if case_id not in canonical_cases:
                    stats["invalid_cases"] += 1
                    continue
                    
                key = (case_id, doc_id, page_number)
                if key in seen_tracker:
                    stats["duplicate_records"] += 1
                else:
                    seen_tracker.add(key)
                
                if status in ["NOT_STARTED", "IN_PROGRESS", "ANNOTATED", "REVIEWED"]:
                    stats[status] += 1
                    
                stats["count_by_case"][case_id] = stats["count_by_case"].get(case_id, 0) + 1
                
    # Calculate missing records (filter by args.case_id if necessary)
    target_expected = expected_pages
    if args.case_id:
        target_expected = {k for k in expected_pages if k[0] == args.case_id}
        
    stats["missing_records"] = len(target_expected - seen_tracker)
    
    return stats

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--case-id", type=str)
    args = parser.parse_args()
    
    stats = check_progress(args)
    
    print("--- Annotation Progress Summary ---")
    print(f"Total Pages Expected: {stats['total_pages']}")
    print(f"NOT_STARTED: {stats['NOT_STARTED']}")
    print(f"IN_PROGRESS: {stats['IN_PROGRESS']}")
    print(f"ANNOTATED: {stats['ANNOTATED']}")
    print(f"REVIEWED: {stats['REVIEWED']}")
    print(f"Missing Tracker Records: {stats['missing_records']}")
    print(f"Duplicate Tracker Records: {stats['duplicate_records']}")
    print("Count By Case:")
    for cid, cnt in sorted(stats['count_by_case'].items()):
        print(f"  {cid}: {cnt}")
        
    if stats["missing_records"] > 0 or stats["duplicate_records"] > 0 or stats["invalid_cases"] > 0:
        print("\nWARNING: Tracker validation failed.")
    else:
        print("\nTracker validation passed.")

if __name__ == "__main__":
    main()
