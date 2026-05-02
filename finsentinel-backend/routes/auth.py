"""Authentication routes for issuing JWT access tokens."""

from __future__ import annotations

from flask import Blueprint, current_app, request

from utils.jwt_compat import JWT_AVAILABLE, create_access_token
from utils.response import error_response, success_response

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/token", methods=["POST"])
def issue_token():
    """Issue JWT access token for valid API credentials."""
    try:
        if not JWT_AVAILABLE:
            return error_response(
                "JWT authentication is unavailable",
                status_code=503,
                details="Install flask-jwt-extended to enable token issuance.",
            )

        payload = request.get_json(silent=True) or {}
        username = str(payload.get("username", "")).strip()
        password = str(payload.get("password", "")).strip()

        expected_user = str(current_app.config.get("AUTH_USERNAME", "admin"))
        expected_password = str(current_app.config.get("AUTH_PASSWORD", "admin123"))

        if username != expected_user or password != expected_password:
            return error_response("Invalid credentials", status_code=401)

        token = create_access_token(identity=username)
        return success_response({"access_token": token})
    except Exception as exc:
        return error_response("Failed to issue token", status_code=500, details=str(exc))
