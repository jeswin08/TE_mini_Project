"""Rule-based fraud detection checks for FinSentinel."""

from __future__ import annotations

from typing import Any, Dict, List, Tuple

SUPPORTED_CURRENCIES = {"INR", "USD"}


def safe_float(value: Any, default: float = 0.0) -> float:
    """Safely cast any value to float with a default fallback."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def apply_rules(transaction_data: Dict[str, Any]) -> Tuple[float, List[str]]:
    """Apply deterministic fraud rules and return score plus triggered rule names."""
    rule_score = 0.0
    flagged_rules: List[str] = []

    amount = safe_float(transaction_data.get("amount"), 0.0)
    user_avg_amount = safe_float(transaction_data.get("user_avg_amount"), 0.0)
    currency = str(transaction_data.get("currency", "")).strip().upper()
    device_id = str(transaction_data.get("device_id", "")).strip()
    usual_device = str(transaction_data.get("usual_device", "")).strip()
    location = str(transaction_data.get("location", "")).strip().lower()
    usual_location = str(transaction_data.get("usual_location", "")).strip().lower()
    hour_of_day = int(safe_float(transaction_data.get("hour_of_day"), 0))
    recent_txn_count = int(safe_float(transaction_data.get("recent_txn_count_5m"), 0))
    velocity_flag = bool(transaction_data.get("velocity_flag", False) or recent_txn_count >= 3)

    if user_avg_amount > 0 and amount > (user_avg_amount * 10):
        rule_score += 40
        flagged_rules.append("amount_anomaly")

    if currency == "INR" and amount > 50000:
        rule_score += 20
        flagged_rules.append("high_amount")

    if usual_device and device_id and device_id != usual_device:
        rule_score += 25
        flagged_rules.append("new_device")

    if usual_location and location and location != usual_location:
        rule_score += 20
        flagged_rules.append("unusual_location")

    if 0 <= hour_of_day <= 5:
        rule_score += 15
        flagged_rules.append("odd_hour")

    if velocity_flag:
        rule_score += 30
        flagged_rules.append("velocity_check")

    if currency and currency not in SUPPORTED_CURRENCIES:
        rule_score += 10
        flagged_rules.append("foreign_currency")

    return round(min(rule_score, 100.0), 2), flagged_rules


def build_explanation(
    decision: str,
    flagged_rules: List[str],
    amount: float,
    user_avg_amount: float,
    location: str,
    usual_location: str,
) -> str:
    """Build a human-readable explanation from triggered rules and decision."""
    decision_prefix = {
        "Approved": "Transaction approved",
        "OTP Required": "OTP verification required",
        "Blocked": "Transaction blocked",
    }.get(decision, "Transaction reviewed")

    if not flagged_rules:
        return f"{decision_prefix}: no significant risk indicators detected."

    reasons: List[str] = []

    if "amount_anomaly" in flagged_rules and user_avg_amount > 0:
        ratio = amount / user_avg_amount
        reasons.append(f"amount {ratio:.1f}x above average")
    elif "high_amount" in flagged_rules:
        reasons.append("high transaction amount")

    if "new_device" in flagged_rules:
        reasons.append("new device")

    if "unusual_location" in flagged_rules:
        reasons.append(f"location differs from usual city ({usual_location or 'unknown'} → {location or 'unknown'})")

    if "odd_hour" in flagged_rules:
        reasons.append("odd transaction hour")

    if "velocity_check" in flagged_rules:
        reasons.append("multiple transactions in short time")

    if "foreign_currency" in flagged_rules:
        reasons.append("unusual currency usage")

    if not reasons:
        reasons.append("rule-based risk indicators")

    return f"{decision_prefix}: {', '.join(reasons)}."
