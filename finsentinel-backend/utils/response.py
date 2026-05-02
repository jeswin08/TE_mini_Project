"""Utility helpers for standardized API responses."""

from __future__ import annotations

from typing import Any, Dict, Optional

from flask import jsonify


def success_response(data: Optional[Dict[str, Any]] = None, status_code: int = 200):
    """Create a standardized success response payload."""
    payload = {
        "success": True,
        "data": data or {},
        "error": None,
    }
    return jsonify(payload), status_code


def error_response(message: str, status_code: int = 400, details: Any = None):
    """Create a standardized error response payload."""
    error_payload: Dict[str, Any] = {"message": message}
    if details is not None:
        error_payload["details"] = details

    payload = {
        "success": False,
        "data": {},
        "error": error_payload,
    }
    return jsonify(payload), status_code
