"""
tests/test_database.py

Uses a temporary SQLite file per test (via monkeypatching DB_PATH) so tests
never touch the real data/triageiq.db.
"""

import pytest


@pytest.fixture
def db(tmp_path, monkeypatch):
    from db import database as db_module
    monkeypatch.setattr(db_module, "DB_PATH", tmp_path / "test.db")
    db_module.init_db()
    return db_module


def test_init_db_creates_tables(db):
    ws_id = db.create_workspace("test-co", "Test Co", "it_support", "secret")
    assert db.ticket_count(ws_id) == 0


def test_create_workspace_rejects_duplicate_slug(db):
    db.create_workspace("acme", "Acme", "it_support", "pw1")
    with pytest.raises(ValueError):
        db.create_workspace("acme", "Acme Again", "customer_support", "pw2")


def test_authenticate_workspace_correct_password(db):
    db.create_workspace("acme", "Acme", "it_support", "correct-password")
    row = db.authenticate_workspace("acme", "correct-password")
    assert row is not None
    assert row["name"] == "Acme"


def test_authenticate_workspace_wrong_password(db):
    db.create_workspace("acme", "Acme", "it_support", "correct-password")
    row = db.authenticate_workspace("acme", "wrong-password")
    assert row is None


def test_authenticate_workspace_unknown_slug(db):
    row = db.authenticate_workspace("does-not-exist", "anything")
    assert row is None


def test_insert_ticket_returns_id(db):
    ws_id = db.create_workspace("acme", "Acme", "it_support", "pw")
    ticket_id = db.insert_ticket(
        workspace_id=ws_id, user_id="alice", issue_description="Wi-Fi drops",
        category="Network", confidence=0.91, urgency="Medium",
        secondary_category="Hardware", secondary_confidence=0.05,
    )
    assert ticket_id == "TCK1001"
    assert db.ticket_count(ws_id) == 1


def test_ticket_ids_increment_per_workspace(db):
    ws_id = db.create_workspace("acme", "Acme", "it_support", "pw")
    first = db.insert_ticket(ws_id, "alice", "issue one", "Software", 0.8, "Low")
    second = db.insert_ticket(ws_id, "bob", "issue two", "Hardware", 0.7, "Medium")
    assert first == "TCK1001"
    assert second == "TCK1002"


def test_ticket_ids_independent_across_workspaces(db):
    ws1 = db.create_workspace("acme-it", "Acme IT", "it_support", "pw1")
    ws2 = db.create_workspace("acme-shop", "Acme Shop", "customer_support", "pw2")
    t1 = db.insert_ticket(ws1, "alice", "issue one", "Software", 0.8, "Low")
    t2 = db.insert_ticket(ws2, "bob", "issue two", "Billing", 0.7, "Medium")
    assert t1 == "TCK1001"
    assert t2 == "TCK1001"  # independent numbering per workspace


def test_data_isolation_between_workspaces(db):
    ws1 = db.create_workspace("acme-it", "Acme IT", "it_support", "pw1")
    ws2 = db.create_workspace("acme-shop", "Acme Shop", "customer_support", "pw2")
    db.insert_ticket(ws1, "alice", "issue one", "Software", 0.8, "Low")
    db.insert_ticket(ws2, "bob", "issue two", "Billing", 0.7, "Medium")
    db.insert_ticket(ws2, "carol", "issue three", "Sales Inquiry", 0.6, "Low")

    assert len(db.get_all_tickets(ws1)) == 1
    assert len(db.get_all_tickets(ws2)) == 2


def test_insert_ticket_stores_raw_category_for_needs_review(db):
    ws_id = db.create_workspace("acme", "Acme", "customer_support", "pw")
    ticket_id = db.insert_ticket(
        ws_id, "alice", "I have neck pain", "Needs Review", 0.22, "Medium",
        raw_category="Sales Inquiry",
    )
    row = db.get_ticket(ws_id, ticket_id)
    assert row["category"] == "Needs Review"
    assert row["raw_category"] == "Sales Inquiry"


def test_set_escalation_email(db):
    ws_id = db.create_workspace("acme", "Acme", "it_support", "pw")
    assert db.get_workspace(ws_id)["escalation_email"] is None
    db.set_escalation_email(ws_id, "ops@acme.test")
    assert db.get_workspace(ws_id)["escalation_email"] == "ops@acme.test"


def test_get_recent_tickets_for_dedup_scoped_to_workspace_and_user(db):
    ws1 = db.create_workspace("acme-a", "Acme A", "it_support", "pw")
    ws2 = db.create_workspace("acme-b", "Acme B", "it_support", "pw")
    db.insert_ticket(ws1, "alice", "printer offline", "Hardware", 0.9, "Low")
    db.insert_ticket(ws1, "bob", "printer offline", "Hardware", 0.9, "Low")
    db.insert_ticket(ws2, "alice", "printer offline", "Hardware", 0.9, "Low")

    candidates = db.get_recent_tickets_for_dedup(ws1, "alice")
    assert len(candidates) == 1
    assert candidates[0]["issue_description"] == "printer offline"


def test_bump_duplicate_increments_count_and_can_escalate(db):
    ws_id = db.create_workspace("acme", "Acme", "it_support", "pw")
    ticket_id = db.insert_ticket(ws_id, "alice", "printer offline", "Hardware", 0.9, "Low")

    count = db.bump_duplicate(ws_id, ticket_id, escalate=False)
    assert count == 1
    row = db.get_ticket(ws_id, ticket_id)
    assert row["urgency"] == "Low"

    count = db.bump_duplicate(ws_id, ticket_id, escalate=True)
    assert count == 2
    row = db.get_ticket(ws_id, ticket_id)
    assert row["urgency"] == "High"


def test_record_and_get_escalations(db):
    ws_id = db.create_workspace("acme", "Acme", "it_support", "pw")
    ticket_id = db.insert_ticket(ws_id, "alice", "server is down", "Hardware", 0.9, "High")
    db.record_escalation(
        ws_id, ticket_id, "high urgency", "email", "ops@acme.test", "logged", "SMTP not configured"
    )
    rows = db.get_escalations(ws_id)
    assert len(rows) == 1
    assert rows[0]["ticket_id"] == ticket_id
    assert rows[0]["status"] == "logged"


def test_update_ticket_changes_status(db):
    ws_id = db.create_workspace("acme", "Acme", "it_support", "pw")
    ticket_id = db.insert_ticket(ws_id, "alice", "printer offline", "Hardware", 0.6, "Low")
    db.update_ticket(
        ws_id, ticket_id, status="Closed", action_taken="Replaced cable",
        updated_by="admin", reassigned_to="",
    )
    row = db.get_ticket(ws_id, ticket_id)
    assert row["status"] == "Closed"
    assert row["action_taken"] == "Replaced cable"


def test_update_ticket_does_not_leak_across_workspaces(db):
    ws1 = db.create_workspace("acme-it", "Acme IT", "it_support", "pw1")
    ws2 = db.create_workspace("acme-shop", "Acme Shop", "customer_support", "pw2")
    ticket_id = db.insert_ticket(ws1, "alice", "issue one", "Software", 0.8, "Low")

    # Attempting to update a ticket_id that only exists in ws1, scoped to ws2, should be a no-op
    db.update_ticket(ws2, ticket_id, status="Closed", action_taken="", updated_by="", reassigned_to="")
    row = db.get_ticket(ws1, ticket_id)
    assert row["status"] == "Open"  # untouched


def test_closing_ticket_stamps_resolved_at(db):
    ws_id = db.create_workspace("acme", "Acme", "it_support", "pw")
    ticket_id = db.insert_ticket(ws_id, "alice", "printer offline", "Hardware", 0.6, "Low")
    row = db.get_ticket(ws_id, ticket_id)
    assert row["resolved_at"] is None

    db.update_ticket(ws_id, ticket_id, status="Closed", action_taken="Fixed", updated_by="admin", reassigned_to="")
    row = db.get_ticket(ws_id, ticket_id)
    assert row["resolved_at"] is not None


def test_reopening_and_reclosing_does_not_overwrite_resolved_at(db):
    ws_id = db.create_workspace("acme", "Acme", "it_support", "pw")
    ticket_id = db.insert_ticket(ws_id, "alice", "printer offline", "Hardware", 0.6, "Low")

    db.update_ticket(ws_id, ticket_id, status="Closed", action_taken="Fixed", updated_by="admin", reassigned_to="")
    first_resolved_at = db.get_ticket(ws_id, ticket_id)["resolved_at"]

    db.update_ticket(ws_id, ticket_id, status="Open", action_taken="Reopened", updated_by="admin", reassigned_to="")
    db.update_ticket(ws_id, ticket_id, status="Closed", action_taken="Fixed again", updated_by="admin", reassigned_to="")
    second_resolved_at = db.get_ticket(ws_id, ticket_id)["resolved_at"]

    assert first_resolved_at == second_resolved_at
