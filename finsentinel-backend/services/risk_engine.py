"""ML-backed risk scoring engine for FinSentinel."""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional, Tuple

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def safe_float(value: Any, default: float = 0.0) -> float:
    """Safely cast any value to float with a default fallback."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def load_model_artifacts(model_path: str, scaler_path: str) -> Tuple[Optional[Any], Optional[Any]]:
    """Load serialized model and scaler artifacts from disk."""
    try:
        if not os.path.exists(model_path) or not os.path.exists(scaler_path):
            logger.warning(
                "Model artifacts not found. model_path=%s scaler_path=%s",
                model_path,
                scaler_path,
            )
            return None, None

        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        logger.info("Model artifacts loaded successfully.")
        return model, scaler
    except Exception:
        logger.exception("Failed to load model artifacts.")
        return None, None


def preprocess_transaction_features(data: Dict[str, Any], scaler: Optional[Any]) -> Tuple[np.ndarray, bool]:
    """Convert incoming transaction payload into model-ready feature vector."""
    raw_v_features = data.get("v_features")
    has_v_features = (
        isinstance(raw_v_features, list)
        and len(raw_v_features) == 28
        and all(isinstance(value, (int, float)) for value in raw_v_features)
    )

    v_features = np.array(raw_v_features, dtype=float) if has_v_features else np.zeros(28, dtype=float)

    time_value = safe_float(data.get("time"), safe_float(data.get("hour_of_day"), 0.0) * 3600.0)
    amount_value = safe_float(data.get("amount"), 0.0)

    scaled_time = time_value
    scaled_amount = amount_value

    if scaler is not None:
        try:
            scale_input = pd.DataFrame([[time_value, amount_value]], columns=["Time", "Amount"])
            scaled_values = scaler.transform(scale_input)
            scaled_time = float(scaled_values[0][0])
            scaled_amount = float(scaled_values[0][1])
        except Exception:
            logger.exception("Failed to scale Time/Amount. Using raw values.")

    feature_vector = np.concatenate(([scaled_time], v_features, [scaled_amount]))
    return feature_vector.reshape(1, -1), has_v_features


def predict_probability(model: Optional[Any], feature_vector: np.ndarray) -> Optional[float]:
    """Predict fraud probability using the trained ML model."""
    if model is None:
        return None

    try:
        if hasattr(model, "predict_proba"):
            probability = float(model.predict_proba(feature_vector)[0][1])
        else:
            probability = float(model.predict(feature_vector)[0])
        return min(max(probability, 0.0), 1.0)
    except Exception:
        logger.exception("Failed to run model prediction.")
        return None


def heuristic_probability(data: Dict[str, Any]) -> float:
    """Estimate fallback fraud probability when model signal is insufficient."""
    probability = 0.05
    amount = safe_float(data.get("amount"), 0.0)
    user_avg_amount = safe_float(data.get("user_avg_amount"), 0.0)
    hour_of_day = int(safe_float(data.get("hour_of_day"), 12))
    currency = str(data.get("currency", "")).strip().upper()

    if user_avg_amount > 0 and amount > user_avg_amount * 10:
        probability += 0.50
    elif user_avg_amount > 0 and amount > user_avg_amount * 5:
        probability += 0.25

    if amount > 50000:
        probability += 0.20

    if 0 <= hour_of_day <= 5:
        probability += 0.10

    if str(data.get("device_id", "")).strip() and str(data.get("usual_device", "")).strip():
        if str(data.get("device_id", "")).strip() != str(data.get("usual_device", "")).strip():
            probability += 0.08

    if str(data.get("location", "")).strip() and str(data.get("usual_location", "")).strip():
        if str(data.get("location", "")).strip().lower() != str(data.get("usual_location", "")).strip().lower():
            probability += 0.07

    if currency and currency not in {"INR", "USD"}:
        probability += 0.05

    return min(max(probability, 0.0), 0.99)


def calculate_risk_score(
    data: Dict[str, Any],
    model: Optional[Any] = None,
    scaler: Optional[Any] = None,
) -> Dict[str, float]:
    """Calculate ML risk score and confidence for a transaction payload."""
    if model is None or scaler is None:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        default_model_path = os.getenv("MODEL_PATH", os.path.join(project_root, "model", "fraud_model.pkl"))
        default_scaler_path = os.getenv("SCALER_PATH", os.path.join(project_root, "model", "scaler.pkl"))
        loaded_model, loaded_scaler = load_model_artifacts(default_model_path, default_scaler_path)
        model = model or loaded_model
        scaler = scaler or loaded_scaler

    feature_vector, has_v_features = preprocess_transaction_features(data, scaler)
    model_probability = predict_probability(model, feature_vector)
    fallback_probability = heuristic_probability(data)

    if model_probability is None:
        fraud_probability = fallback_probability
    elif has_v_features:
        fraud_probability = model_probability
    else:
        fraud_probability = max(model_probability, fallback_probability)

    fraud_probability = min(max(fraud_probability, 0.0), 1.0)
    ml_score = round(fraud_probability * 100, 2)
    model_confidence = round(max(fraud_probability, 1.0 - fraud_probability), 4)

    return {
        "ml_score": ml_score,
        "model_confidence": model_confidence,
    }
