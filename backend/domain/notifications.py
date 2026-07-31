"""
utils/notifications.py

Escalation notifications for High-urgency tickets. Every escalation is
always recorded in the database (see db.database.record_escalation) so
the admin dashboard has a full audit trail regardless of whether email
actually went out — that part is what makes this honestly demoable
without requiring real SMTP credentials.

Email is attempted only if:
  1. the workspace has an escalation_email configured, AND
  2. SMTP settings are present in the environment
     (TRIAGEIQ_SMTP_HOST, TRIAGEIQ_SMTP_PORT, TRIAGEIQ_SMTP_USER,
     TRIAGEIQ_SMTP_PASSWORD, TRIAGEIQ_SMTP_FROM)

Otherwise it degrades gracefully to a "logged" status with an honest
explanation, rather than pretending to have sent something. This is a
real, working code path for production (any SMTP provider — Gmail,
SendGrid, etc. — via env vars); it's just not wired to real credentials
in this environment.

Set EMAIL_ENABLED=0 (or omit the SMTP env vars) to keep email inactive
during development. Set EMAIL_ENABLED=1 with SMTP credentials to enable.
"""

import os
import smtplib
from email.message import EmailMessage

SMTP_ENV_VARS = (
    "TRIAGEIQ_SMTP_HOST",
    "TRIAGEIQ_SMTP_PORT",
    "TRIAGEIQ_SMTP_USER",
    "TRIAGEIQ_SMTP_PASSWORD",
    "TRIAGEIQ_SMTP_FROM",
)


def _smtp_configured() -> bool:
    """True only when email is explicitly enabled AND SMTP env vars are set."""
    enabled = os.environ.get("EMAIL_ENABLED", "0")
    if enabled not in ("1", "true", "True"):
        return False
    return all(os.environ.get(var) for var in SMTP_ENV_VARS)


def send_escalation(
    workspace_name: str,
    escalation_email: str | None,
    ticket_id: str,
    issue_text: str,
    category: str,
    reason: str = "high urgency",
) -> dict:
    """
    Attempts to notify about an escalated ticket. Always returns a dict
    describing what happened — never raises, since a notification
    failure shouldn't block ticket submission.

    Returns: {"channel": "email"|"none", "recipient": str|None,
              "status": "sent"|"failed"|"logged"|"not_configured",
              "detail": str}
    """
    if not escalation_email:
        return {
            "channel": "none",
            "recipient": None,
            "status": "not_configured",
            "detail": "No escalation email set for this workspace.",
        }

    subject = f"[TriageIQ] {reason.title()} — {workspace_name} — {ticket_id}"
    body = (
        f"Ticket {ticket_id} was flagged ({reason}).\n\n"
        f"Category: {category}\n"
        f"Message: {issue_text}\n"
    )

    if not _smtp_configured():
        return {
            "channel": "email",
            "recipient": escalation_email,
            "status": "logged",
            "detail": (
                f"Would email {escalation_email} in production — SMTP isn't "
                "configured in this environment (set TRIAGEIQ_SMTP_HOST etc.)."
            ),
        }

    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = os.environ["TRIAGEIQ_SMTP_FROM"]
        msg["To"] = escalation_email
        msg.set_content(body)

        with smtplib.SMTP(
            os.environ["TRIAGEIQ_SMTP_HOST"], int(os.environ["TRIAGEIQ_SMTP_PORT"]), timeout=5
        ) as server:
            server.starttls()
            server.login(os.environ["TRIAGEIQ_SMTP_USER"], os.environ["TRIAGEIQ_SMTP_PASSWORD"])
            server.send_message(msg)

        return {
            "channel": "email",
            "recipient": escalation_email,
            "status": "sent",
            "detail": f"Escalation email sent to {escalation_email}.",
        }
    except Exception as e:  # noqa: BLE001 — any SMTP failure degrades, doesn't crash the app
        return {
            "channel": "email",
            "recipient": escalation_email,
            "status": "failed",
            "detail": f"Email send failed: {e}",
        }
