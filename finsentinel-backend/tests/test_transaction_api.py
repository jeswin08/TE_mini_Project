"""Integration-style API tests for transaction routes."""

from __future__ import annotations

import pytest

from utils.jwt_compat import JWT_AVAILABLE


def _payload():
    return {
        "user_id": "user-123",
        "amount": 2500,
        "currency": "INR",
        "merchant": "Retail Store",
        "location": "Kochi",
        "device_id": "device-1",
        "usual_location": "Kochi",
        "usual_device": "device-1",
        "user_avg_amount": 2000,
        "hour_of_day": 11,
    }


def test_analyze_transaction_requires_auth(client):
    """Transaction analyze endpoint should be JWT-protected."""
    if not JWT_AVAILABLE:
        pytest.skip("flask-jwt-extended is not installed in the current environment")

    response = client.post("/api/transaction/analyze", json=_payload())

    assert response.status_code == 401
    body = response.get_json() or {}
    assert body.get("success") is False
    assert body.get("error") is not None


def test_analyze_transaction_success(client, auth_header):
    """Analyze endpoint should return standardized success payload."""
    response = client.post("/api/transaction/analyze", json=_payload(), headers=auth_header)

    assert response.status_code == 201
    body = response.get_json() or {}
    assert body.get("success") is True
    assert body.get("data", {}).get("transaction_id")
    assert body.get("data", {}).get("risk_score") is not None
    assert body.get("error") is None


def test_transaction_history_success(client, auth_header):
    """History endpoint should return paginated transactions for user."""
    client.post("/api/transaction/analyze", json=_payload(), headers=auth_header)

    response = client.get("/api/transaction/history?user_id=user-123", headers=auth_header)

    assert response.status_code == 200
    body = response.get_json() or {}
    assert body.get("success") is True
    assert isinstance(body.get("data", {}).get("transactions"), list)
