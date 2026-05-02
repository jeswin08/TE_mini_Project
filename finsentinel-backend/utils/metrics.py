"""In-memory runtime metrics tracking for FinSentinel services."""

from __future__ import annotations

import threading
import time
from typing import Dict


class RuntimeMetrics:
    """Track runtime transaction and performance metrics for operational dashboards."""

    def __init__(self) -> None:
        self._started_at = time.time()
        self._total_transactions_processed = 0
        self._total_processing_time_ms = 0.0
        self._fraud_detections = 0
        self._lock = threading.Lock()

    def record_transaction(self, processing_time_ms: float, is_fraud: bool) -> None:
        """Record a processed transaction and update aggregate runtime counters."""
        with self._lock:
            self._total_transactions_processed += 1
            self._total_processing_time_ms += float(processing_time_ms)
            if bool(is_fraud):
                self._fraud_detections += 1

    def snapshot(self) -> Dict[str, float]:
        """Return a point-in-time metrics snapshot for API responses."""
        with self._lock:
            processed = self._total_transactions_processed
            avg_processing = (self._total_processing_time_ms / processed) if processed else 0.0
            fraud_rate = ((self._fraud_detections / processed) * 100.0) if processed else 0.0
            uptime = max(0.0, time.time() - self._started_at)

            return {
                "system_uptime_seconds": round(uptime, 2),
                "total_transactions_processed": processed,
                "average_processing_time_ms": round(avg_processing, 2),
                "fraud_detection_rate": round(fraud_rate, 2),
            }


runtime_metrics = RuntimeMetrics()


def record_runtime_metrics(processing_time_ms: float, is_fraud: bool) -> None:
    """Public helper to update global runtime metrics safely."""
    runtime_metrics.record_transaction(processing_time_ms=processing_time_ms, is_fraud=is_fraud)


def get_runtime_metrics() -> Dict[str, float]:
    """Public helper to fetch global runtime metrics snapshot."""
    return runtime_metrics.snapshot()
