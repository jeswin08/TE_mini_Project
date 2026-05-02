"""Main Flask application entrypoint for FinSentinel backend."""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

from flask import Flask
from flask_cors import CORS
from sqlalchemy import text

from config import Config
from database.db import db, init_db
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.mock_api import mock_api_bp
from routes.transaction import transaction_bp
from services.risk_engine import load_model_artifacts
from utils.jwt_compat import JWTManager
from utils.rate_limiter import init_limiter
from utils.response import error_response, success_response


def configure_logging(app: Flask) -> None:
    """Configure application-wide logging settings."""
    log_level_name = str(app.config.get("LOG_LEVEL", "INFO")).upper()
    log_level = getattr(logging, log_level_name, logging.INFO)
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


def register_blueprints(app: Flask) -> None:
    """Register all API blueprints on the Flask application."""
    app.register_blueprint(mock_api_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(transaction_bp, url_prefix="/api/transaction")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")


def load_ml_assets(app: Flask) -> None:
    """Load ML model and scaler artifacts and store them in app config."""
    model, scaler = load_model_artifacts(
        model_path=app.config["MODEL_PATH"],
        scaler_path=app.config["SCALER_PATH"],
    )
    app.config["ML_MODEL"] = model
    app.config["ML_SCALER"] = scaler


def create_app(config_overrides: Optional[Dict[str, Any]] = None) -> Flask:
    """Create and configure the FinSentinel Flask application instance."""
    app = Flask(__name__)
    app.config.from_object(Config)
    if config_overrides:
        app.config.update(config_overrides)
    jwt = JWTManager(app)

    CORS(app, resources={r"/*": {"origins": "*"}})

    configure_logging(app)
    init_limiter(app)
    init_db(app)
    register_blueprints(app)
    load_ml_assets(app)

    @app.route("/health", methods=["GET"])
    def health_check():
        """Return service health details for monitoring and readiness checks."""
        try:
            db_status = "up"
            try:
                db.session.execute(text("SELECT 1"))
            except Exception:
                db_status = "down"
                app.logger.exception("Database health check failed.")

            model_loaded = app.config.get("ML_MODEL") is not None
            scaler_loaded = app.config.get("ML_SCALER") is not None

            overall_status = "healthy" if db_status == "up" else "degraded"
            data = {
                "status": overall_status,
                "database": db_status,
                "model_loaded": model_loaded,
                "scaler_loaded": scaler_loaded,
            }
            return success_response(data)
        except Exception as exc:
            app.logger.exception("Health endpoint failed.")
            return error_response("Health check failed", status_code=500, details=str(exc))

    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle resource-not-found errors."""
        return error_response("Resource not found", status_code=404)

    @jwt.unauthorized_loader
    def handle_missing_jwt(reason):
        """Handle missing JWT access token errors."""
        return error_response("Authentication required", status_code=401, details=reason)

    @jwt.invalid_token_loader
    def handle_invalid_jwt(reason):
        """Handle invalid JWT token errors."""
        return error_response("Invalid authentication token", status_code=401, details=reason)

    @jwt.expired_token_loader
    def handle_expired_jwt(jwt_header, jwt_payload):
        """Handle expired JWT token errors."""
        return error_response("Authentication token expired", status_code=401)

    @app.errorhandler(429)
    def handle_rate_limit_exceeded(error):
        """Handle API rate limit violations with standardized response payload."""
        return error_response("Rate limit exceeded", status_code=429, details=str(error))

    @app.errorhandler(500)
    def handle_internal_error(error):
        """Handle unhandled internal server errors."""
        app.logger.exception("Unhandled internal server error: %s", error)
        return error_response("Internal server error", status_code=500)

    return app


app = create_app()


if __name__ == "__main__":
    # Use Gunicorn for production: gunicorn -w 4 -b 0.0.0.0:5005 app:app
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5005")),
        debug=str(os.getenv("FLASK_DEBUG", "false")).lower() == "true",
    )
