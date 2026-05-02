"""Application configuration module for FinSentinel backend."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent


class Config:
    """Application configuration loaded from environment variables."""

    SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'finsentinel.db'}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MODEL_PATH = os.getenv("MODEL_PATH", str(BASE_DIR / "model" / "fraud_model.pkl"))
    SCALER_PATH = os.getenv("SCALER_PATH", str(BASE_DIR / "model" / "scaler.pkl"))
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", "3600"))
    AUTH_USERNAME = os.getenv("AUTH_USERNAME", "admin")
    AUTH_PASSWORD = os.getenv("AUTH_PASSWORD", "admin123")
    KAFKA_ENABLED = str(os.getenv("KAFKA_ENABLED", "false")).lower() == "true"
    KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    KAFKA_TOPIC_TRANSACTIONS = os.getenv("KAFKA_TOPIC_TRANSACTIONS", "finsentinel.transactions")
    MODEL_RETRAIN_INTERVAL_SECONDS = int(os.getenv("MODEL_RETRAIN_INTERVAL_SECONDS", "3600"))