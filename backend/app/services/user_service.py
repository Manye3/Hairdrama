"""User service — business logic for user/profile operations."""

from __future__ import annotations

import logging
from typing import Any

from flask import current_app

logger = logging.getLogger(__name__)


def _client():
    """Return the Supabase client stored on the app."""
    return current_app.config["SUPABASE_CLIENT"]


def get_user_profile(user_id: str) -> dict[str, Any] | None:
    """Fetch a single user profile by ``id``.

    Returns ``None`` if the profile does not exist.
    """
    response = (
        _client()
        .table("profiles")
        .select("*")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    return response.data


def get_user_email(user_id: str) -> str | None:
    """Convenience helper that returns just the user's email, or ``None``."""
    profile = get_user_profile(user_id)
    if profile:
        return profile.get("email")
    return None


def list_users() -> list[dict[str, Any]]:
    """Return all user profiles (used for the assignment dropdown)."""
    response = (
        _client()
        .table("profiles")
        .select("id, email, full_name, avatar_url")
        .order("full_name", desc=False)
        .execute()
    )
    return response.data or []
