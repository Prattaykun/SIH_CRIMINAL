"""
SIH-26189: Sample a stratified set of pages for manual labeling.

Selects pages by case type and entity density from murder_cases_labeled.jsonl
and kidnapping_cases_labeled.jsonl, then outputs a clean JSONL template
for investigators to correct entity spans in a JSONL editor or Doccano.

Usage:
  python scripts/sample_for_manual_labeling.py

Output:
  data/labeling/manual_review_sample.jsonl   -- pages to correct
  data/labeling/LABELING_GUIDE.md            -- instructions
"""

import os
import json
import random
from collections import defaultdict

SOURCES = [
    ("murder",      "data/case_type_murder/ner/murder_cases_labeled.jsonl"),
    ("kidnapping",  "data/case_type_kidnapping/ner/kidnapping_cases_labeled.jsonl"),
    ("financial",   "data/case_type_financial/ner/financial_cases_labeled.jsonl"),
    ("violent",     "data/case_type_violent/ner/violent_cases_labeled.jsonl"),
]

SAMPLE_PER_TYPE = 8       # pages per case type (adjust as needed)
MIN_ENTITIES    = 3       # skip near-empty pages
SEED            = 2026

OUT_DIR   = os.path.join("data", "labeling")
OUT_JSONL = os.path.join(OUT_DIR, "manual_review_sample.jsonl")
OUT_GUIDE = os.path.join(OUT_DIR, "LABELING_GUIDE.md")

GUIDE_TEXT = """\
# SIH-26189 Manual Labeling Guide

## Purpose
These pages were sampled from the pipeline's auto-labeled outputs.
Your task is to **correct** any wrong or missing entity spans so that
the verified records can be used as high-quality ground truth for ner_v7.

## Valid Labels
| Label        | What it covers                                      |
|:-------------|:----------------------------------------------------|
| PERSON       | Named individuals (suspect, victim, witness, officer)|
| LOCATION     | Cities, districts, addresses, landmark names         |
| ORGANIZATION | Institutions, police stations, banks, companies      |

## What to Fix
1. **Wrong span** – extend or shrink the character offsets.
2. **Wrong label** – change PERSON↔LOCATION↔ORGANIZATION.
3. **Missing entity** – add a new `[start, end, "LABEL"]` triple.
4. **False positive** – remove an entry that is not a real entity.

## Format (each line in the JSONL)
```json
{
  "text": "full page text ...",
  "entities": [[start, end, "LABEL"], ...],
  "meta": {"case_id": "...", "case_type": "...", "page_number": 1},
  "review_status": "PENDING",
  "reviewer": "",
  "notes": ""
}
```

## Workflow
1. Open `manual_review_sample.jsonl` in any text editor or Doccano.
2. For each record, update `entities`, set `reviewer` to your name,
   change `review_status` to `VERIFIED` or `REJECTED`.
3. Save and hand back the file for merging into `doccano_all_labeled_verified.jsonl`.

## Ethics Reminders
- Do **not** infer guilt from entity presence.
- Mark uncertain entries with `review_status: "UNCERTAIN"`.
- Label what the text **explicitly states**, not what you assume.
"""


def load_jsonl(path: str) -> list[dict]:
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(l) for l in f if l.strip()]


def entity_density(rec: dict) -> int:
    return len(rec.get("entities", []))


def sample_by_density(records: list[dict], n: int, min_ents: int) -> list[dict]:
    """Return n records with >= min_ents entities, stratified by density tier."""
    eligible = [r for r in records if entity_density(r) >= min_ents]
    if not eligible:
        return records[:n]
    # Sort by entity count descending, then take every k-th to spread coverage
    eligible.sort(key=entity_density, reverse=True)
    step = max(1, len(eligible) // n)
    sampled = eligible[::step][:n]
    return sampled


def main() -> None:
    random.seed(SEED)
    os.makedirs(OUT_DIR, exist_ok=True)

    all_samples: list[dict] = []
    stats: dict[str, int] = defaultdict(int)

    for case_type, path in SOURCES:
        records = load_jsonl(path)
        if not records:
            print(f"  [{case_type}] No data found at {path} — skipping.")
            continue

        sampled = sample_by_density(records, SAMPLE_PER_TYPE, MIN_ENTITIES)
        for rec in sampled:
            rec.setdefault("meta", {})
            rec["meta"]["case_type"] = case_type
            rec["review_status"] = "PENDING"
            rec["reviewer"] = ""
            rec["notes"] = ""
        all_samples.extend(sampled)
        stats[case_type] = len(sampled)
        print(f"  [{case_type}] sampled {len(sampled)} / {len(records)} pages"
              f"  (min_ents={MIN_ENTITIES})")

    random.shuffle(all_samples)

    with open(OUT_JSONL, "w", encoding="utf-8") as f:
        for rec in all_samples:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    with open(OUT_GUIDE, "w", encoding="utf-8") as f:
        f.write(GUIDE_TEXT)

    print(f"\nWrote {len(all_samples)} pages  -->  {OUT_JSONL}")
    print(f"Wrote labeling guide         -->  {OUT_GUIDE}")
    print("\nPer-type breakdown:")
    for ct, n in stats.items():
        print(f"  {ct:<14} {n} pages")
    print("\nNext steps:")
    print("  1. Open data/labeling/manual_review_sample.jsonl in Doccano or a text editor.")
    print("  2. Correct entity spans and labels.")
    print("  3. Set review_status = VERIFIED, add reviewer name.")
    print("  4. Hand the file back to merge into doccano_all_labeled_verified.jsonl.")


if __name__ == "__main__":
    main()
