import os
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score, average_precision_score, balanced_accuracy_score
import pickle

def main():
    features_path = os.path.join("data", "case_type_cyber", "ml", "graph_features_rich.csv")
    labels_path = os.path.join("data", "case_type_cyber", "ml", "entity_ground_truth.csv")
    status_path = os.path.join("data", "case_type_cyber", "ml", "random_forest_training_status.json")
    
    if not os.path.exists(features_path) or not os.path.exists(labels_path):
        msg = "Missing features or ground truth file. Skipping training."
        print(msg)
        with open(status_path, "w") as f:
            json.dump({"trained": False, "reason": msg}, f)
        return
        
    print(f"Loading features from {features_path}")
    print(f"Loading labels from {labels_path}")
    
    df_feat = pd.read_csv(features_path, escapechar="\\")
    df_labels = pd.read_csv(labels_path)
    
    # Identify identifier columns to join on
    id_col = None
    for col in ['node_id', 'entity_id']:
        if col in df_feat.columns and col in df_labels.columns:
            id_col = col
            break
            
    if not id_col:
        msg = "No common identifier column (node_id or entity_id) found for joining."
        print(msg)
        with open(status_path, "w") as f:
            json.dump({"trained": False, "reason": msg}, f)
        return
        
    df = pd.merge(df_feat, df_labels, on=id_col, how='inner')
    
    # Find target column
    target_candidates = ['is_suspect', 'suspect', 'accused', 'target', 'ground_truth']
    target_col = None
    for col in df.columns:
        if col.lower() in target_candidates:
            target_col = col
            break
            
    if not target_col:
        msg = "No valid binary target column found in ground truth."
        print(msg)
        with open(status_path, "w") as f:
            json.dump({"trained": False, "reason": msg}, f)
        return
        
    df = df.dropna(subset=[target_col])
    
    # Validate target
    unique_vals = df[target_col].unique()
    if len(unique_vals) < 2:
        msg = f"Target {target_col} has only one class. Need binary target for classification."
        print(msg)
        with open(status_path, "w") as f:
            json.dump({"trained": False, "reason": msg}, f)
        return
        
    class_counts = df[target_col].value_counts()
    if class_counts.min() < 5:
        msg = f"Target {target_col} has insufficient samples in one class (need at least 5). Counts: {class_counts.to_dict()}"
        print(msg)
        with open(status_path, "w") as f:
            json.dump({"trained": False, "reason": msg}, f)
        return
        
    # Select numeric features
    exclude_cols = ['entity_id', 'node_id', 'entity_text', 'text', 'case_id', 'entity_type', 'label', 'labels', 'anomaly_score', 'is_anomaly', 'prediction', 'pred', target_col.lower()]
    
    numeric_df = df.select_dtypes(include=[np.number])
    feature_cols = [col for col in numeric_df.columns if col.lower() not in exclude_cols]
    
    if not feature_cols:
        msg = "No usable numeric features found."
        print(msg)
        with open(status_path, "w") as f:
            json.dump({"trained": False, "reason": msg}, f)
        return
        
    X = df[feature_cols].copy()
    y = df[target_col].astype(int)
    
    # Clean data
    X.replace([np.inf, -np.inf], np.nan, inplace=True)
    X.fillna(X.median(), inplace=True)
    
    X = X.loc[:, (X != X.iloc[0]).any()] 
    feature_cols = list(X.columns)
    
    # Leakage checks
    print(f"Leakage check: Ensure duplicate IDs across train/test? Managed by train_test_split on unique index.")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print(f"Training Random Forest on {len(X_train)} rows.")
    
    model = RandomForestClassifier(
        n_estimators=500,
        class_weight="balanced",
        max_features="sqrt",
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    # Cross validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scoring = ['accuracy', 'f1', 'roc_auc', 'average_precision', 'balanced_accuracy']
    cv_results = cross_validate(model, X, y, cv=cv, scoring=scoring)
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    bal_acc = balanced_accuracy_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    auc = roc_auc_score(y_test, y_prob)
    ap = average_precision_score(y_test, y_prob)
    
    df['rf_prediction'] = model.predict(X)
    df['rf_probability'] = model.predict_proba(X)[:, 1]
    
    os.makedirs("models", exist_ok=True)
    with open(os.path.join("models", "random_forest_suspect_v2.pkl"), "wb") as f:
        pickle.dump(model, f)
        
    with open(os.path.join("models", "random_forest_suspect_v2_features.json"), "w") as f:
        json.dump({"features": feature_cols}, f)
        
    out_csv = os.path.join("data", "case_type_cyber", "ml", "classifier_predictions_v2.csv")
    df.to_csv(out_csv, index=False)
    
    metrics = {
        "holdout": {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1": f1,
            "balanced_accuracy": bal_acc,
            "roc_auc": auc,
            "average_precision": ap,
            "confusion_matrix": cm
        },
        "cv_mean": {k: np.mean(v) for k, v in cv_results.items() if k.startswith('test_')},
        "cv_std": {k: np.std(v) for k, v in cv_results.items() if k.startswith('test_')}
    }
    with open(os.path.join("data", "case_type_cyber", "ml", "random_forest_metrics_v2.json"), "w") as f:
        json.dump(metrics, f)
        
    print("\n--- Improved Random Forest Summary ---")
    print(f"Rows used: {len(X)}")
    print(f"Class distribution: {y.value_counts().to_dict()}")
    print(f"Selected features: {feature_cols}")
    print("\nHoldout Metrics:")
    for k, v in metrics["holdout"].items():
        print(f"  {k}: {v}")
    print("\nCross-Validation Metrics (Mean):")
    for k, v in metrics["cv_mean"].items():
        print(f"  {k}: {v:.4f} (+/- {metrics['cv_std'][k]:.4f})")
        
    print("\nTop 15 feature importances:")
    importances = model.feature_importances_
    for idx in importances.argsort()[::-1][:15]:
        print(f"  {feature_cols[idx]}: {importances[idx]:.4f}")
        
if __name__ == "__main__":
    main()
