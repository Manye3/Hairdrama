"""TaskFlow Flask application factory."""

from __future__ import annotations

import logging
import os

from flask import Flask, jsonify
from flask_cors import CORS
from supabase import create_client

from app.config import Config


def create_app() -> Flask:
    """Create and configure the Flask application.

    Uses the **app-factory** pattern so the app can be instantiated multiple
    times (for testing, workers, etc.) without module-level side-effects.
    """
    app = Flask(__name__)

    # ── Configuration ────────────────────────────────────────────────────
    app.config.from_object(Config)

    # Validate required environment variables early so operators get a clear
    # error instead of cryptic 500s at request time.
    missing = Config.validate()
    if missing:
        app.logger.warning(
            "Missing required environment variables: %s. "
            "Some features will not work until they are set.",
            ", ".join(missing),
        )

    # ── Logging ──────────────────────────────────────────────────────────
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    # ── Supabase client ──────────────────────────────────────────────────
    supabase_url = app.config.get("SUPABASE_URL")
    supabase_key = app.config.get("SUPABASE_SERVICE_ROLE_KEY")

    if supabase_url and supabase_key:
        supabase_client = create_client(supabase_url, supabase_key)
        app.config["SUPABASE_CLIENT"] = supabase_client
        app.logger.info("Supabase client initialised for %s", supabase_url)
    else:
        app.logger.warning(
            "Supabase client NOT initialised — URL or service-role key is missing."
        )

    # ── CORS ─────────────────────────────────────────────────────────────
    frontend_url = app.config.get("FRONTEND_URL", "http://localhost:5173")
    CORS(
        app,
        origins=[frontend_url],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    # ── Blueprints ───────────────────────────────────────────────────────
    from app.routes.health import health_bp
    from app.routes.tasks import tasks_bp
    from app.routes.users import users_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(tasks_bp, url_prefix="/api")
    app.register_blueprint(users_bp, url_prefix="/api")

    # ── Global error handlers ────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.exception("Unhandled server error")
        return jsonify({"error": "Internal server error"}), 500

    return app
