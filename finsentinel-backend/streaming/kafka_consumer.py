"""Kafka consumer for processing streamed transaction analysis requests."""

from __future__ import annotations

import json
import logging
import time
from typing import Any, Dict

from app import create_app
from routes.transaction import normalize_payload, validate_analyze_payload
from services.fraud_pipeline import process_transaction_data

logger = logging.getLogger(__name__)

try:
    from kafka import KafkaConsumer
except Exception:  # pragma: no cover
    KafkaConsumer = None


class TransactionKafkaConsumer:
    """Kafka consumer that executes the fraud pipeline for transaction events."""

    def __init__(self, bootstrap_servers: str, topic: str, group_id: str = "finsentinel-fraud-group") -> None:
        self._enabled = KafkaConsumer is not None
        self._topic = topic
        self._consumer = None

        if self._enabled:
            self._consumer = KafkaConsumer(
                self._topic,
                bootstrap_servers=[server.strip() for server in bootstrap_servers.split(",") if server.strip()],
                auto_offset_reset="latest",
                enable_auto_commit=True,
                group_id=group_id,
                value_deserializer=lambda value: json.loads(value.decode("utf-8")),
            )
        else:
            logger.warning("kafka-python dependency is unavailable; Kafka consumer is disabled.")

    def consume_forever(self) -> None:
        """Consume and process transactions from Kafka stream indefinitely."""
        if not self._enabled or self._consumer is None:
            logger.warning("Kafka consumer not started because dependencies are unavailable.")
            return

        app = create_app()
        with app.app_context():
            logger.info("Kafka consumer started for topic %s", self._topic)
            for message in self._consumer:
                self._process_message(message.value)

    def _process_message(self, payload: Dict[str, Any]) -> None:
        """Validate and process a single Kafka transaction event payload."""
        try:
            is_valid, error = validate_analyze_payload(payload)
            if not is_valid:
                logger.warning("Skipping invalid streamed payload: %s", error)
                return

            normalized = normalize_payload(payload)
            result = process_transaction_data(normalized, source="kafka")
            logger.info(
                "Kafka transaction processed: TXN_ID=%s RISK_SCORE=%.2f",
                result.get("transaction_id"),
                float(result.get("risk_score", 0.0)),
            )
        except Exception:
            logger.exception("Failed to process Kafka transaction payload.")


def main() -> None:
    """Entrypoint to start the Kafka transaction consumer service."""
    app = create_app()
    bootstrap_servers = str(app.config.get("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"))
    topic = str(app.config.get("KAFKA_TOPIC_TRANSACTIONS", "finsentinel.transactions"))

    consumer = TransactionKafkaConsumer(bootstrap_servers=bootstrap_servers, topic=topic)
    while True:
        try:
            consumer.consume_forever()
        except Exception:
            logger.exception("Kafka consumer crashed; restarting shortly.")
            time.sleep(5)


if __name__ == "__main__":
    main()
