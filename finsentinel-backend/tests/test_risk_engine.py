"""Unit tests for ML and heuristic risk engine behavior."""

from __future__ import annotations

from services.risk_engine import calculate_risk_score


def test_calculate_risk_score_with_heuristic_fallback():
    """Risk score should be computed even when model artifacts are unavailable."""
    payload = {
        "amount": 120000,
        "user_avg_amount": 2000,
        "hour_of_day": 2,
        "currency": "INR",
        "device_id": "new-dev",
        "usual_device": "known-dev",
        "location": "Delhi",
        "usual_location": "Bengaluru",
    }

    result = calculate_risk_score(payload, model=None, scaler=None)

    assert "ml_score" in result
    assert "model_confidence" in result
    assert 0 <= result["ml_score"] <= 100
    assert 0 <= result["model_confidence"] <= 1


def test_calculate_risk_score_with_empty_payload():
    """Risk engine should return bounded outputs for sparse payloads."""
    result = calculate_risk_score({}, model=None, scaler=None)
    assert 0 <= result["ml_score"] <= 100
    assert 0 <= result["model_confidence"] <= 1
