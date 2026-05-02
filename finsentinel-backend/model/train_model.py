"""Training script for the FinSentinel fraud detection model."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Dict, Tuple

import joblib
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier


def load_dataset(dataset_path: Path) -> pd.DataFrame:
    """Load the credit card fraud dataset from a CSV file."""
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset file not found at {dataset_path}")

    dataset = pd.read_csv(dataset_path)
    if "Class" not in dataset.columns:
        raise ValueError("Dataset must contain a 'Class' column.")

    return dataset


def split_and_scale_data(
    dataset: pd.DataFrame,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, StandardScaler]:
    """Split data into train/test sets and scale Time/Amount features."""
    features = dataset.drop(columns=["Class"])
    labels = dataset["Class"].astype(int)

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=0.2,
        random_state=42,
        stratify=labels,
    )

    scaler = StandardScaler()
    x_train_scaled = x_train.copy()
    x_test_scaled = x_test.copy()

    x_train_scaled.loc[:, ["Time", "Amount"]] = scaler.fit_transform(x_train[["Time", "Amount"]])
    x_test_scaled.loc[:, ["Time", "Amount"]] = scaler.transform(x_test[["Time", "Amount"]])

    return x_train_scaled, x_test_scaled, y_train, y_test, scaler


def apply_smote_sampling(x_train: pd.DataFrame, y_train: pd.Series) -> Tuple[pd.DataFrame, pd.Series]:
    """Balance the training dataset using SMOTE."""
    smote = SMOTE(random_state=42)
    x_resampled, y_resampled = smote.fit_resample(x_train, y_train)
    return x_resampled, y_resampled


def build_classifier() -> XGBClassifier:
    """Create and configure an XGBoost classifier."""
    return XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1,
    )


def evaluate_predictions(y_true: pd.Series, y_pred, y_prob) -> Dict[str, float]:
    """Compute standard classification metrics for model evaluation."""
    try:
        auc_roc = roc_auc_score(y_true, y_prob)
    except ValueError:
        auc_roc = 0.0

    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "auc_roc": auc_roc,
    }


def print_training_summary(
    train_metrics: Dict[str, float],
    test_metrics: Dict[str, float],
    report: str,
    matrix,
) -> None:
    """Print a detailed model training summary to stdout."""
    print("\n=== Training Metrics ===")
    print(f"Training Accuracy:  {train_metrics['accuracy']:.4f}")
    print(f"Training Precision: {train_metrics['precision']:.4f}")
    print(f"Training Recall:    {train_metrics['recall']:.4f}")
    print(f"Training F1:        {train_metrics['f1']:.4f}")
    print(f"Training AUC-ROC:   {train_metrics['auc_roc']:.4f}")

    print("\n=== Test Metrics ===")
    print(f"Test Accuracy:      {test_metrics['accuracy']:.4f}")
    print(f"Test Precision:     {test_metrics['precision']:.4f}")
    print(f"Test Recall:        {test_metrics['recall']:.4f}")
    print(f"Test F1:            {test_metrics['f1']:.4f}")
    print(f"Test AUC-ROC:       {test_metrics['auc_roc']:.4f}")

    print("\n=== Classification Report (Test) ===")
    print(report)

    print("\n=== Confusion Matrix (Test) ===")
    print(matrix)


def train_and_save_model(dataset_path: Path, model_path: Path, scaler_path: Path) -> None:
    """Train the XGBoost fraud model, evaluate it, and save artifacts."""
    dataset = load_dataset(dataset_path)
    x_train, x_test, y_train, y_test, scaler = split_and_scale_data(dataset)
    x_resampled, y_resampled = apply_smote_sampling(x_train, y_train)

    classifier = build_classifier()
    classifier.fit(x_resampled, y_resampled)

    train_pred = classifier.predict(x_resampled)
    train_prob = classifier.predict_proba(x_resampled)[:, 1]
    test_pred = classifier.predict(x_test)
    test_prob = classifier.predict_proba(x_test)[:, 1]

    train_metrics = evaluate_predictions(y_resampled, train_pred, train_prob)
    test_metrics = evaluate_predictions(y_test, test_pred, test_prob)
    report = classification_report(y_test, test_pred, zero_division=0)
    matrix = confusion_matrix(y_test, test_pred)

    model_path.parent.mkdir(parents=True, exist_ok=True)
    scaler_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(classifier, model_path)
    joblib.dump(scaler, scaler_path)

    print_training_summary(train_metrics, test_metrics, report, matrix)
    print(f"\nSaved model to: {model_path}")
    print(f"Saved scaler to: {scaler_path}")


def parse_arguments() -> argparse.Namespace:
    """Parse command-line arguments for the training script."""
    project_root = Path(__file__).resolve().parent.parent
    default_dataset = project_root / "creditcard.csv"
    default_model = Path(__file__).resolve().parent / "fraud_model.pkl"
    default_scaler = Path(__file__).resolve().parent / "scaler.pkl"

    parser = argparse.ArgumentParser(description="Train FinSentinel fraud detection model.")
    parser.add_argument("--dataset", type=Path, default=default_dataset, help="Path to creditcard.csv")
    parser.add_argument("--model-output", type=Path, default=default_model, help="Path to save fraud_model.pkl")
    parser.add_argument("--scaler-output", type=Path, default=default_scaler, help="Path to save scaler.pkl")
    return parser.parse_args()


def main() -> None:
    """Run the model training workflow from command line."""
    args = parse_arguments()
    train_and_save_model(args.dataset, args.model_output, args.scaler_output)


if __name__ == "__main__":
    main()
