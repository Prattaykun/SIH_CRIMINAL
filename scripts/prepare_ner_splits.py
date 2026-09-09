"""
SIH-26189: Prepare train / dev / test splits from the auto-labeled JSONL.

Reads:  doccano_auto_labeled_vertex.jsonl
Writes: train.jsonl, dev.jsonl, test.jsonl  (80 / 10 / 10 split)

Usage:
  python scripts/prepare_ner_splits.py
"""

import os
import json
import random

INPUT_PATH = os.path.join(
    "data", "case_type_cyber", "annotations", "ner", "doccano_auto_labeled_vertex.jsonl"
)
OUT_DIR = os.path.join("data", "case_type_cyber", "annotations", "ner")

RANDOM_SEED = 42
TRAIN_RATIO = 0.80
DEV_RATIO   = 0.10
# TEST_RATIO is the remainder (0.10)


def write_jsonl(path: str, records: list[dict]) -> None:
    with open(path, "w", encoding="utf-8") as fh:
        for rec in records:
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")


def main() -> None:
    if not os.path.exists(INPUT_PATH):
        print(f"ERROR: File not found: {INPUT_PATH}")
        print("Run auto_label_vertex_doccano.py first.")
        return

    with open(INPUT_PATH, "r", encoding="utf-8") as fh:
        records = [json.loads(line) for line in fh if line.strip()]

    total = len(records)
    print(f"Loaded {total} records from {INPUT_PATH}")

    random.seed(RANDOM_SEED)
    random.shuffle(records)

    train_end = int(total * TRAIN_RATIO)
    dev_end   = int(total * (TRAIN_RATIO + DEV_RATIO))

    train_records = records[:train_end]
    dev_records   = records[train_end:dev_end]
    test_records  = records[dev_end:]

    os.makedirs(OUT_DIR, exist_ok=True)

    splits = {
        "train": (os.path.join(OUT_DIR, "train.jsonl"), train_records),
        "dev":   (os.path.join(OUT_DIR, "dev.jsonl"),   dev_records),
        "test":  (os.path.join(OUT_DIR, "test.jsonl"),  test_records),
    }

    print(f"\nRandom seed: {RANDOM_SEED}")
    print(f"{'Split':<8} {'Count':>6}  Path")
    print("-" * 60)
    for split_name, (path, recs) in splits.items():
        write_jsonl(path, recs)
        pct = 100 * len(recs) / total if total else 0
        print(f"{split_name:<8} {len(recs):>6} ({pct:.0f}%)  {path}")

    print(f"\nTotal records accounted for: {sum(len(r) for _, r in splits.values())}/{total}")


if __name__ == "__main__":
    main()
