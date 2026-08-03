"""Tests for Phase 1 role policy and workspace-user data safety."""

import pytest

from backend.security.access import has_permission, require_permission


@pytest.fixture
def db(tmp_path, monkeypatch):
    from backend.database import repository as db_module

    monkeypatch.setattr(db_module, "DB_PATH", tmp_path / "test.db")
    db_module.init_db()
    return db_module


def test_new_workspace_has_an_owner_account_and_audit_event(db):
    workspace_id = db.create_workspace(
        "acme", "Acme", "it_support", "a-secure-password", contact_email="owner@acme.test"
    )

    users = db.list_workspace_users(workspace_id)
    events = db.list_audit_events(workspace_id)

    assert len(users) == 1
    assert users[0]["email"] == "owner@acme.test"
    assert users[0]["role"] == "owner"
    assert events[0]["action"] == "workspace.created"


def test_workspace_users_are_isolated_and_can_be_deactivated(db):
    first_workspace = db.create_workspace("first", "First", "it_support", "a-secure-password")
    second_workspace = db.create_workspace("second", "Second", "it_support", "a-secure-password")
    agent_id = db.create_workspace_user(
        first_workspace, "agent@first.test", "another-secure-password", "agent", "First Agent"
    )

    assert len(db.list_workspace_users(first_workspace)) == 2
    assert len(db.list_workspace_users(second_workspace)) == 1
    assert db.set_workspace_user_active(first_workspace, agent_id, False) is True
    assert len(db.list_workspace_users(first_workspace)) == 1
    assert db.get_workspace_user(second_workspace, agent_id) is None


def test_owner_cannot_be_deactivated(db):
    workspace_id = db.create_workspace("acme", "Acme", "it_support", "a-secure-password")
    owner = db.list_workspace_users(workspace_id)[0]

    with pytest.raises(ValueError, match="owner"):
        db.set_workspace_user_active(workspace_id, owner["id"], False)


def test_role_permissions_are_central_and_restrict_viewers():
    assert has_permission("owner", "manage_users")
    assert has_permission("admin", "manage_workspace")
    assert has_permission("agent", "update_tickets")
    assert not has_permission("viewer", "update_tickets")

    with pytest.raises(PermissionError):
        require_permission("viewer", "manage_users")
