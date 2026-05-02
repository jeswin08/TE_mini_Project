"""Pytest fixtures for FinSentinel backend tests."""

from __future__ import annotations

import os
import sys

import pytest

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from database.db import db
from utils.jwt_compat import JWT_AVAILABLE


@pytest.fixture()
def app_instance(tmp_path):
    """Create and configure a test app with isolated sqlite database."""
    db_path = tmp_path / "test_finsentinel.db"

    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
            "JWT_SECRET_KEY": "test-secret-key",
            "AUTH_USERNAME": "test-user",
            "AUTH_PASSWORD": "test-pass",
            "KAFKA_ENABLED": False,
        }
    )

    with app.app_context():
        db.drop_all()
        db.create_all()

    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app_instance):
    """Return Flask test client for API tests."""
    return app_instance.test_client()


@pytest.fixture()
def auth_header(client):
    """Create Authorization header with a valid JWT access token."""
    if not JWT_AVAILABLE:
        pytest.skip("flask-jwt-extended is not installed in the current environment")

    response = client.post(
        "/api/auth/token",
        json={"username": "test-user", "password": "test-pass"},
    )
    payload = response.get_json() or {}
    token = payload.get("data", {}).get("access_token")
    return {"Authorization": f"Bearer {token}"}
