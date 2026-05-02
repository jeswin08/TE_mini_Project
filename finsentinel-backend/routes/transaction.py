"""Transaction-related API routes for fraud analysis."""

from __future__ import annotations

import logging
import math
from typing import Any, Dict, Optional, Tuple

from flask import Blueprint, current_app, request

from database.db import db
from database.models import Transaction
from services.fraud_pipeline import process_transaction_data
from streaming.kafka_producer import publish_transaction_event
from utils.jwt_compat import jwt_required
from utils.rate_limiter import limiter
from utils.response import error_response, success_response

transaction_bp = Blueprint("transaction", __name__)
logger = logging.getLogger(__name__)


def safe_float(value: Any, default: float = 0.0) -> float:
    """Safely cast any value to float with a default fallback."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def validate_analyze_payload(payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Validate incoming transaction analysis payload."""
    required_fields = [
        "user_id",
        "amount",
        "currency",
        "merchant",
        "location",
        "device_id",
        "usual_location",
        "usual_device",
        "user_avg_amount",
        "hour_of_day",
    ]

    missing_fields = [field for field in required_fields if field not in payload]
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"

    amount = safe_float(payload.get("amount"), -1)
    if amount < 0:
        return False, "amount must be a non-negative number"

    user_avg_amount = safe_float(payload.get("user_avg_amount"), -1)
    if user_avg_amount < 0:
        return False, "user_avg_amount must be a non-negative number"

    hour_of_day = int(safe_float(payload.get("hour_of_day"), -1))
    if hour_of_day < 0 or hour_of_day > 23:
        return False, "hour_of_day must be between 0 and 23"

    v_features = payload.get("v_features")
    if v_features is not None:
        is_valid_shape = isinstance(v_features, list) and len(v_features) == 28
        is_numeric = is_valid_shape and all(isinstance(value, (int, float)) for value in v_features)
        if not is_numeric:
            return False, "v_features must be a numeric list of length 28"

    return True, None


def normalize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize and cast incoming payload values into canonical format."""
    return {
        "user_id": str(payload.get("user_id", "")).strip(),
        "amount": safe_float(payload.get("amount"), 0.0),
        "currency": str(payload.get("currency", "INR")).strip().upper(),
        "merchant": str(payload.get("merchant", "Unknown Merchant")).strip(),
        "location": str(payload.get("location", "Unknown")).strip(),
        "device_id": str(payload.get("device_id", "Unknown")).strip(),
        "ip_address": str(payload.get("ip_address", "")).strip() or None,
        "usual_location": str(payload.get("usual_location", "")).strip(),
        "usual_device": str(payload.get("usual_device", "")).strip(),
        "user_avg_amount": safe_float(payload.get("user_avg_amount"), 0.0),
        "hour_of_day": int(safe_float(payload.get("hour_of_day"), 0)),
        "v_features": payload.get("v_features"),
    }


@transaction_bp.route("/analyze", methods=["POST"])
@limiter.limit("100 per minute")
@jwt_required()
def analyze_transaction():
    """Analyze a transaction payload and return fraud risk assessment."""
    try:
        payload = request.get_json(silent=True)
        if payload is None:
            return error_response("Request body must be valid JSON", status_code=400)

        is_valid, validation_error = validate_analyze_payload(payload)
        if not is_valid:
            return error_response(validation_error or "Invalid request payload", status_code=400)

        data = normalize_payload(payload)
        publish_transaction_event(current_app.config, payload)
        response_data = process_transaction_data(data, source="api")
        return success_response(response_data, status_code=201)
    except Exception as exc:
        db.session.rollback()
        logger.exception("Error while analyzing transaction.")
        return error_response("Failed to analyze transaction", status_code=500, details=str(exc))


@transaction_bp.route("/history", methods=["GET"])
@jwt_required()
def get_transaction_history():
    """Return paginated transaction history for a specific user."""
    try:
        user_id = request.args.get("user_id", type=str)
        if not user_id:
            return error_response("user_id query parameter is required", status_code=400)

        limit = request.args.get("limit", default=20, type=int)
        page = request.args.get("page", default=1, type=int)

        if not limit or limit <= 0:
            return error_response("limit must be a positive integer", status_code=400)
        if not page or page <= 0:
            return error_response("page must be a positive integer", status_code=400)

        limit = min(limit, 100)

        query = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.timestamp.desc())
        total = query.count()
        transactions = query.offset((page - 1) * limit).limit(limit).all()
        pages = math.ceil(total / limit) if total else 0

        data = {
            "user_id": user_id,
            "page": page,
            "limit": limit,
            "total": total,
            "pages": pages,
            "transactions": [transaction.to_dict() for transaction in transactions],
        }
        return success_response(data)
    except Exception as exc:
        logger.exception("Error fetching transaction history.")
        return error_response("Failed to fetch transaction history", status_code=500, details=str(exc))


@transaction_bp.route("/<string:transaction_id>", methods=["GET"])
@jwt_required()
def get_transaction_details(transaction_id: str):
    """Return full details for a single transaction by transaction ID."""
    try:
        transaction = Transaction.query.filter_by(transaction_id=transaction_id).first()
        if transaction is None:
            return error_response("Transaction not found", status_code=404)

        return success_response(transaction.to_dict())
    except Exception as exc:
        logger.exception("Error fetching transaction details.")
        return error_response("Failed to fetch transaction details", status_code=500, details=str(exc))
