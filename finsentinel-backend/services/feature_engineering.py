"""Feature engineering utilities for behavioral fraud signals."""

from __future__ import annotations

from typing import Any, Dict, Iterable, Set


def _safe_float(value: Any, default: float = 0.0) -> float:
    """Safely cast a value to float with fallback default."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalize_string_set(values: Iterable[Any]) -> Set[str]:
    """Normalize arbitrary values into a lowercase non-empty string set."""
    normalized: Set[str] = set()
    for item in values:
        text = str(item).strip().lower()
        if text:
            normalized.add(text)
    return normalized


def generate_features(transaction_data: Dict[str, Any], user_history: Dict[str, Any]) -> Dict[str, Any]:
    """Generate behavioral fraud detection features from transaction context and user history."""
    try:
        amount = _safe_float(transaction_data.get("amount"), 0.0)
        avg_amount = _safe_float(
            user_history.get("avg_transaction_amount", transaction_data.get("user_avg_amount")),
            0.0,
        )

        location = str(transaction_data.get("location", "")).strip().lower()
        usual_location = str(
            user_history.get("usual_location", transaction_data.get("usual_location", ""))
        ).strip().lower()

        device_id = str(transaction_data.get("device_id", "")).strip().lower()
        usual_device = str(transaction_data.get("usual_device", "")).strip().lower()
        known_devices = _normalize_string_set(user_history.get("known_devices", []))

        merchant = str(transaction_data.get("merchant", "")).strip().lower()
        known_merchants = _normalize_string_set(user_history.get("known_merchants", []))

        transaction_velocity = int(_safe_float(user_history.get("recent_txn_count_5m"), 0))
        if transaction_velocity < 0:
            transaction_velocity = 0

        amount_deviation = round(amount - avg_amount, 2)
        location_change = int(bool(location and usual_location and location != usual_location))

        is_known_device = False
        if device_id:
            is_known_device = device_id in known_devices or (usual_device and device_id == usual_device)

        merchant_risk_score = 0.2 if merchant and merchant in known_merchants else 0.7

        return {
            "transaction_velocity": transaction_velocity,
            "avg_transaction_amount": round(avg_amount, 2),
            "amount_deviation": amount_deviation,
            "location_change": location_change,
            "device_trust_score": 1 if is_known_device else 0,
            "merchant_risk_score": round(merchant_risk_score, 2),
        }
    except Exception:
        # Safe fallback to keep the analysis pipeline resilient.
        return {
            "transaction_velocity": 0,
            "avg_transaction_amount": 0.0,
            "amount_deviation": 0.0,
            "location_change": 0,
            "device_trust_score": 0,
            "merchant_risk_score": 0.5,
        }
