import os
import json
import csv
import pandas as pd
import networkx as nx

def main():
    import sys
    nodes_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join("data", "case_type_cyber", "graphs", "ner_nodes_cleaned_v6.json")
    edges_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join("data", "case_type_cyber", "graphs", "ner_edges_cleaned_v6.json")
    out_path = sys.argv[3] if len(sys.argv) > 3 else os.path.join("data", "case_type_cyber", "ml", "graph_features_rich_cleaned_v6.csv")
    
    if not os.path.exists(nodes_path) or not os.path.exists(edges_path):
        print("Graph files not found.")
        return
        
    with open(nodes_path, "r", encoding="utf-8") as f:
        nodes = json.load(f)
    with open(edges_path, "r", encoding="utf-8") as f:
        edges = json.load(f)
        
    G = nx.Graph()
    for n in nodes:
        G.add_node(n["id"], label=n.get("label", ""), text=n.get("text", ""))
        
    for e in edges:
        G.add_edge(e["source"], e["target"], weight=e.get("weight", 1))
        
    print(f"Graph loaded with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges.")
    
    features = []
    
    try:
        print("Computing network metrics...")
        degree_dict = dict(G.degree())
        weighted_degree_dict = dict(G.degree(weight="weight"))
        betweenness = nx.betweenness_centrality(G, weight="weight")
        closeness = nx.closeness_centrality(G)
        pagerank = nx.pagerank(G, weight="weight")
        clustering = nx.clustering(G, weight="weight")
        # Removing self loops for core_number computation
        G_no_loops = G.copy()
        G_no_loops.remove_edges_from(nx.selfloop_edges(G_no_loops))
        core_number = nx.core_number(G_no_loops)
        avg_neighbor_degree = nx.average_neighbor_degree(G, weight="weight")
    except Exception as e:
        print(f"Warning: Failed to compute some graph metrics: {e}")
        
    components = list(nx.connected_components(G))
    comp_size_dict = {}
    for comp in components:
        size = len(comp)
        for node in comp:
            comp_size_dict[node] = size
            
    for node, data in G.nodes(data=True):
        f = {
            "node_id": node,
            "entity_type": data.get("label", ""),
            "entity_text": data.get("text", ""),
            "degree": degree_dict.get(node, 0),
            "weighted_degree": weighted_degree_dict.get(node, 0),
            "betweenness_centrality": betweenness.get(node, 0),
            "closeness_centrality": closeness.get(node, 0),
            "pagerank": pagerank.get(node, 0),
            "clustering_coefficient": clustering.get(node, 0),
            "k_core_number": core_number.get(node, 0),
            "connected_component_size": comp_size_dict.get(node, 0),
            "average_neighbor_degree": avg_neighbor_degree.get(node, 0),
            "number_of_unique_neighbors": len(list(G.neighbors(node)))
        }
        
        # Connected entity types
        neighbor_types = set()
        for neighbor in G.neighbors(node):
            n_type = G.nodes[neighbor].get("label")
            if n_type:
                neighbor_types.add(n_type)
        f["number_of_connected_entity_types"] = len(neighbor_types)
        
        features.append(f)
        
    df = pd.DataFrame(features)
    
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    df.to_csv(out_path, index=False, escapechar="\\")
    
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    
    print(f"\nSaved rich features to {out_path}")
    print(f"Row count: {len(df)}")
    print(f"Output columns: {list(df.columns)}")
    print(f"Missing-value counts:\n{df.isnull().sum()}")
    print(f"Numeric feature columns: {numeric_cols}")
    print("\nBasic descriptive statistics:")
    print(df[numeric_cols].describe())

if __name__ == "__main__":
    main()
