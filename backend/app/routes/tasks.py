"""Task CRUD API endpoints."""

from flask import Blueprint, g, jsonify, request

from app.auth import require_auth
from app.services import task_service, user_service
from app.services.email_service import (
    send_task_assignment_email,
    send_task_completion_email,
)

tasks_bp = Blueprint("tasks", __name__)

# Allowed values for the ``status`` field.
_VALID_STATUSES = {"todo", "in_progress", "in_review", "completed"}
_VALID_PRIORITIES = {"low", "medium", "high", "urgent"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _validate_task_payload(data: dict, require_title: bool = True) -> str | None:
    """Return an error message string if the payload is invalid, else ``None``."""
    if require_title and not data.get("title", "").strip():
        return "Field 'title' is required and must not be blank"

    if "status" in data and data["status"] not in _VALID_STATUSES:
        return f"Invalid status '{data['status']}'. Must be one of: {', '.join(sorted(_VALID_STATUSES))}"

    if "priority" in data and data["priority"] not in _VALID_PRIORITIES:
        return f"Invalid priority '{data['priority']}'. Must be one of: {', '.join(sorted(_VALID_PRIORITIES))}"

    return None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@tasks_bp.route("/tasks", methods=["GET"])
@require_auth
def list_tasks():
    """List tasks created by or assigned to the current user."""
    try:
        tasks = task_service.list_tasks(g.user_id)
        return jsonify({"data": tasks}), 200
    except Exception as exc:
        return jsonify({"error": f"Failed to list tasks: {exc}"}), 500


@tasks_bp.route("/tasks", methods=["POST"])
@require_auth
def create_task():
    """Create a new task.

    Sends an assignment email when ``assigned_to`` is provided and differs from
    the creator.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    error = _validate_task_payload(data, require_title=True)
    if error:
        return jsonify({"error": error}), 400

    task_data = {
        "title": data["title"].strip(),
        "description": data.get("description", "").strip(),
        "status": data.get("status", "todo"),
        "priority": data.get("priority", "medium"),
        "created_by": g.user_id,
    }

    if data.get("due_date"):
        task_data["due_date"] = data["due_date"]

    assigned_to = data.get("assigned_to")
    if assigned_to:
        task_data["assigned_to"] = assigned_to

    try:
        task = task_service.create_task(task_data)
    except Exception as exc:
        return jsonify({"error": f"Failed to create task: {exc}"}), 500

    # Send assignment notification (best-effort, non-blocking)
    if assigned_to and assigned_to != g.user_id:
        assignee_email = user_service.get_user_email(assigned_to)
        if assignee_email:
            send_task_assignment_email(
                to_email=assignee_email,
                task_title=task_data["title"],
                task_description=task_data["description"],
                assigner_email=g.user_email,
            )

    return jsonify({"data": task, "message": "Task created successfully"}), 201


@tasks_bp.route("/tasks/<task_id>", methods=["GET"])
@require_auth
def get_task(task_id: str):
    """Retrieve a single task by ID."""
    try:
        task = task_service.get_task(task_id)
    except Exception as exc:
        return jsonify({"error": f"Failed to fetch task: {exc}"}), 500

    if not task:
        return jsonify({"error": "Task not found"}), 404

    return jsonify({"data": task}), 200


@tasks_bp.route("/tasks/<task_id>", methods=["PUT"])
@require_auth
def update_task(task_id: str):
    """Full update of a task."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    error = _validate_task_payload(data, require_title=False)
    if error:
        return jsonify({"error": error}), 400

    # Build the update payload — only include fields that were provided.
    allowed_fields = {"title", "description", "status", "priority", "due_date", "assigned_to"}
    update_data: dict = {}
    for field in allowed_fields:
        if field in data:
            value = data[field]
            if isinstance(value, str):
                value = value.strip()
            update_data[field] = value

    if not update_data:
        return jsonify({"error": "No valid fields provided for update"}), 400

    try:
        task = task_service.update_task(task_id, update_data)
    except Exception as exc:
        return jsonify({"error": f"Failed to update task: {exc}"}), 500

    if not task:
        return jsonify({"error": "Task not found"}), 404

    return jsonify({"data": task, "message": "Task updated successfully"}), 200


@tasks_bp.route("/tasks/<task_id>/status", methods=["PATCH"])
@require_auth
def update_task_status(task_id: str):
    """Update only the status of a task.

    Sends a completion email to the task creator when status becomes
    ``completed``.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    new_status = data.get("status", "").strip()
    if new_status not in _VALID_STATUSES:
        return (
            jsonify(
                {
                    "error": f"Invalid status '{new_status}'. "
                    f"Must be one of: {', '.join(sorted(_VALID_STATUSES))}"
                }
            ),
            400,
        )

    # Fetch the existing task first so we can determine recipients for the
    # completion notification.
    try:
        existing_task = task_service.get_task(task_id)
    except Exception as exc:
        return jsonify({"error": f"Failed to fetch task: {exc}"}), 500

    if not existing_task:
        return jsonify({"error": "Task not found"}), 404

    try:
        task = task_service.update_task_status(task_id, new_status)
    except Exception as exc:
        return jsonify({"error": f"Failed to update task status: {exc}"}), 500

    if not task:
        return jsonify({"error": "Task not found"}), 404

    # Send completion notification (best-effort)
    if new_status == "completed":
        creator_id = existing_task.get("created_by")
        if creator_id and creator_id != g.user_id:
            creator_email = user_service.get_user_email(creator_id)
            if creator_email:
                send_task_completion_email(
                    to_email=creator_email,
                    task_title=existing_task.get("title", "Untitled"),
                    task_description=existing_task.get("description", ""),
                    completer_email=g.user_email,
                )

    return jsonify({"data": task, "message": "Task status updated successfully"}), 200


@tasks_bp.route("/tasks/<task_id>", methods=["DELETE"])
@require_auth
def delete_task(task_id: str):
    """Delete a task by ID."""
    try:
        deleted = task_service.delete_task(task_id)
    except Exception as exc:
        return jsonify({"error": f"Failed to delete task: {exc}"}), 500

    if not deleted:
        return jsonify({"error": "Task not found"}), 404

    return jsonify({"message": "Task deleted successfully"}), 200
