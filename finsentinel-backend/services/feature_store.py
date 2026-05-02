"""Feature store caching for fast behavioral feature retrieval."""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Set

from database.models import Transaction


@dataclass
class _CacheEntry:
    """In-memory cache entry for a user's behavioral profile."""

    value: Dict[str, Any]
    expires_at: float


class FeatureStore:
    """Simple TTL cache-backed feature store for user behavioral features."""

    def __init__(self, ttl_seconds: int = 120) -> None:
        self._ttl_seconds = ttl_seconds
        self._cache: Dict[str, _CacheEntry] = {}
        self._lock = threading.Lock()

    def get_user_features(self, user_id: str) -> Dict[str, Any]:
        """Return cached or database-computed behavioral features for a user."""
        if not user_id:
            return self._default_features()

        with self._lock:
            cached = self._cache.get(user_id)
            if cached and cached.expires_at > time.time():
                return dict(cached.value)

        computed = self._build_user_features(user_id)
        with self._lock:
            self._cache[user_id] = _CacheEntry(
                value=dict(computed),
                expires_at=time.time() + self._ttl_seconds,
            )
        return computed

    def update_user_features(self, user_id: str, transaction_data: Dict[str, Any]) -> None:
        """Incrementally update cached user profile after a processed transaction."""
        if not user_id:
            return

        current = self.get_user_features(user_id)
        amount = float(transaction_data.get("amount", 0.0))
        location = str(transaction_data.get("location", "")).strip().lower()
        device_id = str(transaction_data.get("device_id", "")).strip().lower()
        merchant = str(transaction_data.get("merchant", "")).strip().lower()

        current_count = int(current.get("transaction_count", 0))
        new_count = current_count + 1
        avg = float(current.get("avg_transaction_amount", 0.0))
        updated_avg = ((avg * current_count) + amount) / new_count if new_count else avg

        trusted_devices = set(current.get("trusted_devices", []))
        if device_id:
            trusted_devices.add(device_id)

        locations = set(current.get("location_history", []))
        if location:
            locations.add(location)

        merchants = set(current.get("known_merchants", []))
        if merchant:
            merchants.add(merchant)

        updated = {
            "avg_transaction_amount": round(updated_avg, 2),
            "trusted_devices": sorted(trusted_devices),
            "location_history": sorted(locations),
            "known_merchants": sorted(merchants),
            "transaction_count": new_count,
        }

        with self._lock:
            self._cache[user_id] = _CacheEntry(
                value=updated,
                expires_at=time.time() + self._ttl_seconds,
            )

    def invalidate_user(self, user_id: str) -> None:
        """Remove a user cache entry from the feature store."""
        with self._lock:
            self._cache.pop(user_id, None)

    def _build_user_features(self, user_id: str) -> Dict[str, Any]:
        """Build user behavioral profile from historical transactions."""
        transactions: List[Transaction] = (
            Transaction.query.filter_by(user_id=user_id)
            .order_by(Transaction.timestamp.desc())
            .limit(500)
            .all()
        )

        if not transactions:
            return self._default_features()

        amounts = [float(txn.amount) for txn in transactions]
        trusted_devices: Set[str] = {
            str(txn.device_id).strip().lower() for txn in transactions if txn.device_id
        }
        location_history: Set[str] = {
            str(txn.location).strip().lower() for txn in transactions if txn.location
        }
        known_merchants: Set[str] = {
            str(txn.merchant).strip().lower() for txn in transactions if txn.merchant
        }

        return {
            "avg_transaction_amount": round(sum(amounts) / len(amounts), 2),
            "trusted_devices": sorted(trusted_devices),
            "location_history": sorted(location_history),
            "known_merchants": sorted(known_merchants),
            "transaction_count": len(transactions),
        }

    @staticmethod
    def _default_features() -> Dict[str, Any]:
        """Return default behavioral profile for users without historical data."""
        return {
            "avg_transaction_amount": 0.0,
            "trusted_devices": [],
            "location_history": [],
            "known_merchants": [],
            "transaction_count": 0,
        }


feature_store = FeatureStore()
