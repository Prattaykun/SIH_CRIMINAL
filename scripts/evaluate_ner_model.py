"""
SIH-26189: Evaluate a trained spaCy NER model on the test split.

Computes entity-level precision / recall / F1 (exact match on start, end, label).
Also prints per-label breakdown.

Usage:
  python scripts/evaluate_ner_model.py
"""

import os
import json
from collections import defaultdict

import spacy

MODEL_PATH = os.path.join("models", "ner_v5", "model-best")
TEST_PATH  = os.path.join("data", "ner", "test.jsonl")


def prf(tp: int, fp: int, fn: int) -> tuple[float, float, float]:
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall    = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall / (precision + recall)
          if (precision + recall) > 0 else 0.0)
    return precision, recall, f1


def main() -> None:
    if not os.path.exists(MODEL_PATH):
        print(f"ERROR: Model not found at {MODEL_PATH}")
        print("Train the model first with:")
        print("  python -m spacy train config.cfg --output ./models/ner_v1")
        return

    if not os.path.exists(TEST_PATH):
        print(f"ERROR: Test file not found at {TEST_PATH}")
        print("Run prepare_ner_splits.py first.")
        return

    print(f"Loading model from {MODEL_PATH} ...")
    nlp = spacy.load(MODEL_PATH)

    with open(TEST_PATH, "r", encoding="utf-8") as fh:
        records = [json.loads(line) for line in fh if line.strip()]

    print(f"Evaluating on {len(records)} test records ...\n")

    overall_tp = overall_fp = overall_fn = 0
    per_label: dict[str, dict[str, int]] = defaultdict(lambda: {"tp": 0, "fp": 0, "fn": 0})

    for rec in records:
        text: str = rec.get("text", "")
        gold_ents = rec.get("entities", [])
        gold_set: set[tuple] = set(
            (int(e[0]), int(e[1]), str(e[2])) for e in gold_ents
        )

        doc = nlp(text)
        pred_set: set[tuple] = set(
            (ent.start_char, ent.end_char, ent.label_) for ent in doc.ents
        )

        tp_set = gold_set & pred_set
        fp_set = pred_set - gold_set
        fn_set = gold_set - pred_set

        overall_tp += len(tp_set)
        overall_fp += len(fp_set)
        overall_fn += len(fn_set)

        for (_, _, label) in tp_set:
            per_label[label]["tp"] += 1
        for (_, _, label) in fp_set:
            per_label[label]["fp"] += 1
        for (_, _, label) in fn_set:
            per_label[label]["fn"] += 1

    # -----------------------------------------------------------------------
    # Overall metrics
    # -----------------------------------------------------------------------
    p, r, f = prf(overall_tp, overall_fp, overall_fn)
    print("=" * 55)
    print("OVERALL ENTITY-LEVEL METRICS  (exact match)")
    print("=" * 55)
    print(f"  TP: {overall_tp}  FP: {overall_fp}  FN: {overall_fn}")
    print(f"  Precision : {p:.4f}")
    print(f"  Recall    : {r:.4f}")
    print(f"  F1 Score  : {f:.4f}")

    # -----------------------------------------------------------------------
    # Per-label metrics
    # -----------------------------------------------------------------------
    print()
    print("=" * 55)
    print("PER-LABEL METRICS")
    print("=" * 55)
    print(f"  {'Label':<18} {'P':>7} {'R':>7} {'F1':>7} {'TP':>6} {'FP':>6} {'FN':>6}")
    print("  " + "-" * 52)
    for label in sorted(per_label.keys()):
        d = per_label[label]
        lp, lr, lf = prf(d["tp"], d["fp"], d["fn"])
        print(
            f"  {label:<18} {lp:>7.4f} {lr:>7.4f} {lf:>7.4f}"
            f" {d['tp']:>6} {d['fp']:>6} {d['fn']:>6}"
        )


if __name__ == "__main__":
    main()
