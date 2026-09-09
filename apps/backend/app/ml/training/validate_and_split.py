import os
import json
import random
import argparse
import datetime
from pathlib import Path

REPORTS_DIR = Path("data/case_type_cyber/reports")
SPLITS_DIR = Path("data/case_type_cyber/splits")

ALLOWED_LABELS = {'PERSON', 'ORGANIZATION', 'ADDRESS', 'LOCATION', 'ROLE'}
FORBIDDEN_MARKERS = {'UNREVIEWED_PREANNOTATION', 'MOCK', 'DUMMY', 'TEST_ONLY'}

def validate_annotations(input_path):
    export_file = Path(input_path)
    if not export_file.exists():
        raise FileNotFoundError(f"Input file not found: {export_file}")
        
    if "invalid_mock_artifacts" in export_file.as_posix():
        raise ValueError("Input file is located in the invalid_mock_artifacts directory and must not be used.")
        
    stats = {
        "total_records": 0,
        "total_entities": 0,
        "entity_count_per_label": {l: 0 for l in ALLOWED_LABELS},
        "entity_count_per_case": {},
        "entity_count_per_section": {},
        "invalid_misaligned_span_count": 0,
        "overlap_count": 0,
        "missing_metadata_count": 0,
        "cases_with_zero_annotations": 0,
        "malformed_records": 0,
        "duplicate_records": 0,
        "label_warnings": 0
    }
    
    stats["entity_count_per_label"]["INVALID"] = 0
    
    seen_pages = set()
    cases_entities = {}
    cases_records = {}
    
    records = []
    
    with open(export_file, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            if not line.strip():
                continue
                
            for marker in FORBIDDEN_MARKERS:
                if marker in line:
                    raise ValueError(f"File contains forbidden mock/test marker: {marker}")
            
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                stats["malformed_records"] += 1
                continue
                
            stats["total_records"] += 1
            text = record.get('text')
            meta = record.get('meta', {})
            labels = record.get('label', [])
            
            if text is None or not isinstance(meta, dict):
                stats["missing_metadata_count"] += 1
                stats["malformed_records"] += 1
                continue
                
            case_id = meta.get('case_id')
            doc_id = meta.get('document_id')
            page_num = meta.get('page_number')
            
            if not case_id or not doc_id or page_num is None:
                stats["missing_metadata_count"] += 1
                continue
                
            page_key = (case_id, doc_id, page_num)
            if page_key in seen_pages:
                stats["duplicate_records"] += 1
                continue
            seen_pages.add(page_key)
            
            if case_id not in cases_entities:
                cases_entities[case_id] = 0
                cases_records[case_id] = 0
            cases_records[case_id] += 1
            
            sections = meta.get('section_categories', ['UNKNOWN'])
            if not sections:
                sections = ['UNKNOWN']
            
            labels.sort(key=lambda x: x[0] if len(x) >= 2 else 0)
            
            last_end = -1
            
            for lbl in labels:
                if not isinstance(lbl, list) or len(lbl) < 3:
                    stats["invalid_misaligned_span_count"] += 1
                    continue
                    
                start, end, category = lbl[0], lbl[1], lbl[2]
                
                if not isinstance(start, int) or not isinstance(end, int):
                    stats["invalid_misaligned_span_count"] += 1
                    continue
                    
                if start < 0 or end > len(text) or start >= end:
                    stats["invalid_misaligned_span_count"] += 1
                    continue
                    
                if start < last_end:
                    stats["overlap_count"] += 1
                last_end = max(last_end, end)
                
                if category not in ALLOWED_LABELS:
                    stats["label_warnings"] += 1
                    stats["entity_count_per_label"]["INVALID"] += 1
                else:
                    stats["entity_count_per_label"][category] += 1
                    
                stats["total_entities"] += 1
                cases_entities[case_id] += 1
                
                for sec in sections:
                    stats["entity_count_per_section"][sec] = stats["entity_count_per_section"].get(sec, 0) + 1
                    
            records.append(record)

    for cid, e_count in cases_entities.items():
        stats["entity_count_per_case"][cid] = e_count
        if e_count == 0:
            stats["cases_with_zero_annotations"] += 1

    stats["annotation_density_per_page"] = stats["total_entities"] / stats["total_records"] if stats["total_records"] > 0 else 0
    
    passed = (
        stats["invalid_misaligned_span_count"] == 0 and
        stats["malformed_records"] == 0 and
        stats["missing_metadata_count"] == 0 and
        stats["duplicate_records"] == 0 and
        stats["overlap_count"] == 0 and
        stats["label_warnings"] == 0
    )
    
    stats["status"] = "PASS" if passed else "FAIL"
    
    return stats, cases_entities

def create_splits(cases_entities):
    case_ids = sorted(list(cases_entities.keys()))
    random.seed(42)
    random.shuffle(case_ids)
    
    if len(case_ids) < 8:
        train_n = max(1, len(case_ids) - 3)
        dev_n = 1 if len(case_ids) > 1 else 0
    else:
        train_n = 5
        dev_n = 1
        
    train_cases = case_ids[:train_n]
    dev_cases = case_ids[train_n:train_n+dev_n]
    test_cases = case_ids[train_n+dev_n:]
    
    os.makedirs(SPLITS_DIR, exist_ok=True)
    
    for split_name, split_list in [("train", train_cases), ("dev", dev_cases), ("test", test_cases)]:
        with open(SPLITS_DIR / f"{split_name}_cases.txt", "w", encoding="utf-8") as f:
            for cid in sorted(split_list):
                f.write(cid + "\n")
                
    split_manifest = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "seed": 42,
        "note": "Small prototype-only evaluation split",
        "splits": {
            "train": {"count": len(train_cases), "cases": sorted(train_cases)},
            "dev": {"count": len(dev_cases), "cases": sorted(dev_cases)},
            "test": {"count": len(test_cases), "cases": sorted(test_cases)}
        }
    }
    
    with open(SPLITS_DIR / "split_manifest.json", "w", encoding="utf-8") as f:
        json.dump(split_manifest, f, indent=2)
        
    md = [
        "# Case-Level Dataset Splits",
        "",
        "**NOTE: This is a small, prototype-only evaluation split.**",
        "",
        f"- Seed: 42",
        f"- Generated: {split_manifest['timestamp']}",
        "",
        "## Train (5 Cases)",
        *[f"- {c}" for c in sorted(train_cases)],
        "",
        "## Dev (1 Case)",
        *[f"- {c}" for c in sorted(dev_cases)],
        "",
        "## Test (2 Cases)",
        *[f"- {c}" for c in sorted(test_cases)]
    ]
    
    with open(SPLITS_DIR / "split_manifest.md", "w", encoding="utf-8") as f:
        f.write("\n".join(md))

def write_reports(stats):
    os.makedirs(REPORTS_DIR, exist_ok=True)
    
    with open(REPORTS_DIR / "ner_annotation_validation_report.json", "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)
        
    md = [
        "# NER Annotation Validation Report",
        "",
        f"**Status:** {stats['status']}",
        "",
        "## Summary",
        f"- Total Records: {stats['total_records']}",
        f"- Total Entities: {stats['total_entities']}",
        f"- Invalid/Misaligned Spans: {stats['invalid_misaligned_span_count']}",
        f"- Overlapping Spans: {stats['overlap_count']}",
        f"- Missing Metadata: {stats['missing_metadata_count']}",
        f"- Malformed Records: {stats['malformed_records']}",
        f"- Duplicate Records: {stats['duplicate_records']}",
        f"- Label Warnings: {stats['label_warnings']}",
        f"- Cases with Zero Annotations: {stats['cases_with_zero_annotations']}",
        f"- Annotation Density (Entities/Page): {stats['annotation_density_per_page']:.2f}",
        "",
        "## Entity Count per Label",
    ]
    
    for lbl, count in stats['entity_count_per_label'].items():
        md.append(f"- {lbl}: {count}")
        
    md.append("\n## Entity Count per Case")
    for cid, count in stats['entity_count_per_case'].items():
        md.append(f"- {cid}: {count}")
        
    md.append("\n## Entity Count per Section")
    for sec, count in stats['entity_count_per_section'].items():
        md.append(f"- {sec}: {count}")
        
    with open(REPORTS_DIR / "ner_annotation_validation_report.md", "w", encoding="utf-8") as f:
        f.write("\n".join(md))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=str, required=True, help="Path to the doccano exported jsonl file")
    parser.add_argument("--dry-run", action="store_true", help="Validate only, do not write splits/reports")
    args = parser.parse_args()
    
    stats, cases_entities = validate_annotations(args.input)
    
    if not args.dry_run:
        write_reports(stats)
        
        if stats["status"] == "PASS":
            create_splits(cases_entities)
            print("Validation passed. Splits created.")
        else:
            print("Validation failed. Splits were not created.")
            
    print(f"Validation Status: {stats['status']}")

if __name__ == "__main__":
    main()
