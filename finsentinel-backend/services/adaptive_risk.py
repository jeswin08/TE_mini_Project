"""Adaptive risk thresholding based on behavioral trust and merchant risk."""

from __future__ import annotations

from typing import Dict


def clamp(value: float, lower: float, upper: float) -> float:
    """Clamp a floating value to an inclusive range."""
    return max(lower, min(value, upper))


def compute_adaptive_thresholds(user_trust_score: float, merchant_risk_score: float) -> Dict[str, float]:
    """Compute adaptive safe/suspicious/fraud thresholds for a transaction."""
    trust = clamp(float(user_trust_score), 0.0, 1.0)
    merchant_risk = clamp(float(merchant_risk_score), 0.0, 1.0)

    safe_threshold = 35.0 + (trust * 8.0) - (merchant_risk * 10.0)
    fraud_threshold = 70.0 + (trust * 5.0) - (merchant_risk * 12.0)

    safe_threshold = clamp(safe_threshold, 20.0, 45.0)
    fraud_threshold = clamp(fraud_threshold, safe_threshold + 15.0, 85.0)

    return {
        "safe_threshold": round(safe_threshold, 2),
        "fraud_threshold": round(fraud_threshold, 2),
    }


def classify_adaptive_risk(score: float, user_trust_score: float, merchant_risk_score: float) -> str:
    """Classify a risk score into Safe/Suspicious/Fraud using adaptive thresholds."""
    thresholds = compute_adaptive_thresholds(user_trust_score, merchant_risk_score)

    if score < thresholds["safe_threshold"]:
        return "Safe"
    if score < thresholds["fraud_threshold"]:
        return "Suspicious"
    return "Fraud"
