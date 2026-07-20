"""
tests/test_notifications.py

Tests the escalation notification degrade path (no escalation email set,
no SMTP configured) without making any real network calls. Real SMTP
sending is exercised implicitly by code review, not tested here — it
would require live credentials.
"""

from utils.notifications import send_escalation


def test_send_escalation_not_configured_without_email():
    result = send_escalation(
        workspace_name="Acme", escalation_email=None,
        ticket_id="TCK1001", issue_text="server is down", category="Hardware",
    )
    assert result["status"] == "not_configured"
    assert result["channel"] == "none"


def test_send_escalation_logs_when_smtp_not_configured(monkeypatch):
    for var in (
        "TRIAGEIQ_SMTP_HOST", "TRIAGEIQ_SMTP_PORT", "TRIAGEIQ_SMTP_USER",
        "TRIAGEIQ_SMTP_PASSWORD", "TRIAGEIQ_SMTP_FROM",
    ):
        monkeypatch.delenv(var, raising=False)

    result = send_escalation(
        workspace_name="Acme", escalation_email="ops@acme.test",
        ticket_id="TCK1001", issue_text="server is down", category="Hardware",
    )
    assert result["status"] == "logged"
    assert result["channel"] == "email"
    assert result["recipient"] == "ops@acme.test"
    assert "SMTP" in result["detail"]


def test_send_escalation_never_raises_on_bad_smtp_config(monkeypatch):
    monkeypatch.setenv("TRIAGEIQ_SMTP_HOST", "smtp.invalid.example")
    monkeypatch.setenv("TRIAGEIQ_SMTP_PORT", "587")
    monkeypatch.setenv("TRIAGEIQ_SMTP_USER", "user")
    monkeypatch.setenv("TRIAGEIQ_SMTP_PASSWORD", "pw")
    monkeypatch.setenv("TRIAGEIQ_SMTP_FROM", "noreply@acme.test")

    result = send_escalation(
        workspace_name="Acme", escalation_email="ops@acme.test",
        ticket_id="TCK1001", issue_text="server is down", category="Hardware",
    )
    assert result["status"] == "failed"
    assert "detail" in result
