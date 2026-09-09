"""
SIH-26189: Labeling diff tool.

Compares original auto-labeled records with manually corrected records
and prints a span-level diff: added, removed, and retyped entities.

Usage:
  python scripts/diff_labeling.py \\
      data/case_type_murder/ner/murder_cases_labeled.jsonl \\
      data/ner/doccano_all_labeled_verified.jsonl

Or run with defaults (compares original sample against itself as a dry-run):
  python scripts/diff_labeling.py
"""

import os
import json
import sys
from collections import defaultdict


def load_jsonl(path: str) -> list[dict]:
    if not os.path.exists(path):
        print(f"ERROR: File not found: {path}")
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(l) for l in f if l.strip()]


def ent_set(rec: dict) -> set[tuple]:
    text = rec.get("text", "")
    return {
        (int(s), int(e), lbl, text[int(s):int(e)])
        for s, e, lbl in rec.get("entities", [])
    }


def diff_records(orig: dict, corrected: dict) -> dict:
    before = ent_set(orig)
    after  = ent_set(corrected)

    added   = after - before
    removed = before - after

    # Retyped: same span, different label
    before_by_span = {(s, e): lbl for s, e, lbl, _ in before}
    after_by_span  = {(s, e): lbl for s, e, lbl, _ in after}
    retyped = [
        (s, e, before_by_span[s, e], after_by_span[s, e])
        for (s, e) in before_by_span
        if (s, e) in after_by_span and before_by_span[s, e] != after_by_span[s, e]
    ]

    return {"added": list(added), "removed": list(removed), "retyped": retyped}


def main() -> None:
    original_path  = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        "data", "labeling", "manual_review_sample.jsonl")
    corrected_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
        "data", "ner", "doccano_all_labeled_verified.jsonl")

    originals  = load_jsonl(original_path)
    correcteds = load_jsonl(corrected_path)

    # Match by text (first 80 chars as key to handle minor whitespace diffs)
    orig_by_text  = {r["text"][:80]: r for r in originals}
    corr_by_text  = {r["text"][:80]: r for r in correcteds}

    matched   = set(orig_by_text) & set(corr_by_text)
    unmatched = set(corr_by_text) - set(orig_by_text)

    total_added = total_removed = total_retyped = 0
    per_type_delta: dict[str, int] = defaultdict(int)

    print(f"\n{'='*60}")
    print(f"LABELING DIFF: {os.path.basename(original_path)}")
    print(f"          vs : {os.path.basename(corrected_path)}")
    print(f"{'='*60}")
    print(f"Matched records : {len(matched)}")
    print(f"New records     : {len(unmatched)}")
    print()

    for key in sorted(matched):
        diff = diff_records(orig_by_text[key], corr_by_text[key])
        case_id = orig_by_text[key].get("meta", {}).get("case_id", "?")
        case_type = corr_by_text[key].get("meta", {}).get("case_type",
                    orig_by_text[key].get("meta", {}).get("case_type", "?"))

        n_add = len(diff["added"])
        n_rem = len(diff["removed"])
        n_ret = len(diff["retyped"])

        if n_add == 0 and n_rem == 0 and n_ret == 0:
            continue  # unchanged

        total_added   += n_add
        total_removed += n_rem
        total_retyped += n_ret
        per_type_delta[case_type] += n_add + n_rem + n_ret

        print(f"  [{case_type}] {case_id}")
        for s, e, lbl, surface in diff["added"]:
            print(f"    + ADDED   [{lbl}] \"{surface}\" @{s}-{e}")
        for s, e, lbl, surface in diff["removed"]:
            print(f"    - REMOVED [{lbl}] \"{surface}\" @{s}-{e}")
        for s, e, before_lbl, after_lbl in diff["retyped"]:
            print(f"    ~ RETYPE  {before_lbl} -> {after_lbl} @{s}-{e}")

    print()
    print(f"{'='*60}")
    print(f"SUMMARY")
    print(f"{'='*60}")
    print(f"  Spans added   : {total_added}")
    print(f"  Spans removed : {total_removed}")
    print(f"  Spans retyped : {total_retyped}")
    print(f"  Total changes : {total_added + total_removed + total_retyped}")
    print()
    if per_type_delta:
        print("  Changes by case type:")
        for ct, n in sorted(per_type_delta.items(), key=lambda x: -x[1]):
            print(f"    {ct:<14} {n} span changes")
    print()
    if unmatched:
        print(f"  New records (not in original sample): {len(unmatched)}")
        for key in list(unmatched)[:3]:
            print(f"    \"{key[:60]}...\"")


if __name__ == "__main__":
    main()
