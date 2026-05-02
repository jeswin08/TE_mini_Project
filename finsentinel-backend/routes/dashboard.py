"""Dashboard and analytics API routes for FinSentinel."""

from __future__ import annotations

import json
import logging
from collections import Counter
from typing import Any, List

from flask import Blueprint, request
from sqlalchemy import func

from database.db import db
from database.models import Transaction, Alert
from utils.metrics import get_runtime_metrics
from utils.response import error_response, success_response

dashboard_bp = Blueprint("dashboard", __name__)
logger = logging.getLogger(__name__)


def parse_limit(default: int = 10, max_limit: int = 100) -> int:
    """Parse and validate a limit query parameter."""
    raw_limit = request.args.get("limit", default=str(default))
    try:
        limit = int(raw_limit)
    except (TypeError, ValueError) as exc:
        raise ValueError("limit must be an integer") from exc

    if limit <= 0:
        raise ValueError("limit must be greater than 0")

    return min(limit, max_limit)


def normalize_rule_list(value: Any) -> List[str]:
    """Normalize a flagged_rules value into a list of strings."""
    if value is None:
        return []

    if isinstance(value, list):
        return [str(item) for item in value if item]

    if isinstance(value, str):
        try:
            decoded = json.loads(value)
            if isinstance(decoded, list):
                return [str(item) for item in decoded if item]
        except json.JSONDecodeError:
            return []

    return []


@dashboard_bp.route("/stats", methods=["GET"])
def get_dashboard_stats():
    """Return aggregate fraud detection statistics for dashboard widgets."""
    try:
        # Overall stats
        total_transactions = Transaction.query.count()
        fraud_detected = Transaction.query.filter_by(risk_level="Fraud").count()
        blocked_transactions = Transaction.query.filter_by(decision="Blocked").count()
        avg_risk_score = db.session.query(func.coalesce(func.avg(Transaction.final_score), 0.0)).scalar() or 0.0
        total_amount_protected = db.session.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(Transaction.decision == "Blocked").scalar() or 0.0
        fraud_rate = round((fraud_detected / total_transactions) * 100, 2) if total_transactions else 0.0

        # Overall risk distribution
        overall_dist_rows = db.session.query(Transaction.risk_level, func.count(Transaction.id)).group_by(Transaction.risk_level).all()
        overall_distribution = {"Safe": 0, "Suspicious": 0, "Fraud": 0}
        for level, count in overall_dist_rows:
            if level in overall_distribution:
                overall_distribution[level] = int(count)

        # Alerted transactions risk distribution
        alerted_dist_rows = db.session.query(Transaction.risk_level, func.count(Transaction.id)).join(Alert, Alert.transaction_id == Transaction.transaction_id).group_by(Transaction.risk_level).all()
        alerted_distribution = {"Safe": 0, "Suspicious": 0, "Fraud": 0}
        for level, count in alerted_dist_rows:
            if level in alerted_distribution:
                alerted_distribution[level] = int(count)

        data = {
            "total_transactions": total_transactions,
            "fraud_detected": fraud_detected,
            "fraud_rate": fraud_rate,
            "blocked_transactions": blocked_transactions,
            "avg_risk_score": round(float(avg_risk_score), 2),
            "total_amount_protected": round(float(total_amount_protected), 2),
            "risk_distribution": overall_distribution,
            "alerted_risk_distribution": alerted_distribution,
        }
        return success_response(data)
    except Exception as exc:
        logger.exception("Error fetching dashboard stats.")
        return error_response("Failed to fetch dashboard stats", status_code=500, details=str(exc))


@dashboard_bp.route("/recent", methods=["GET"])
def get_recent_transactions():
    """Return the most recent transactions for dashboard tables."""
    try:
        limit = parse_limit(default=10, max_limit=100)

        recent_transactions = (
            Transaction.query.order_by(Transaction.timestamp.desc()).limit(limit).all()
        )

        data = [
            {
                "transaction_id": transaction.transaction_id,
                "user_id": transaction.user_id,
                "amount": transaction.amount,
                "currency": transaction.currency,
                "merchant": transaction.merchant,
                "risk_score": transaction.final_score,
                "risk_level": transaction.risk_level,
                "decision": transaction.decision,
                "timestamp": transaction.to_dict()["timestamp"],
            }
            for transaction in recent_transactions
        ]
        return success_response({"transactions": data, "limit": limit})
    except ValueError as exc:
        return error_response(str(exc), status_code=400)
    except Exception as exc:
        logger.exception("Error fetching recent transactions.")
        return error_response("Failed to fetch recent transactions", status_code=500, details=str(exc))


@dashboard_bp.route("/risk-distribution", methods=["GET"])
def get_risk_distribution():
    """Return distribution counts for Safe, Suspicious, and Fraud levels."""
    try:
        distribution = {"Safe": 0, "Suspicious": 0, "Fraud": 0}
        rows = (
            db.session.query(Transaction.risk_level, func.count(Transaction.id))
            .group_by(Transaction.risk_level)
            .all()
        )

        for level, count in rows:
            if level in distribution:
                distribution[level] = int(count)

        return success_response(distribution)
    except Exception as exc:
        logger.exception("Error fetching risk distribution.")
        return error_response("Failed to fetch risk distribution", status_code=500, details=str(exc))


@dashboard_bp.route("/hourly-fraud", methods=["GET"])
def get_hourly_fraud():
    """Return hourly fraud counts grouped by transaction timestamp hour."""
    try:
        rows = (
            db.session.query(
                func.strftime("%H", Transaction.timestamp).label("hour"),
                func.count(Transaction.id).label("fraud_count"),
            )
            .filter(Transaction.risk_level == "Fraud")
            .group_by("hour")
            .order_by("hour")
            .all()
        )

        hourly_counts = {int(hour): int(count) for hour, count in rows if hour is not None}
        data = [{"hour": hour, "fraud_count": hourly_counts.get(hour, 0)} for hour in range(24)]
        return success_response({"hourly_fraud": data})
    except Exception as exc:
        logger.exception("Error fetching hourly fraud stats.")
        return error_response("Failed to fetch hourly fraud stats", status_code=500, details=str(exc))


@dashboard_bp.route("/top-flagged-rules", methods=["GET"])
def get_top_flagged_rules():
    """Return most frequently triggered fraud rule names and counts."""
    try:
        limit = parse_limit(default=10, max_limit=50)

        rules_counter: Counter[str] = Counter()
        flagged_rows = db.session.query(Transaction.flagged_rules).all()

        for (flagged_rules,) in flagged_rows:
            normalized_rules = normalize_rule_list(flagged_rules)
            if normalized_rules:
                rules_counter.update(normalized_rules)

        data = [
            {"rule": rule_name, "count": count}
            for rule_name, count in rules_counter.most_common(limit)
        ]
        return success_response({"top_flagged_rules": data, "limit": limit})
    except ValueError as exc:
        return error_response(str(exc), status_code=400)
    except Exception as exc:
        logger.exception("Error fetching top flagged rules.")
        return error_response("Failed to fetch top flagged rules", status_code=500, details=str(exc))


@dashboard_bp.route("/system-metrics", methods=["GET"])
def get_system_metrics():
    """Return runtime system metrics for operational monitoring widgets."""
    try:
        metrics = get_runtime_metrics()
        data = {
            "uptime_seconds": metrics["system_uptime_seconds"],
            "transactions_processed": metrics["total_transactions_processed"],
            "avg_processing_time_ms": metrics["average_processing_time_ms"],
            "fraud_rate": metrics["fraud_detection_rate"],
        }
        return success_response(data)
    except Exception as exc:
        logger.exception("Error fetching system metrics.")
        return error_response("Failed to fetch system metrics", status_code=500, details=str(exc))
