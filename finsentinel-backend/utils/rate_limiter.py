"""Flask-Limiter extension setup for API rate controls."""

from __future__ import annotations

import logging

from flask import Flask

logger = logging.getLogger(__name__)

try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address

    _LIMITER_AVAILABLE = True
except Exception:  # pragma: no cover - dependency fallback
    Limiter = None
    get_remote_address = None
    _LIMITER_AVAILABLE = False


class NoopLimiter:
    """No-op limiter used when Flask-Limiter dependency is unavailable."""

    def init_app(self, app: Flask) -> None:
        """No-op initializer for compatibility."""
        return None

    def limit(self, _limit: str):
        """Return passthrough decorator when rate limiter is unavailable."""

        def decorator(func):
            return func

        return decorator


if _LIMITER_AVAILABLE:
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=[],
        storage_uri="memory://",
    )
else:
    limiter = NoopLimiter()


def init_limiter(app: Flask) -> None:
    """Initialize Flask-Limiter on the Flask app instance."""
    if not _LIMITER_AVAILABLE:
        logger.warning("Flask-Limiter is not installed; API rate limiting is disabled.")
    limiter.init_app(app)
