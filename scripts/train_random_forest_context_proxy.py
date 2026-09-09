import os
import json
import numpy as np
import pandas as pd
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, train_test_split, cross_validate
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, balanced_accuracy_score, roc_auc_score, confusion_matrix
from sklearn.impute import SimpleImputer
import warnings
warnings.filterwarnings('ignore')

def main():
    print("WARNING: Random Forest trained on automatically generated textual proxy labels. Do not use for verified suspect classification.\n")
    
    import sys
    label_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join("data", "case_type_cyber", "ml", "entity_context_review_completed_v5.csv")
    feat_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join("data", "case_type_cyber", "ml", "graph_features_rich_cleaned_v5.csv")
    
    df_labels = pd.read_csv(label_path, escapechar="\\")
    df_feat = pd.read_csv(feat_path, escapechar="\\")
    
    id_col = 'node_id' if 'node_id' in df_labels.columns else 'entity_id'
    
    df = pd.merge(df_feat, df_labels[[id_col, 'is_suspect']], on=id_col, how='inner')
    
    if df[id_col].duplicated().any():
        print("ERROR: Duplicate identifiers found.")
        return
    
    df['is_suspect'] = pd.to_numeric(df['is_suspect'], errors='coerce')
    df = df.dropna(subset=['is_suspect'])
    df['is_suspect'] = df['is_suspect'].astype(int)
    
    print(f"Labeled rows joined: {len(df)}")
    
    class_counts = df['is_suspect'].value_counts()
    print("Class distribution:")
    print(class_counts.to_string())
    
    if len(class_counts) < 2:
        print("ERROR: Both target classes do not exist.")
        return
        
    numeric_features = [
        'degree', 'weighted_degree', 'betweenness_centrality', 'closeness_centrality',
        'pagerank', 'clustering_coefficient', 'k_core_number', 'connected_component_size',
        'average_neighbor_degree', 'number_of_unique_neighbors', 'number_of_connected_entity_types'
    ]
    
    available_features = [f for f in numeric_features if f in df.columns]
    X = df[available_features].copy()
    y = df['is_suspect'].copy()
    
    X = X.replace([np.inf, -np.inf], np.nan)
    
    imputer = SimpleImputer(strategy='median')
    X_imputed = imputer.fit_transform(X)
    X = pd.DataFrame(X_imputed, columns=X.columns)
    
    X = X.loc[:, (X != X.iloc[0]).any()] 
    final_features = list(X.columns)
    print(f"\nFinal Selected Features: {final_features}")
    
    min_class = class_counts.min()
    n_splits = 5 if min_class >= 5 else 3
    
    print(f"\nUsing {n_splits}-fold Stratified CV (min class size is {min_class})")
    
    rf = RandomForestClassifier(
        n_estimators=500,
        class_weight="balanced",
        max_features="sqrt",
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    scoring = ['accuracy', 'precision', 'recall', 'f1', 'balanced_accuracy', 'roc_auc']
    
    cv_results = cross_validate(rf, X, y, cv=cv, scoring=scoring, return_train_score=False)
    
    proxy_metrics = {
        "proxy_accuracy_mean": float(np.mean(cv_results['test_accuracy'])),
        "proxy_accuracy_std": float(np.std(cv_results['test_accuracy'])),
        "proxy_precision_mean": float(np.mean(cv_results['test_precision'])),
        "proxy_precision_std": float(np.std(cv_results['test_precision'])),
        "proxy_recall_mean": float(np.mean(cv_results['test_recall'])),
        "proxy_recall_std": float(np.std(cv_results['test_recall'])),
        "proxy_f1_mean": float(np.mean(cv_results['test_f1'])),
        "proxy_f1_std": float(np.std(cv_results['test_f1'])),
        "proxy_balanced_accuracy_mean": float(np.mean(cv_results['test_balanced_accuracy'])),
        "proxy_roc_auc_mean": float(np.mean(cv_results['test_roc_auc']))
    }
    
    print("\n--- Cross-Validation Proxy Metrics ---")
    for k, v in proxy_metrics.items():
        if "mean" in k:
            metric = k.replace('_mean', '')
            std_key = k.replace('_mean', '_std')
            if std_key in proxy_metrics:
                print(f"{metric}: {v:.4f} +/- {proxy_metrics[std_key]:.4f}")
            else:
                print(f"{metric}: {v:.4f}")
                
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    rf.fit(X_train, y_train)
    
    y_pred = rf.predict(X_test)
    if len(np.unique(y_test)) > 1:
        y_prob = rf.predict_proba(X_test)[:, 1]
        holdout_metrics = {
            "proxy_accuracy": float(accuracy_score(y_test, y_pred)),
            "proxy_precision": float(precision_score(y_test, y_pred)),
            "proxy_recall": float(recall_score(y_test, y_pred)),
            "proxy_f1": float(f1_score(y_test, y_pred)),
            "proxy_balanced_accuracy": float(balanced_accuracy_score(y_test, y_pred)),
            "proxy_roc_auc": float(roc_auc_score(y_test, y_prob)),
            "confusion_matrix": confusion_matrix(y_test, y_pred).tolist()
        }
    else:
        holdout_metrics = {"error": "Test set lacks both classes"}
        
    print("\n--- Holdout Proxy Metrics ---")
    if "error" not in holdout_metrics:
        for k, v in holdout_metrics.items():
            if k != "confusion_matrix":
                print(f"{k}: {v:.4f}")
        print("Confusion Matrix:")
        print(np.array(holdout_metrics["confusion_matrix"]))
    else:
        print(holdout_metrics["error"])
    
    rf.fit(X, y)
    importances = rf.feature_importances_
    imp_df = pd.DataFrame({"feature": final_features, "importance": importances}).sort_values(by="importance", ascending=False)
    
    print("\n--- Top Feature Importances ---")
    print(imp_df.head(5).to_string(index=False))
    
    out_model = os.path.join("models", "random_forest_context_proxy_v2.pkl")
    out_feat = os.path.join("models", "random_forest_context_proxy_v2_features.json")
    out_pred = os.path.join("data", "case_type_cyber", "ml", "context_proxy_predictions_v2.csv")
    out_metrics = os.path.join("data", "case_type_cyber", "ml", "random_forest_context_proxy_v2_metrics.json")
    out_limit = os.path.join("data", "case_type_cyber", "ml", "CONTEXT_PROXY_LIMITATIONS_v2.md")
    
    os.makedirs("models", exist_ok=True)
    with open(out_model, "wb") as f:
        pickle.dump(rf, f)
        
    with open(out_feat, "w") as f:
        json.dump({"features": final_features}, f)
        
    df_pred = df[[id_col, 'is_suspect']].copy()
    df_pred['proxy_prediction'] = rf.predict(X)
    df_pred['proxy_probability'] = rf.predict_proba(X)[:, 1]
    df_pred.to_csv(out_pred, index=False)
    
    all_metrics = {
        "cv_proxy_metrics": proxy_metrics,
        "holdout_proxy_metrics": holdout_metrics,
        "feature_importances": imp_df.to_dict(orient="records")
    }
    with open(out_metrics, "w") as f:
        json.dump(all_metrics, f, indent=4)
        
    with open(out_limit, "w", encoding="utf-8") as f:
        f.write("# CONTEXT PROXY LIMITATIONS\n\n")
        f.write("- Labels were automatically generated using context keywords.\n")
        f.write("- Labels were not confirmed by investigators.\n")
        f.write("- Evidence-reference presence does not prove label correctness.\n")
        f.write("- Metrics measure agreement with the labeling heuristic, not ground-truth.\n")
        f.write("- Performance on real suspect classification is unknown.\n")
        f.write("- The model must not be used alone for enforcement decisions.\n")
        f.write("- A larger investigator-reviewed dataset is required for production use.\n")
        
    print("\nOutput files saved:")
    print(f"- {out_model}")
    print(f"- {out_feat}")
    print(f"- {out_pred}")
    print(f"- {out_metrics}")
    print(f"- {out_limit}")

if __name__ == "__main__":
    main()
