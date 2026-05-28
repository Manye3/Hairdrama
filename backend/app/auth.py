"""JWT authentication decorator using PyJWT to verify Supabase tokens."""

from functools import wraps

import jwt
from flask import current_app, g, jsonify, request


def require_auth(f):
    """Decorator that verifies a Supabase JWT from the Authorization header.

    On success it sets ``g.user_id`` (the Supabase ``sub`` claim) and
    ``g.user_email`` so downstream handlers can identify the caller.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or malformed Authorization header"}), 401

        token = auth_header.split(" ", 1)[1]

        jwt_secret = current_app.config.get("SUPABASE_JWT_SECRET")
        if not jwt_secret:
            current_app.logger.error("SUPABASE_JWT_SECRET is not configured")
            return jsonify({"error": "Server authentication is misconfigured"}), 500

        try:
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidAudienceError:
            return jsonify({"error": "Invalid token audience"}), 401
        except jwt.InvalidTokenError as exc:
            return jsonify({"error": f"Invalid token: {exc}"}), 401

        g.user_id = payload.get("sub")
        g.user_email = payload.get("email", "")

        if not g.user_id:
            return jsonify({"error": "Token is missing subject claim"}), 401

        return f(*args, **kwargs)

    return decorated
