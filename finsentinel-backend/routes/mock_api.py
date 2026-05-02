"""Mock API routes used by the frontend when no external data store is connected."""

from __future__ import annotations

from collections import Counter
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from flask import Blueprint, jsonify, request

mock_api_bp = Blueprint("mock_api", __name__)

SERVER_START = datetime.now(timezone.utc)


FRAUD_RULES = [
    "Unusual location detected",
    "Amount exceeds user average by 500%",
    "New device detected",
    "Transaction velocity exceeded",
    "High-risk merchant category",
    "Cross-border transaction",
    "Night-time transaction",
    "Multiple failed attempts",
    "IP geolocation mismatch",
    "Card not present fraud pattern",
]


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


TRANSACTIONS: List[Dict[str, Any]] = [
    {
        "transaction_id": "TXN001",
        "user_id": "USR123",
        "amount": 5000,
        "currency": "USD",
        "merchant": "Amazon",
        "location": "New York, US",
        "device_id": "DEV123",
        "risk_score": 20,
        "risk_level": "Safe",
        "decision": "Approved",
        "flagged_rules": [],
        "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=2)).isoformat(),
        "explanation": "Transaction appears legitimate.",
    },
    {
        "transaction_id": "TXN002",
        "user_id": "USR456",
        "amount": 12000,
        "currency": "USD",
        "merchant": "Wire Transfer",
        "location": "Unknown Location",
        "device_id": "DEV999",
        "risk_score": 82,
        "risk_level": "Fraud",
        "decision": "Blocked",
        "flagged_rules": ["High-risk merchant category", "Unusual location detected"],
        "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=8)).isoformat(),
        "explanation": "Transaction blocked due to high fraud indicators.",
    },
    {
        "transaction_id": "TXN003",
        "user_id": "USR777",
        "amount": 950,
        "currency": "USD",
        "merchant": "Target",
        "location": "Chicago, US",
        "device_id": "DEV777",
        "risk_score": 56,
        "risk_level": "Suspicious",
        "decision": "OTP Required",
        "flagged_rules": ["New device detected"],
        "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat(),
        "explanation": "Additional verification required.",
    },
]

ALERTS: List[Dict[str, Any]] = [
    {
        "id": "ALT001",
        "transaction_id": "TXN002",
        "user_id": "USR456",
        "amount": 12000,
        "risk_score": 82,
        "flagged_rules": ["High-risk merchant category", "Unusual location detected"],
        "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=8)).isoformat(),
        "status": "active",
    }
]


def _compute_decision(score: float) -> tuple[str, str]:
    if score >= 80:
        return "Fraud", "Blocked"
    if score >= 50:
        return "Suspicious", "OTP Required"
    return "Safe", "Approved"


def _compute_analysis(payload: Dict[str, Any]) -> Dict[str, Any]:
    amount = float(payload.get("amount", 0) or 0)
    user_avg_amount = float(payload.get("user_avg_amount", 0) or 0)
    hour_of_day = int(payload.get("hour_of_day", 0) or 0)

    risk_score = 10.0
    flagged_rules: List[str] = []

    if payload.get("location") and payload.get("usual_location") and payload.get("location") != payload.get("usual_location"):
        risk_score += 25
        flagged_rules.append("Unusual location detected")

    if payload.get("device_id") and payload.get("usual_device") and payload.get("device_id") != payload.get("usual_device"):
        risk_score += 20
        flagged_rules.append("New device detected")

    if user_avg_amount > 0 and amount > (user_avg_amount * 3):
        risk_score += 30
        flagged_rules.append("Amount exceeds user average by 500%")

    if 1 <= hour_of_day <= 5:
        risk_score += 15
        flagged_rules.append("Night-time transaction")

    if str(payload.get("merchant", "")).strip() in {"Unknown Merchant", "Wire Transfer", "Foreign ATM"}:
        risk_score += 20
        flagged_rules.append("High-risk merchant category")

    risk_score = min(100.0, risk_score)
    risk_level, decision = _compute_decision(risk_score)

    explanation = (
        f"Transaction flagged due to: {', '.join(flagged_rules)}."
        if flagged_rules
        else "Transaction appears legitimate with no anomalies detected."
    )

    return {
        "risk_score": round(risk_score, 1),
        "risk_level": risk_level,
        "decision": decision,
        "flagged_rules": flagged_rules,
        "explanation": explanation,
    }


def _build_analytics() -> Dict[str, Any]:
    total_transactions = len(TRANSACTIONS)
    fraud_detected = len([t for t in TRANSACTIONS if t["risk_level"] == "Fraud"])
    blocked_transactions = len([t for t in TRANSACTIONS if t["decision"] == "Blocked"])

    safe = len([t for t in TRANSACTIONS if t["risk_level"] == "Safe"])
    suspicious = len([t for t in TRANSACTIONS if t["risk_level"] == "Suspicious"])
    fraud = len([t for t in TRANSACTIONS if t["risk_level"] == "Fraud"])

    fraud_rate = round((fraud_detected / total_transactions) * 100, 2) if total_transactions else 0.0
    total_amount_protected = round(sum(float(t["amount"]) for t in TRANSACTIONS if t["decision"] == "Blocked"), 2)

    hourly_counts = Counter()
    for tx in TRANSACTIONS:
        try:
            hour = datetime.fromisoformat(tx["timestamp"]).hour
            if tx["risk_level"] == "Fraud":
                hourly_counts[hour] += 1
        except (ValueError, TypeError, KeyError):
            continue

    fraud_by_hour = [{"hour": hour, "count": hourly_counts.get(hour, 0)} for hour in range(24)]

    top_rules = Counter()
    for tx in TRANSACTIONS:
        top_rules.update(tx.get("flagged_rules", []))

    top_flagged_rules = [
        {"rule": rule, "count": count}
        for rule, count in top_rules.most_common(8)
    ]

    today = datetime.now(timezone.utc).date()
    fraud_trend = []
    for index in range(29, -1, -1):
        day = today - timedelta(days=index)
        count = sum(
            1
            for tx in TRANSACTIONS
            if tx.get("risk_level") == "Fraud"
            and datetime.fromisoformat(tx["timestamp"]).date() == day
        )
        fraud_trend.append({"date": day.isoformat(), "fraud_count": count})

    return {
        "dashboard_stats": {
            "total_transactions": total_transactions,
            "fraud_detected": fraud_detected,
            "fraud_rate": fraud_rate,
            "total_amount_protected": total_amount_protected,
            "blocked_transactions": blocked_transactions,
        },
        "risk_distribution": {
            "safe": safe,
            "suspicious": suspicious,
            "fraud": fraud,
        },
        "fraud_by_hour": fraud_by_hour,
        "top_flagged_rules": top_flagged_rules,
        "fraud_trend": fraud_trend,
    }


def _build_alert_stats() -> Dict[str, int]:
    active_alerts = len([alert for alert in ALERTS if alert["status"] == "active"])
    blocked_today = len(
        [
            tx
            for tx in TRANSACTIONS
            if tx["decision"] == "Blocked"
            and datetime.fromisoformat(tx["timestamp"]).date() == datetime.now(timezone.utc).date()
        ]
    )
    investigations_pending = len(
        [alert for alert in ALERTS if alert["status"] in {"active", "escalated"}]
    )
    return {
        "active_alerts": active_alerts,
        "blocked_today": blocked_today,
        "investigations_pending": investigations_pending,
    }


@mock_api_bp.get("/transactions")
def get_transactions():
    risk_filter = request.args.get("risk_level")
    search = request.args.get("search", "").strip().lower()
    limit = request.args.get("limit", type=int)
    page = request.args.get("page", type=int)
    page_size = request.args.get("pageSize", type=int)

    filtered = deepcopy(TRANSACTIONS)

    if risk_filter:
        filtered = [tx for tx in filtered if tx["risk_level"] == risk_filter]

    if search:
        filtered = [
            tx
            for tx in filtered
            if search in tx["transaction_id"].lower()
            or search in tx["user_id"].lower()
            or search in tx["merchant"].lower()
        ]

    filtered.sort(key=lambda tx: tx.get("timestamp", ""), reverse=True)

    if page and page_size:
        safe_page = max(1, page)
        safe_page_size = max(1, page_size)
        start = (safe_page - 1) * safe_page_size
        end = start + safe_page_size
        return jsonify({"transactions": filtered[start:end], "total": len(filtered)})

    if limit:
        filtered = filtered[: max(1, limit)]

    return jsonify(filtered)


@mock_api_bp.post("/analyze")
def analyze_transaction():
    payload = request.get_json(silent=True) or {}
    analysis = _compute_analysis(payload)

    new_transaction_id = f"TXN{len(TRANSACTIONS) + 1:03d}"
    new_transaction = {
        "transaction_id": new_transaction_id,
        "user_id": str(payload.get("user_id") or "USR000"),
        "amount": float(payload.get("amount") or 0),
        "currency": str(payload.get("currency") or "USD"),
        "merchant": str(payload.get("merchant") or "Unknown Merchant"),
        "location": str(payload.get("location") or "Unknown"),
        "device_id": str(payload.get("device_id") or "Unknown"),
        "risk_score": analysis["risk_score"],
        "risk_level": analysis["risk_level"],
        "decision": analysis["decision"],
        "flagged_rules": analysis["flagged_rules"],
        "timestamp": _utc_now_iso(),
        "explanation": analysis["explanation"],
    }
    TRANSACTIONS.insert(0, new_transaction)

    if analysis["risk_score"] >= 80:
        ALERTS.insert(
            0,
            {
                "id": f"ALT{len(ALERTS) + 1:03d}",
                "transaction_id": new_transaction_id,
                "user_id": new_transaction["user_id"],
                "amount": new_transaction["amount"],
                "risk_score": new_transaction["risk_score"],
                "flagged_rules": new_transaction["flagged_rules"],
                "timestamp": new_transaction["timestamp"],
                "status": "active",
            },
        )

    return jsonify(analysis)


@mock_api_bp.get("/analytics")
def get_analytics():
    return jsonify(_build_analytics())


@mock_api_bp.get("/alerts")
def get_alerts():
    return jsonify(deepcopy(ALERTS))


@mock_api_bp.get("/alerts/stats")
def get_alert_stats():
    return jsonify(_build_alert_stats())


@mock_api_bp.patch("/alerts/<string:alert_id>")
def update_alert_status(alert_id: str):
    payload = request.get_json(silent=True) or {}
    next_status = payload.get("status")
    if next_status not in {"reviewed", "escalated", "dismissed", "active"}:
        return jsonify({"error": "Invalid status"}), 400

    for alert in ALERTS:
        if alert["id"] == alert_id:
            alert["status"] = next_status
            return jsonify(alert)

    return jsonify({"error": "Alert not found"}), 404


@mock_api_bp.get("/system")
def get_system_status():
    uptime_seconds = (datetime.now(timezone.utc) - SERVER_START).total_seconds()
    analytics = _build_analytics()
    total_transactions = analytics["dashboard_stats"]["total_transactions"]

    return jsonify(
        {
            "uptime": "99.97%",
            "transactions_processed": total_transactions,
            "avg_processing_time": 24.3,
            "fraud_detection_rate": 98.9,
            "api_status": "operational",
            "model_status": "operational",
            "database_status": "operational",
            "uptime_seconds": int(uptime_seconds),
        }
    )
