"""Database initialization helpers for FinSentinel."""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def init_db(app) -> None:
    """Initialize SQLAlchemy and create database tables."""
    db.init_app(app)
    with app.app_context():
        db.create_all()