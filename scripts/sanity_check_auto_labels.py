"""
SIH-26189: Sanity-check the Vertex AI auto-labeled Doccano JSONL.

Loads doccano_auto_labeled_vertex.jsonl and prints:
  - Summary stats (total records, records with entities, per-label counts)
  - A random sample of 5 records with entity details
  - Warnings for offset mismatches

Usage:
  python scripts/sanity_check_auto_labels.py
"""

import os
import json
import random

INPUT_PATH = os.path.join(
    "data", "case_type_cyber", "annotations", "ner", "doccano_auto_labeled_vertex.jsonl"
)
SAMPLE_SIZE = 5


def main() -> None:
    if not os.path.exists(INPUT_PATH):
        print(f"ERROR: File not found: {INPUT_PATH}")
        print("Run auto_label_vertex_doccano.py first.")
        return

    with open(INPUT_PATH, "r", encoding="utf-8") as fh:
        records = [json.loads(line) for line in fh if line.strip()]

    total_records = len(records)
    records_with_entities = 0
    label_counts: dict[str, int] = {}
    offset_mismatch_count = 0

    for rec in records:
        entities = rec.get("entities", [])
        text: str = rec.get("text", "")
        if entities:
            records_with_entities += 1
            for ent in entities:
                start, end, label = ent[0], ent[1], ent[2]
                label_counts[label] = label_counts.get(label, 0) + 1

                # Verify snippet
                snippet = text[start:end] if 0 <= start < end <= len(text) else ""
                if not snippet:
                    offset_mismatch_count += 1

    # -----------------------------------------------------------------------
    # Summary stats
    # -----------------------------------------------------------------------
    print("=" * 60)
    print("SUMMARY STATS")
    print("=" * 60)
    print(f"Input file              : {INPUT_PATH}")
    print(f"Total records           : {total_records}")
    print(f"Records with >=1 entity : {records_with_entities}")
    print(f"Records with no entity  : {total_records - records_with_entities}")
    print(f"Offset issues detected  : {offset_mismatch_count}")
    print()
    print("Entity counts per label:")
    for label, count in sorted(label_counts.items()):
        print(f"  {label:<20} {count}")

    # -----------------------------------------------------------------------
    # Random sample
    # -----------------------------------------------------------------------
    print()
    print("=" * 60)
    print(f"RANDOM SAMPLE OF {SAMPLE_SIZE} RECORDS")
    print("=" * 60)

    sample = random.sample(records, min(SAMPLE_SIZE, total_records))
    for i, rec in enumerate(sample, start=1):
        text: str = rec.get("text", "")
        entities = rec.get("entities", [])
        case_id = rec.get("meta", {}).get("case_id", "?")
        page_num = rec.get("meta", {}).get("page_number", "?")

        print(f"\n--- Sample {i}  [case={case_id}, page={page_num}] ---")
        print(f"TEXT (first 300 chars): {text[:300].strip()!r}")
        print(f"ENTITIES ({len(entities)} found):")

        if not entities:
            print("  (none)")
        else:
            for ent in entities:
                start, end, label = ent[0], ent[1], ent[2]
                snippet = text[start:end] if 0 <= start < end <= len(text) else ""
                mismatch_flag = ""
                if not snippet:
                    mismatch_flag = "  *** OFFSET ERROR ***"
                print(f"  [{label:<14}] {snippet!r:40s}  start={start}, end={end}{mismatch_flag}")


if __name__ == "__main__":
    main()
