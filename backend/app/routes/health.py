"""Health-check endpoint."""

from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    """Return a simple health-check response.

    This endpoint is unauthenticated so load-balancers and uptime monitors can
    ping it freely.
    """
    return jsonify({"status": "healthy", "service": "taskflow-api"}), 200
