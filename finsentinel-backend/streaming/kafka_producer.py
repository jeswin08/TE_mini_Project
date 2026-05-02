"""Kafka producer for publishing transaction events."""

from __future__ import annotations

import json
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

try:
    from kafka import KafkaProducer
except Exception:  # pragma: no cover
    KafkaProducer = None


class TransactionKafkaProducer:
    """Kafka producer wrapper to publish transaction payloads to a topic."""

    def __init__(self, bootstrap_servers: str, topic: str) -> None:
        self._topic = topic
        self._enabled = KafkaProducer is not None
        self._producer = None

        if self._enabled:
            self._producer = KafkaProducer(
                bootstrap_servers=[server.strip() for server in bootstrap_servers.split(",") if server.strip()],
                value_serializer=lambda value: json.dumps(value).encode("utf-8"),
            )
        else:
            logger.warning("kafka-python dependency is unavailable; Kafka publish is disabled.")

    def publish(self, payload: Dict[str, Any]) -> bool:
        """Publish a transaction event to Kafka and return operation status."""
        if not self._enabled or self._producer is None:
            return False

        try:
            self._producer.send(self._topic, payload)
            self._producer.flush(timeout=2)
            return True
        except Exception:
            logger.exception("Failed to publish event to Kafka topic %s", self._topic)
            return False


def publish_transaction_event(app_config: Dict[str, Any], payload: Dict[str, Any]) -> bool:
    """Publish transaction payload to Kafka using app configuration settings."""
    try:
        if not bool(app_config.get("KAFKA_ENABLED", False)):
            return False

        producer = TransactionKafkaProducer(
            bootstrap_servers=str(app_config.get("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")),
            topic=str(app_config.get("KAFKA_TOPIC_TRANSACTIONS", "finsentinel.transactions")),
        )
        return producer.publish(payload)
    except Exception:
        logger.exception("Unexpected Kafka publish failure.")
        return False
