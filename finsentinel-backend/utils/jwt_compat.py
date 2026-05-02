"""Compatibility layer for optional flask-jwt-extended dependency."""

from __future__ import annotations

import logging
from typing import Any, Callable

logger = logging.getLogger(__name__)

try:
    from flask_jwt_extended import JWTManager, create_access_token, jwt_required

    JWT_AVAILABLE = True
except Exception:  # pragma: no cover - dependency fallback
    JWT_AVAILABLE = False

    class JWTManager:  # type: ignore[override]
        """No-op JWT manager when flask-jwt-extended is unavailable."""

        def __init__(self, app=None):
            if app is not None:
                self.init_app(app)

        def init_app(self, app) -> None:
            logger.warning("flask-jwt-extended is not installed; JWT protection is disabled.")

        def unauthorized_loader(self, callback: Callable[..., Any]) -> Callable[..., Any]:
            return callback

        def invalid_token_loader(self, callback: Callable[..., Any]) -> Callable[..., Any]:
            return callback

        def expired_token_loader(self, callback: Callable[..., Any]) -> Callable[..., Any]:
            return callback

    def create_access_token(identity: str) -> str:
        """Fallback token creator when JWT dependency is unavailable."""
        return f"jwt-disabled:{identity}"

    def jwt_required(*args, **kwargs):
        """Fallback decorator that keeps endpoints callable without JWT dependency."""

        def decorator(func):
            return func

        return decorator
