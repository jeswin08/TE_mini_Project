"""Shared transaction fraud analysis pipeline used by API and streaming workers."""

from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List

from flask import current_app

from database.db import db
from database.models import Transaction, to_utc_iso
from services.adaptive_risk import classify_adaptive_risk
from services.alerts import send_fraud_alert
from services.explainability import explain_prediction
from services.feature_engineering import generate_features
from services.feature_store import feature_store
from services.graph_analysis import detect_suspicious_connections, extract_recent_relationships
from services.hybrid_model import hybrid_score
from services.risk_engine import calculate_risk_score, preprocess_transaction_features
from services.rule_engine import apply_rules, build_explanation
from utils.metrics import record_runtime_metrics

logger = logging.getLogger(__name__)


def _map_decision(risk_level: str) -> str:
    """Map risk level labels to transaction decisions."""
    return {
        "Safe": "Approved",
        "Suspicious": "OTP Required",
        "Fraud": "Blocked",
    }.get(risk_level, "OTP Required")


def fetch_recent_transaction_count(user_id: str, minutes: int = 5) -> int:
    """Count user transactions in the rolling minutes window."""
    window_start = datetime.utcnow() - timedelta(minutes=minutes)
    return (
        Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.timestamp >= window_start,
        ).count()
    )


def process_transaction_data(data: Dict[str, Any], source: str = "api") -> Dict[str, Any]:
    """Run the full fraud pipeline for a normalized transaction payload."""
    start_time = time.perf_counter()

    recent_txn_count = fetch_recent_transaction_count(data["user_id"], minutes=5)
    user_features = feature_store.get_user_features(data["user_id"])

    trusted_devices = user_features.get("trusted_devices", [])
    location_history = user_features.get("location_history", [])
    usual_location = data.get("usual_location") or (location_history[0] if location_history else "")

    user_history = {
        "recent_txn_count_5m": recent_txn_count,
        "avg_transaction_amount": user_features.get("avg_transaction_amount", data.get("user_avg_amount", 0.0)),
        "usual_location": usual_location,
        "known_devices": list(trusted_devices) + [data.get("usual_device")],
        "known_merchants": user_features.get("known_merchants", []),
    }

    engineered_features = generate_features(data, user_history)
    data.update(engineered_features)
    data["recent_txn_count_5m"] = engineered_features.get("transaction_velocity", recent_txn_count)
    data["velocity_flag"] = data["recent_txn_count_5m"] >= 3

    risk_output = calculate_risk_score(
        data,
        model=current_app.config.get("ML_MODEL"),
        scaler=current_app.config.get("ML_SCALER"),
    )
    ml_score = risk_output["ml_score"]
    model_confidence = risk_output["model_confidence"]

    rule_score, flagged_rules = apply_rules(data)

    relationship_data = extract_recent_relationships(data["user_id"])
    graph_output = detect_suspicious_connections(data, relationship_data)
    graph_risk_score = float(graph_output.get("graph_risk_score", 0.0))
    if graph_output.get("suspicious_links"):
        flagged_rules.extend([f"graph:{item}" for item in graph_output["suspicious_links"]])

    adjusted_rule_score = round(min(rule_score + graph_risk_score, 100.0), 2)
    final_score = hybrid_score(ml_score, adjusted_rule_score)

    user_trust_score = 1.0 if engineered_features.get("device_trust_score", 0) == 1 else 0.4
    merchant_risk = float(engineered_features.get("merchant_risk_score", 0.5))
    risk_level = classify_adaptive_risk(final_score, user_trust_score=user_trust_score, merchant_risk_score=merchant_risk)
    decision = _map_decision(risk_level)

    processing_time_ms = int((time.perf_counter() - start_time) * 1000)
    timestamp = datetime.utcnow()

    explanation = build_explanation(
        decision=decision,
        flagged_rules=flagged_rules,
        amount=float(data["amount"]),
        user_avg_amount=float(data["user_avg_amount"]),
        location=str(data["location"]),
        usual_location=str(data.get("usual_location", "")),
    )

    model_input, _ = preprocess_transaction_features(data, current_app.config.get("ML_SCALER"))
    prediction_explanation = explain_prediction(
        model=current_app.config.get("ML_MODEL"),
        features={
            "model_input": model_input,
            "behavioral_features": engineered_features,
            "hour_of_day": data["hour_of_day"],
        },
    )

    transaction = Transaction(
        user_id=data["user_id"],
        amount=data["amount"],
        currency=data["currency"],
        merchant=data["merchant"],
        location=data["location"],
        device_id=data["device_id"],
        ip_address=data.get("ip_address"),
        ml_score=ml_score,
        rule_score=adjusted_rule_score,
        final_score=final_score,
        risk_level=risk_level,
        decision=decision,
        model_confidence=model_confidence,
        is_fraud=risk_level == "Fraud",
        flagged_rules=flagged_rules,
        timestamp=timestamp,
        processing_time_ms=processing_time_ms,
    )

    db.session.add(transaction)
    db.session.commit()

    feature_store.update_user_features(
        data["user_id"],
        {
            "amount": data["amount"],
            "device_id": data["device_id"],
            "location": data["location"],
            "merchant": data["merchant"],
        },
    )

    record_runtime_metrics(processing_time_ms=processing_time_ms, is_fraud=(risk_level == "Fraud"))

    send_fraud_alert(
        {
            "transaction_id": transaction.transaction_id,
            "user_id": transaction.user_id,
            "amount": transaction.amount,
            "risk_score": final_score,
        }
    )

    logger.info(
        "[FraudEngine] TXN_ID=%s RISK_SCORE=%.2f DECISION=%s RULES=%s SOURCE=%s",
        transaction.transaction_id,
        final_score,
        decision,
        flagged_rules,
        source,
    )

    return {
        "transaction_id": transaction.transaction_id,
        "risk_score": final_score,
        "risk_level": risk_level,
        "decision": decision,
        "ml_score": ml_score,
        "rule_score": adjusted_rule_score,
        "model_confidence": model_confidence,
        "flagged_rules": flagged_rules,
        "engineered_features": engineered_features,
        "graph_analysis": graph_output,
        "explanation": explanation,
        "model_explanation": prediction_explanation,
        "processing_time_ms": processing_time_ms,
        "timestamp": to_utc_iso(timestamp),
    }
