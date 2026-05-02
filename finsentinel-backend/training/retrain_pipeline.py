"""Periodic model retraining pipeline for FinSentinel."""

from __future__ import annotations

import logging
import os
import time
from typing import Tuple

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from app import create_app
from database.models import Transaction

logger = logging.getLogger(__name__)


class RetrainPipeline:
    """Load fresh transaction data, retrain model, and persist updated artifacts."""

    def __init__(self, model_path: str, scaler_path: str) -> None:
        self.model_path = model_path
        self.scaler_path = scaler_path

    def run_once(self) -> bool:
        """Execute one retraining cycle and persist model/scaler artifacts."""
        try:
            features, labels = self._load_training_data()
            if features.empty or labels.empty:
                logger.warning("No transaction records available for retraining.")
                return False

            x_train, _, y_train, _ = train_test_split(
                features,
                labels,
                test_size=0.2,
                random_state=42,
                stratify=labels if labels.nunique() > 1 else None,
            )

            scaler = StandardScaler()
            x_train_scaled = scaler.fit_transform(x_train)

            model = XGBClassifier(
                n_estimators=150,
                learning_rate=0.08,
                max_depth=5,
                subsample=0.9,
                colsample_bytree=0.9,
                eval_metric="logloss",
                random_state=42,
            )
            model.fit(x_train_scaled, y_train)

            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            os.makedirs(os.path.dirname(self.scaler_path), exist_ok=True)
            joblib.dump(model, self.model_path)
            joblib.dump(scaler, self.scaler_path)

            logger.info("Retraining complete. Saved model=%s scaler=%s", self.model_path, self.scaler_path)
            return True
        except Exception:
            logger.exception("Retraining pipeline failed.")
            return False

    def _load_training_data(self) -> Tuple[pd.DataFrame, pd.Series]:
        """Build training matrix from stored transaction outcomes."""
        records = Transaction.query.order_by(Transaction.timestamp.desc()).limit(50000).all()

        rows = []
        labels = []

        for txn in records:
            rows.append(
                {
                    "amount": float(txn.amount),
                    "hour_of_day": int(txn.timestamp.hour if txn.timestamp else 12),
                    "ml_score": float(txn.ml_score),
                    "rule_score": float(txn.rule_score),
                    "processing_time_ms": float(txn.processing_time_ms),
                }
            )
            labels.append(int(bool(txn.is_fraud)))

        return pd.DataFrame(rows), pd.Series(labels)


def run_retraining_loop() -> None:
    """Run periodic retraining forever with configured interval and app context."""
    app = create_app()
    with app.app_context():
        pipeline = RetrainPipeline(
            model_path=app.config["MODEL_PATH"],
            scaler_path=app.config["SCALER_PATH"],
        )
        interval_seconds = int(app.config.get("MODEL_RETRAIN_INTERVAL_SECONDS", 3600))

        while True:
            pipeline.run_once()
            time.sleep(max(interval_seconds, 60))


if __name__ == "__main__":
    run_retraining_loop()
