import os
import json

def clean_node(node):
    text = node.get("text", "").lower().strip()
    label = node.get("label", "").upper()
    
    document_artifacts = [
        "immediate investigative tasks", "initial entity", "complaint narrative",
        "case file association", "doc", "cctv", "whatsapp", "inr", "cdr", "kyc",
        "case file", "complaint", "first information report"
    ]
    
    institutions = ["rto", "fsl", "telecom", "acp", "police station", "bank", "hospital"]
    generic_tech = ["phone", "ip", "vehicle", "aadhaar", "pan"]
    locations = ["vibhuti khand", "gomti nagar", "mumbai", "pune", "delhi", "jaipur"]
    
    new_label = label
    
    # Exact/substring matching
    if any(art in text for art in document_artifacts):
        new_label = "ARTIFACT"
    elif any(inst == text for inst in institutions) or "police" in text:
        new_label = "INFRASTRUCTURE"
    elif any(tech == text for tech in generic_tech):
        new_label = "GENERIC_TECH"
    elif any(loc in text for loc in locations):
        new_label = "LOCATION"
        
    node["label"] = new_label
    
    # Update id to reflect new label (Optional, but if we do, we must update edges too)
    # Actually, it's better to keep the original ID so edges don't break, 
    # but the node label is updated. The node ID is just a string key.
    return node

def main():
    import sys
    
    if len(sys.argv) >= 5:
        nodes_path = sys.argv[1]
        edges_path = sys.argv[2]
        out_nodes_path = sys.argv[3]
        out_edges_path = sys.argv[4]
    else:
        nodes_path = os.path.join("data", "case_type_cyber", "graphs", "ner_nodes_full_v5.json")
        edges_path = os.path.join("data", "case_type_cyber", "graphs", "ner_edges_full_v5.json")
        
        out_nodes_path = os.path.join("data", "case_type_cyber", "graphs", "ner_nodes_cleaned_v5.json")
        out_edges_path = os.path.join("data", "case_type_cyber", "graphs", "ner_edges_cleaned_v5.json")
        
    with open(nodes_path, "r", encoding="utf-8") as f:
        nodes = json.load(f)
        
    with open(edges_path, "r", encoding="utf-8") as f:
        edges = json.load(f)
        
    # Remove duplicates from nodes while we're at it
    unique_nodes = {}
    for n in nodes:
        node_id = n["id"]
        if node_id not in unique_nodes:
            unique_nodes[node_id] = clean_node(n)
            
    cleaned_nodes = list(unique_nodes.values())
    
    # We can either keep or remove ARTIFACT nodes from the graph.
    # To properly clean the graph, removing ARTIFACT nodes reduces noise.
    valid_node_ids = {n["id"] for n in cleaned_nodes if n["label"] not in ["ARTIFACT", "GENERIC_TECH"]}
    
    final_nodes = [n for n in cleaned_nodes if n["id"] in valid_node_ids]
    
    final_edges = []
    for e in edges:
        if e["source"] in valid_node_ids and e["target"] in valid_node_ids:
            final_edges.append(e)
            
    with open(out_nodes_path, "w", encoding="utf-8") as f:
        json.dump(final_nodes, f, indent=2)
        
    with open(out_edges_path, "w", encoding="utf-8") as f:
        json.dump(final_edges, f, indent=2)
        
    print(f"Original nodes: {len(nodes)}, Cleaned valid nodes: {len(final_nodes)}")
    print(f"Original edges: {len(edges)}, Cleaned valid edges: {len(final_edges)}")
    print(f"Saved to {out_nodes_path} and {out_edges_path}")

if __name__ == "__main__":
    main()
