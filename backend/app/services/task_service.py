"""Task service — CRUD operations against the Supabase ``tasks`` table."""

from __future__ import annotations

import logging
from typing import Any

from flask import current_app

logger = logging.getLogger(__name__)

# Columns to select when returning tasks, including joined profile info for
# both the creator and the assignee.
_TASK_SELECT = (
    "*, "
    "creator:profiles!tasks_created_by_fkey(id, email, full_name, avatar_url), "
    "assignee:profiles!tasks_assigned_to_fkey(id, email, full_name, avatar_url)"
)


def _client():
    """Return the Supabase client stored on the app."""
    return current_app.config["SUPABASE_CLIENT"]


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------


def list_tasks(user_id: str) -> list[dict[str, Any]]:
    """Return tasks where the user is the creator **or** the assignee."""
    response = (
        _client()
        .table("tasks")
        .select(_TASK_SELECT)
        .or_(f"created_by.eq.{user_id},assigned_to.eq.{user_id}")
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


def get_task(task_id: str) -> dict[str, Any] | None:
    """Fetch a single task by its primary key.

    Returns ``None`` when the task does not exist.
    """
    response = (
        _client()
        .table("tasks")
        .select(_TASK_SELECT)
        .eq("id", task_id)
        .maybe_single()
        .execute()
    )
    return response.data


# ---------------------------------------------------------------------------
# Write
# ---------------------------------------------------------------------------


def create_task(data: dict[str, Any]) -> dict[str, Any]:
    """Insert a new task and return the created row (with joins)."""
    response = _client().table("tasks").insert(data).execute()
    created = response.data[0] if response.data else {}
    # Re-fetch to get joined profile data
    if created.get("id"):
        return get_task(created["id"]) or created
    return created


def update_task(task_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    """Update an existing task.  Returns ``None`` if the task was not found."""
    response = (
        _client()
        .table("tasks")
        .update(data)
        .eq("id", task_id)
        .execute()
    )
    if not response.data:
        return None
    # Re-fetch to get joined profile data
    return get_task(task_id)


def update_task_status(task_id: str, status: str) -> dict[str, Any] | None:
    """Update only the ``status`` column. Returns the updated task or ``None``."""
    return update_task(task_id, {"status": status})


def delete_task(task_id: str) -> bool:
    """Delete a task. Returns ``True`` if a row was actually deleted."""
    response = (
        _client()
        .table("tasks")
        .delete()
        .eq("id", task_id)
        .execute()
    )
    return bool(response.data)
