import os
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score, average_precision_score, balanced_accuracy_score
import pickle

def train_and_eval(X, y, name, model_path, features_path, cv_folds=5):
    print(f"\n--- {name} ---")
    print(f"Training on {len(X)} rows with features: {list(X.columns)}")
    print("These labels are automatically generated proxies and have not been validated by investigators.")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    model = RandomForestClassifier(
        n_estimators=500,
        class_weight="balanced",
        max_features="sqrt",
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)
    scoring = ['accuracy', 'f1', 'roc_auc', 'average_precision', 'balanced_accuracy']
    cv_results = cross_validate(model, X, y, cv=cv, scoring=scoring)
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    metrics = {
        "proxy_label_accuracy": accuracy_score(y_test, y_pred),
        "proxy_label_precision": precision_score(y_test, y_pred, zero_division=0),
        "proxy_label_recall": recall_score(y_test, y_pred, zero_division=0),
        "proxy_label_f1": f1_score(y_test, y_pred, zero_division=0),
        "proxy_label_balanced_accuracy": balanced_accuracy_score(y_test, y_pred),
        "proxy_label_roc_auc": roc_auc_score(y_test, y_prob) if len(y_test.unique()) > 1 else None,
        "proxy_label_confusion_matrix": confusion_matrix(y_test, y_pred).tolist()
    }
    
    cv_means = {f"cv_mean_{k}": np.mean(v) for k, v in cv_results.items() if k.startswith('test_')}
    metrics.update(cv_means)
    
    print("\nProxy metrics (Holdout):")
    for k, v in metrics.items():
        if "cv" not in k and k != "proxy_label_confusion_matrix" and v is not None:
            print(f"  {k}: {v:.4f}")
            
    print("\nCross-validation (Mean):")
    for k, v in cv_means.items():
        print(f"  {k}: {v:.4f}")
        
    print("\nTop 5 feature importances:")
    importances = model.feature_importances_
    for idx in importances.argsort()[::-1][:5]:
        print(f"  {X.columns[idx]}: {importances[idx]:.4f}")
        
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    with open(features_path, "w") as f:
        json.dump({"features": list(X.columns)}, f)
        
    return model, metrics
    

def main():
    features_path = os.path.join("data", "case_type_cyber", "ml", "graph_features_rich.csv")
    labels_path = os.path.join("data", "case_type_cyber", "ml", "entity_weak_labels.csv")
    
    if not os.path.exists(features_path) or not os.path.exists(labels_path):
        print("Missing required files.")
        return
        
    df_feat = pd.read_csv(features_path, escapechar="\\")
    df_labels = pd.read_csv(labels_path)
    
    id_col = 'node_id' if 'node_id' in df_feat.columns else 'entity_id'
    
    df = pd.merge(df_feat, df_labels, on=id_col, how='inner')
    df = df.dropna(subset=['weak_label'])
    
    counts = df['weak_label'].value_counts()
    if len(counts) < 2 or counts.min() < 10:
        print("Not enough examples per class.")
        return
        
    print(f"Loaded {len(df)} rows with weak labels.")
    print("These labels are automatically generated proxies and have not been validated by investigators.")
    
    exclude_all = [id_col, 'entity_text', 'entity_type', 'weak_label', 'weak_label_reason', 'weak_label_confidence', 'weak_label_method', 'anomaly_score', 'is_anomaly']
    
    numeric_df = df.select_dtypes(include=[np.number])
    base_features = [c for c in numeric_df.columns if c not in exclude_all]
    
    X_base = numeric_df[base_features].copy()
    X_base.replace([np.inf, -np.inf], np.nan, inplace=True)
    X_base.fillna(X_base.median(), inplace=True)
    X_base = X_base.loc[:, (X_base != X_base.iloc[0]).any()]
    
    y = df['weak_label'].astype(int)
    
    os.makedirs("models", exist_ok=True)
    
    # Experiment A
    model_a, metrics_a = train_and_eval(
        X_base, y, 
        "Experiment A: Proxy-reproduction model",
        os.path.join("models", "random_forest_weak_v1.pkl"),
        os.path.join("models", "random_forest_weak_v1_features.json")
    )
    
    # Experiment B
    rule_features = ['degree', 'pagerank', 'number_of_connected_entity_types', 'weighted_degree']
    holdout_features = [c for c in X_base.columns if c not in rule_features]
    
    if not holdout_features:
        print("Error: No features left for Experiment B after excluding rule features.")
        return
        
    X_holdout = X_base[holdout_features].copy()
    model_b, metrics_b = train_and_eval(
        X_holdout, y,
        "Experiment B: Holdout feature model",
        os.path.join("models", "random_forest_weak_holdout_v1.pkl"),
        os.path.join("models", "random_forest_weak_holdout_v1_features.json")
    )
    
    # Predictions
    df_feat_full = df_feat.copy()
    X_full_a = df_feat_full[X_base.columns].copy()
    X_full_a.replace([np.inf, -np.inf], np.nan, inplace=True)
    X_full_a.fillna(X_full_a.median(), inplace=True)
    df_feat_full['pred_experiment_a'] = model_a.predict(X_full_a)
    
    X_full_b = df_feat_full[X_holdout.columns].copy()
    X_full_b.replace([np.inf, -np.inf], np.nan, inplace=True)
    X_full_b.fillna(X_full_b.median(), inplace=True)
    df_feat_full['pred_experiment_b'] = model_b.predict(X_full_b)
    
    out_csv = os.path.join("data", "case_type_cyber", "ml", "weak_label_predictions.csv")
    df_feat_full.to_csv(out_csv, index=False)
    
    metrics = {
        "experiment_a": metrics_a,
        "experiment_b": metrics_b
    }
    with open(os.path.join("data", "case_type_cyber", "ml", "random_forest_weak_metrics.json"), "w") as f:
        json.dump(metrics, f)
        
    print(f"\nSaved metrics to data\\case_type_cyber\\ml\\random_forest_weak_metrics.json")
    print(f"Saved predictions to {out_csv}")

if __name__ == "__main__":
    main()
