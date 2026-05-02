"""Unit tests for deterministic fraud rule engine."""

from __future__ import annotations

from services.rule_engine import apply_rules


def test_rule_engine_flags_high_risk_patterns():
    """Rule engine should flag anomalous transaction characteristics."""
    payload = {
        "amount": 60000,
        "user_avg_amount": 3000,
        "currency": "INR",
        "device_id": "new-device",
        "usual_device": "old-device",
        "location": "Mumbai",
        "usual_location": "Kochi",
        "hour_of_day": 1,
        "recent_txn_count_5m": 4,
    }

    score, rules = apply_rules(payload)

    assert score > 0
    assert "amount_anomaly" in rules
    assert "new_device" in rules
    assert "velocity_check" in rules


def test_rule_engine_returns_zero_for_low_risk_payload():
    """Rule engine should not flag a normal transaction profile."""
    payload = {
        "amount": 1000,
        "user_avg_amount": 2000,
        "currency": "INR",
        "device_id": "trusted",
        "usual_device": "trusted",
        "location": "Kochi",
        "usual_location": "Kochi",
        "hour_of_day": 14,
        "recent_txn_count_5m": 0,
    }

    score, rules = apply_rules(payload)

    assert score == 0
    assert rules == []
