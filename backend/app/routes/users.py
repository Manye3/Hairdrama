"""User-related API endpoints."""

from flask import Blueprint, g, jsonify

from app.auth import require_auth
from app.services import user_service

users_bp = Blueprint("users", __name__)


@users_bp.route("/users", methods=["GET"])
@require_auth
def list_users():
    """Return all user profiles (for the assignment dropdown)."""
    try:
        users = user_service.list_users()
        return jsonify({"data": users}), 200
    except Exception as exc:
        return jsonify({"error": f"Failed to fetch users: {exc}"}), 500


@users_bp.route("/users/me", methods=["GET"])
@require_auth
def get_current_user():
    """Return the authenticated user's profile."""
    try:
        profile = user_service.get_user_profile(g.user_id)
        if not profile:
            return jsonify({"error": "Profile not found"}), 404
        return jsonify({"data": profile}), 200
    except Exception as exc:
        return jsonify({"error": f"Failed to fetch profile: {exc}"}), 500
