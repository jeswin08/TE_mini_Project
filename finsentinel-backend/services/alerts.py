"""Fraud alert services for high-risk transactions."""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

ALERT_THRESHOLD = 80.0


class AlertSink(ABC):
    """Abstract sink for dispatching fraud alerts to different channels."""

    @abstractmethod
    def send(self, alert_payload: Dict[str, Any]) -> None:
        """Send an alert payload to a destination channel."""


class ConsoleAlertSink(AlertSink):
    """Console-based alert sink used as default alerting backend."""

    def send(self, alert_payload: Dict[str, Any]) -> None:
        """Log high-risk fraud alerts to application logs/console."""
        logger.warning(
            "[FraudAlert] TXN_ID=%s USER_ID=%s AMOUNT=%.2f RISK_SCORE=%.2f",
            alert_payload.get("transaction_id", "unknown"),
            alert_payload.get("user_id", "unknown"),
            float(alert_payload.get("amount", 0.0)),
            float(alert_payload.get("risk_score", 0.0)),
        )


ALERT_SINKS: List[AlertSink] = [ConsoleAlertSink()]


def send_fraud_alert(transaction_data: Dict[str, Any]) -> bool:
    """Send a fraud alert for high-risk transactions and return whether an alert was emitted."""
    try:
        risk_score = float(transaction_data.get("risk_score", 0.0))
        if risk_score < ALERT_THRESHOLD:
            return False

        alert_payload = {
            "transaction_id": transaction_data.get("transaction_id"),
            "user_id": transaction_data.get("user_id"),
            "amount": float(transaction_data.get("amount", 0.0)),
            "risk_score": risk_score,
        }

        for sink in ALERT_SINKS:
            sink.send(alert_payload)

        return True
    except Exception:
        logger.exception("Failed to dispatch fraud alert.")
        return False
