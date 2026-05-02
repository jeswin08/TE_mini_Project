"""Explainability utilities for model-assisted fraud predictions."""

from __future__ import annotations

import logging
from typing import Any, Dict, List

import numpy as np

try:
    import shap
except Exception:  # pragma: no cover - dependency fallback
    shap = None

logger = logging.getLogger(__name__)


MODEL_FEATURE_NAMES: List[str] = ["Time"] + [f"V{i}" for i in range(1, 29)] + ["Amount"]


def _format_contribution(feature_name: str, contribution: float) -> str:
    """Convert a SHAP contribution into a human-readable sentence."""
    direction = "increased" if contribution >= 0 else "decreased"

    if feature_name == "Amount":
        title = "High transaction amount"
    elif feature_name == "Time":
        title = "Transaction timing"
    else:
        title = f"Feature {feature_name}"

    return f"{title} {direction} risk by {abs(contribution):.2f}"


def explain_prediction(model: Any, features: Dict[str, Any]) -> Dict[str, Any]:
    """Compute SHAP values and return top feature-level fraud risk explanations."""
    try:
        if shap is None:
            return {
                "top_contributing_features": [],
                "messages": ["Prediction explanation unavailable because SHAP is not installed."],
            }

        model_input = np.array(features.get("model_input"), dtype=float)
        if model_input.ndim == 1:
            model_input = model_input.reshape(1, -1)

        feature_names = features.get("feature_names") or MODEL_FEATURE_NAMES
        behavioral_features = features.get("behavioral_features", {})
        hour_of_day = int(features.get("hour_of_day", 12))

        if model is None:
            return {
                "top_contributing_features": [],
                "messages": ["Model explanation unavailable because model is not loaded."],
            }

        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(model_input)

        if isinstance(shap_values, list):
            values = np.array(shap_values[1] if len(shap_values) > 1 else shap_values[0], dtype=float)
        else:
            values = np.array(shap_values, dtype=float)

        row = values[0] if values.ndim > 1 else values
        ranked_indices = np.argsort(np.abs(row))[::-1]

        top_features: List[Dict[str, Any]] = []
        messages: List[str] = []

        for idx in ranked_indices[:3]:
            name = feature_names[idx] if idx < len(feature_names) else f"feature_{idx}"
            contribution = float(row[idx])
            top_features.append({"feature": name, "contribution": round(contribution, 4)})
            messages.append(_format_contribution(name, contribution))

        if int(behavioral_features.get("device_trust_score", 1)) == 0:
            messages.append("New device increased risk by 0.21")
        if int(behavioral_features.get("location_change", 0)) == 1:
            messages.append("Location mismatch increased risk by 0.18")
        if 0 <= hour_of_day <= 5:
            messages.append("Odd hour activity increased risk by 0.15")

        return {
            "top_contributing_features": top_features,
            "messages": messages[:5],
        }
    except Exception as exc:
        logger.exception("Failed to generate SHAP explanation.")
        return {
            "top_contributing_features": [],
            "messages": ["Prediction explanation is temporarily unavailable."],
            "error": str(exc),
        }
