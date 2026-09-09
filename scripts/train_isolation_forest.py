import os
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import pickle

def main():
    import sys
    csv_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join("data", "case_type_cyber", "ml", "graph_features_rich_cleaned_v6.csv")
    if not os.path.exists(csv_path):
        print(f"ERROR: {csv_path} not found.")
        return
        
    print(f"Loading {csv_path}...")
    df = pd.read_csv(csv_path, escapechar="\\")
    
    print(f"Total entities loaded: {len(df)}")
    
    # Exclude non-numeric and identifier columns
    exclude_cols = ['entity_id', 'node_id', 'entity_text', 'text', 'case_id', 'entity_type', 'label', 'labels', 'anomaly_score', 'is_anomaly']
    
    numeric_df = df.select_dtypes(include=[np.number])
    feature_cols = [col for col in numeric_df.columns if col.lower() not in exclude_cols]
    
    if not feature_cols:
        print("ERROR: No usable numeric features found.")
        return
        
    print(f"Selected numeric features: {feature_cols}")
    
    X = numeric_df[feature_cols].copy()
    
    # Clean data
    X.replace([np.inf, -np.inf], np.nan, inplace=True)
    X.fillna(X.median(), inplace=True)
    
    # Drop constant columns
    X = X.loc[:, (X != X.iloc[0]).any()] 
    feature_cols = list(X.columns)
    
    if not feature_cols:
        print("ERROR: No usable numeric features remaining after dropping constant columns.")
        return
        
    print(f"Training Isolation Forest on {len(X)} rows with features: {feature_cols}")
    
    model = IsolationForest(
        n_estimators=200,
        contamination="auto",
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X)
    
    df['anomaly_score'] = -model.decision_function(X)
    predictions = model.predict(X)
    df['is_anomaly'] = (predictions == -1).astype(int)
    
    # Save model
    os.makedirs("models", exist_ok=True)
    with open(os.path.join("models", "isolation_forest_v3.pkl"), "wb") as f:
        pickle.dump(model, f)
        
    with open(os.path.join("models", "isolation_forest_v3_features.json"), "w") as f:
        json.dump({"features": feature_cols}, f)
        
    out_csv = sys.argv[2] if len(sys.argv) > 2 else os.path.join("data", "case_type_cyber", "ml", "anomaly_scores_cleaned_v6.csv")
    df.to_csv(out_csv, index=False)
    
    anomaly_count = df['is_anomaly'].sum()
    anomaly_pct = (anomaly_count / len(df)) * 100
    
    print("\n--- Isolation Forest Summary ---")
    print(f"Source file: {csv_path}")
    print(f"Rows used: {len(X)}")
    print(f"Selected features: {feature_cols}")
    print(f"Total entities: {len(df)}")
    print(f"Anomaly count: {anomaly_count}")
    print(f"Anomaly percentage: {anomaly_pct:.2f}%")
    print(f"Saved model to: models\\isolation_forest_v3.pkl")
    print(f"Saved scores to: {out_csv}")
    
    print("\nTop 10 most anomalous entities:")
    top10 = df.sort_values('anomaly_score', ascending=False).head(10)
    for i, (_, row) in enumerate(top10.iterrows(), 1):
        node_id = row.get('node_id', 'Unknown')
        score = row.get('anomaly_score', 0)
        degree = row.get('degree', 0)
        print(f"  {i}. {node_id} (Score: {score:.4f}, Degree: {degree})")

if __name__ == "__main__":
    main()
