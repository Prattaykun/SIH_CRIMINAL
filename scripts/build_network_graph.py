"""
SIH-26189: Build a simple criminal network graph from NER-labeled JSONL.

Reads:  doccano_auto_labeled_vertex.jsonl  (or any Doccano-format JSONL)
        OR runs the spaCy model live on the text if "entities" key is absent.

Outputs:
  data/case_type_cyber/graphs/ner_nodes.json
  data/case_type_cyber/graphs/ner_edges.json

Node id = "<LABEL>|<text>"  (e.g. "PERSON|Ramesh Kumar")
Edges connect every pair of entities co-occurring in the same document.
Edge weight is incremented for every document in which both appear.

Usage:
  python scripts/build_network_graph.py
"""

import os
import json
from collections import defaultdict
from itertools import combinations

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
import sys

INPUT_PATH = os.path.join(
    "data", "ner", "doccano_all_labeled_unified.jsonl"
)
GRAPH_DIR = os.path.join("data", "case_type_cyber", "graphs")
NODES_PATH = os.path.join(GRAPH_DIR, "ner_nodes_full_v6.json")
EDGES_PATH = os.path.join(GRAPH_DIR, "ner_edges_full_v6.json")

MODEL_PATH = os.path.join("models", "ner_v6", "model-best")

# Minimum edge weight to include in output (keeps the graph clean for demo)
MIN_EDGE_WEIGHT = 1


def load_entities_from_record(rec: dict, nlp=None) -> list[tuple[str, str]]:
    """
    Return a list of (label, text) tuples for a single record.

    Prefers pre-computed 'entities' field; falls back to running spaCy model.
    """
    text: str = rec.get("text", "")
    raw_entities = rec.get("entities")

    if raw_entities is not None:
        result = []
        for ent in raw_entities:
            start, end, label = int(ent[0]), int(ent[1]), str(ent[2])
            snippet = text[start:end].strip()
            if snippet:
                result.append((label, snippet))
        return result

    # Fall back to live model inference
    if nlp is not None and text.strip():
        doc = nlp(text)
        return [(ent.label_, ent.text.strip()) for ent in doc.ents]

    return []


def main() -> None:
    if not os.path.exists(INPUT_PATH):
        print(f"ERROR: Input file not found: {INPUT_PATH}")
        return

    os.makedirs(GRAPH_DIR, exist_ok=True)

    # Optionally load the spaCy model as fallback
    nlp = None
    if os.path.exists(MODEL_PATH):
        try:
            import spacy
            print(f"Loading model from {MODEL_PATH} ...")
            nlp = spacy.load(MODEL_PATH)
        except Exception as exc:
            print(f"[WARN] Could not load spaCy model ({exc}). Using pre-labeled entities only.")
    else:
        print(f"[INFO] No trained model found at {MODEL_PATH}. Using pre-labeled entities only.")

    with open(INPUT_PATH, "r", encoding="utf-8") as fh:
        records = [json.loads(line) for line in fh if line.strip()]

    print(f"Processing {len(records)} records ...")

    # Accumulate nodes and edges
    node_ids: dict[str, dict] = {}          # id -> {id, label, text}
    edge_weights: dict[frozenset, int] = defaultdict(int)

    for rec in records:
        entities = load_entities_from_record(rec, nlp)

        # De-duplicate within a single document
        doc_nodes: set[str] = set()
        for label, text in entities:
            node_id = f"{label}|{text}"
            doc_nodes.add(node_id)
            if node_id not in node_ids:
                node_ids[node_id] = {"id": node_id, "label": label, "text": text}

        # All pairs in the same document get an edge weight increment
        for a, b in combinations(sorted(doc_nodes), 2):
            edge_key = frozenset({a, b})
            edge_weights[edge_key] += 1

    # -----------------------------------------------------------------------
    # Build final edge list (filtered by MIN_EDGE_WEIGHT)
    # -----------------------------------------------------------------------
    edges = []
    for pair, weight in edge_weights.items():
        if weight >= MIN_EDGE_WEIGHT:
            a, b = sorted(pair)
            edges.append({"source": a, "target": b, "weight": weight})

    edges.sort(key=lambda e: e["weight"], reverse=True)
    nodes = list(node_ids.values())

    # -----------------------------------------------------------------------
    # Write outputs
    # -----------------------------------------------------------------------
    with open(NODES_PATH, "w", encoding="utf-8") as fh:
        json.dump(nodes, fh, ensure_ascii=False, indent=2)

    with open(EDGES_PATH, "w", encoding="utf-8") as fh:
        json.dump(edges, fh, ensure_ascii=False, indent=2)

    # -----------------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------------
    print(f"\n{'=' * 55}")
    print("CRIMINAL NETWORK GRAPH — BUILD SUMMARY")
    print(f"{'=' * 55}")
    print(f"  Nodes (unique entities) : {len(nodes)}")
    print(f"  Edges (co-occurrences)  : {len(edges)}")
    print(f"  Nodes file              : {NODES_PATH}")
    print(f"  Edges file              : {EDGES_PATH}")

    print(f"\n  TOP 10 EDGES BY WEIGHT:")
    print(f"  {'Source':<35} {'Target':<35} {'W':>4}")
    print("  " + "-" * 76)
    for edge in edges[:10]:
        src = edge["source"][:34]
        tgt = edge["target"][:34]
        print(f"  {src:<35} {tgt:<35} {edge['weight']:>4}")


if __name__ == "__main__":
    main()
