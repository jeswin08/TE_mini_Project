"""Database models for FinSentinel."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from database.db import db


def generate_transaction_id() -> str:
    """Generate a unique prefixed transaction identifier."""
    return f"TXN-{uuid.uuid4()}"


def generate_alert_id() -> str:
    """Generate a unique prefixed alert identifier."""
    return f"ALT-{uuid.uuid4()}"


def to_utc_iso(timestamp: Optional[datetime]) -> Optional[str]:
    """Convert a datetime object into UTC ISO-8601 format."""
    if timestamp is None:
        return None
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    else:
        timestamp = timestamp.astimezone(timezone.utc)
    return timestamp.isoformat().replace("+00:00", "Z")


class Transaction(db.Model):
    """Represents an analyzed financial transaction."""

    __tablename__ = "transactions"
    __table_args__ = (
        db.CheckConstraint("ml_score >= 0 AND ml_score <= 100", name="chk_ml_score_range"),
        db.CheckConstraint("rule_score >= 0 AND rule_score <= 100", name="chk_rule_score_range"),
        db.CheckConstraint("final_score >= 0 AND final_score <= 100", name="chk_final_score_range"),
        db.CheckConstraint(
            "model_confidence >= 0 AND model_confidence <= 1",
            name="chk_model_confidence_range",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
        index=True,
        default=generate_transaction_id,
    )
    user_id = db.Column(db.String(64), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), nullable=False)
    merchant = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(255), nullable=False)
    device_id = db.Column(db.String(255), nullable=False)
    ip_address = db.Column(db.String(64), nullable=True)
    ml_score = db.Column(db.Float, nullable=False, default=0.0)
    rule_score = db.Column(db.Float, nullable=False, default=0.0)
    final_score = db.Column(db.Float, nullable=False, default=0.0, index=True)
    risk_level = db.Column(db.String(20), nullable=False, default="Safe", index=True)
    decision = db.Column(db.String(20), nullable=False, default="Approved", index=True)
    model_confidence = db.Column(db.Float, nullable=False, default=0.0)
    is_fraud = db.Column(db.Boolean, nullable=False, default=False, index=True)
    flagged_rules = db.Column(db.JSON, nullable=False, default=list)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    processing_time_ms = db.Column(db.Integer, nullable=False, default=0)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize the transaction model into a dictionary."""
        return {
            "id": self.id,
            "transaction_id": self.transaction_id,
            "user_id": self.user_id,
            "amount": self.amount,
            "currency": self.currency,
            "merchant": self.merchant,
            "location": self.location,
            "device_id": self.device_id,
            "ip_address": self.ip_address,
            "ml_score": self.ml_score,
            "rule_score": self.rule_score,
            "final_score": self.final_score,
            "risk_level": self.risk_level,
            "decision": self.decision,
            "model_confidence": self.model_confidence,
            "is_fraud": self.is_fraud,
            "flagged_rules": self.flagged_rules or [],
            "timestamp": to_utc_iso(self.timestamp),
            "processing_time_ms": self.processing_time_ms,
        }


class Alert(db.Model):
    """Represents an alert generated for a high-risk transaction."""

    __tablename__ = "alerts"

    id = db.Column(db.Integer, primary_key=True)
    alert_id = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
        index=True,
        default=generate_alert_id,
    )
    transaction_id = db.Column(db.String(50), db.ForeignKey("transactions.transaction_id"), nullable=False, index=True)
    user_id = db.Column(db.String(64), nullable=False, index=True)
    risk_score = db.Column(db.Float, nullable=False)
    flagged_rules = db.Column(db.JSON, nullable=False, default=list)
    status = db.Column(db.String(20), nullable=False, default="active", index=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    transaction = db.relationship("Transaction", backref=db.backref("alerts", lazy=True))

    def to_dict(self) -> Dict[str, Any]:
        """Serialize the alert model into a dictionary."""
        return {
            "id": self.id,
            "alert_id": self.alert_id,
            "transaction_id": self.transaction_id,
            "user_id": self.user_id,
            "risk_score": self.risk_score,
            "flagged_rules": self.flagged_rules or [],
            "status": self.status,
            "timestamp": to_utc_iso(self.timestamp),
        }