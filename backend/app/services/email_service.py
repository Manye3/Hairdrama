"""Gmail SMTP email notification service.

Emails are sent in a background thread so the API response is not blocked.
"""

import logging
import smtplib
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from flask import current_app

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# HTML templates
# ---------------------------------------------------------------------------

_ASSIGNMENT_TEMPLATE = """\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4f6f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;">📋 New Task Assigned</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hi there,</p>
            <p style="margin:0 0 20px;color:#374151;font-size:16px;">You've been assigned a new task:</p>
            <table width="100%" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
              <tr>
                <td style="padding:20px 24px;">
                  <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">{title}</h2>
                  <p style="margin:0 0 12px;color:#6b7280;font-size:14px;">{description}</p>
                  <p style="margin:0;color:#6b7280;font-size:13px;">Assigned by <strong>{assigner_email}</strong></p>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">— TaskFlow Notifications</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""

_COMPLETION_TEMPLATE = """\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4f6f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#10b981);padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;">✅ Task Completed</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">Great news!</p>
            <p style="margin:0 0 20px;color:#374151;font-size:16px;">The following task has been marked as completed:</p>
            <table width="100%" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
              <tr>
                <td style="padding:20px 24px;">
                  <h2 style="margin:0 0 8px;color:#111827;font-size:18px;">{title}</h2>
                  <p style="margin:0 0 12px;color:#6b7280;font-size:14px;">{description}</p>
                  <p style="margin:0;color:#6b7280;font-size:13px;">Completed by <strong>{completer_email}</strong></p>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">— TaskFlow Notifications</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _send_email(app_config: dict, to_email: str, subject: str, html_body: str) -> None:
    """Send an email via Gmail SMTP. Intended to run in a background thread."""
    gmail_user = app_config.get("GMAIL_USER")
    gmail_password = app_config.get("GMAIL_APP_PASSWORD")

    if not gmail_user or not gmail_password:
        logger.warning("Gmail credentials not configured — skipping email to %s", to_email)
        return

    msg = MIMEMultipart("alternative")
    msg["From"] = gmail_user
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(gmail_user, gmail_password)
            server.sendmail(gmail_user, to_email, msg.as_string())
        logger.info("Email sent to %s — %s", to_email, subject)
    except Exception:
        logger.exception("Failed to send email to %s", to_email)


def _send_in_background(to_email: str, subject: str, html_body: str) -> None:
    """Dispatch ``_send_email`` in a daemon thread so the request is not blocked."""
    # Capture config snapshot from the current app context so the thread can
    # operate independently of the request lifecycle.
    config_snapshot = {
        "GMAIL_USER": current_app.config.get("GMAIL_USER"),
        "GMAIL_APP_PASSWORD": current_app.config.get("GMAIL_APP_PASSWORD"),
    }
    thread = threading.Thread(
        target=_send_email,
        args=(config_snapshot, to_email, subject, html_body),
        daemon=True,
    )
    thread.start()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def send_task_assignment_email(
    to_email: str,
    task_title: str,
    task_description: str,
    assigner_email: str,
) -> None:
    """Send a *task assigned* notification email."""
    subject = f"You've been assigned a new task: {task_title}"
    html = _ASSIGNMENT_TEMPLATE.format(
        title=task_title,
        description=task_description or "No description provided.",
        assigner_email=assigner_email,
    )
    _send_in_background(to_email, subject, html)


def send_task_completion_email(
    to_email: str,
    task_title: str,
    task_description: str,
    completer_email: str,
) -> None:
    """Send a *task completed* notification email."""
    subject = f"Task completed: {task_title}"
    html = _COMPLETION_TEMPLATE.format(
        title=task_title,
        description=task_description or "No description provided.",
        completer_email=completer_email,
    )
    _send_in_background(to_email, subject, html)
