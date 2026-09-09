import os
import json
import random

def main():
    in_path = os.path.join("data", "ner", "doccano_all_labeled_unified_v6.jsonl")
    
    with open(in_path, "r", encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]
        
    random.seed(42)
    random.shuffle(records)
    
    n = len(records)
    t_idx, d_idx = int(0.8 * n), int(0.9 * n)
    
    splits = {
        "train_v6.jsonl": records[:t_idx],
        "val_v6.jsonl": records[t_idx:d_idx],
        "test_v6.jsonl": records[d_idx:]
    }
    
    out_dir = os.path.join("data", "ner")
    os.makedirs(out_dir, exist_ok=True)
    
    for filename, recs in splits.items():
        out_path = os.path.join(out_dir, filename)
        with open(out_path, "w", encoding="utf-8") as f:
            for r in recs:
                f.write(json.dumps(r) + "\n")
        print(f"  {filename}: {len(recs)} records")

if __name__ == "__main__":
    main()
