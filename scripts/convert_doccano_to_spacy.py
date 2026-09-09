"""
SIH-26189: Convert Doccano JSONL splits to spaCy binary (.spacy) format.

Reads:  train.jsonl, dev.jsonl  (Doccano sequence-labeling format)
Writes: train.spacy, dev.spacy

Handles:
  - Offsets out of range  (entity dropped with warning)
  - Unaligned token boundaries (alignment_mode="contract" then "expand")
  - Overlapping entities (resolved via spaCy filter_spans — longest span wins)

Usage:
  pip install spacy
  python -m spacy download en_core_web_sm   # only needed if you want the full pipeline
  python scripts/convert_doccano_to_spacy.py
"""

import os
import json

import spacy
from spacy.tokens import DocBin
from spacy.util import filter_spans

IN_DIR = os.path.join("data", "ner")
OUT_DIR = os.path.join("data", "spacy_format")
os.makedirs(OUT_DIR, exist_ok=True)

SPLITS = {
    "train": (
        os.path.join(IN_DIR, "train.jsonl"),
        os.path.join(OUT_DIR, "train.spacy"),
    ),
    "dev": (
        os.path.join(IN_DIR, "val.jsonl"),
        os.path.join(OUT_DIR, "val.spacy"),
    ),
}


def convert_split(
    jsonl_path: str,
    spacy_path: str,
    nlp: spacy.language.Language,
    split_name: str,
) -> None:
    if not os.path.exists(jsonl_path):
        print(f"  [SKIP] {jsonl_path} not found — run prepare_ner_splits.py first.")
        return

    with open(jsonl_path, "r", encoding="utf-8") as fh:
        records = [json.loads(line) for line in fh if line.strip()]

    db = DocBin()
    total_entities = 0
    dropped_range = 0
    dropped_align = 0
    dropped_overlap = 0
    adjusted = 0

    for rec in records:
        text: str = rec.get("text", "")
        raw_entities: list = rec.get("entities", [])

        doc = nlp.make_doc(text)
        spans = []

        for ent in raw_entities:
            start, end, label = int(ent[0]), int(ent[1]), str(ent[2])
            total_entities += 1

            # 1. Range check
            if start < 0 or end > len(text) or start >= end:
                dropped_range += 1
                continue

            # 2. Try contract alignment first (strict), then expand (lenient)
            span = doc.char_span(start, end, label=label, alignment_mode="contract")
            if span is None:
                span = doc.char_span(start, end, label=label, alignment_mode="expand")
                if span is not None:
                    adjusted += 1

            if span is None:
                dropped_align += 1
                continue

            spans.append(span)

        # 3. Resolve overlaps (longest span wins)
        filtered = filter_spans(spans)
        dropped_overlap += len(spans) - len(filtered)
        doc.ents = filtered
        db.add(doc)

    db.to_disk(spacy_path)

    print(f"\n  [{split_name.upper()}] {jsonl_path}")
    print(f"    Docs written          : {len(records)}")
    print(f"    Total raw entities    : {total_entities}")
    print(f"    Dropped (out-of-range): {dropped_range}")
    print(f"    Dropped (unaligned)   : {dropped_align}")
    print(f"    Dropped (overlapping) : {dropped_overlap}")
    print(f"    Boundaries adjusted   : {adjusted}")
    print(f"    -> Written to         : {spacy_path}")


def main() -> None:
    print("Loading blank English spaCy pipeline ...")
    nlp = spacy.blank("en")

    for split_name, (jsonl_path, spacy_path) in SPLITS.items():
        convert_split(jsonl_path, spacy_path, nlp, split_name)

    print("\nConversion complete.")


if __name__ == "__main__":
    main()
