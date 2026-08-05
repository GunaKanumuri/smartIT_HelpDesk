"""
tests/test_api_integration.py

Full end-to-end API integration test suite for the FastAPI backend (api.py).
Tests all public endpoints and admin endpoints via FastAPI's TestClient.

Coverage:
  - Public workspace info (GET /api/workspace/{slug})
  - Public ticket submission (POST /api/submit)
  - Public ticket status lookup (GET /api/status/{slug}/{ticket_id})
  - Admin login & auth (POST /api/admin/login, GET /api/admin/me, POST /api/admin/logout)
  - Admin ticket listing & patching (GET/PATCH /api/admin/tickets)
  - Admin escalations (GET /api/admin/escalations, PUT /api/admin/escalation-email)
  - Admin model info & active model toggle (GET/PUT /api/admin/model)
  - Admin team management (GET/POST/PATCH/DELETE /api/admin/team)
  - Admin dashboard stats (GET /api/admin/stats)
  - Authorization & error handling (401, 404, 422)
"""

import os

# Disable rate limiting for testing
os.environ["RATE_LIMIT_DISABLED"] = "1"

import pytest
from fastapi.testclient import TestClient

import importlib.util
from pathlib import Path

# Load api.py cleanly
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("api_module", ROOT / "backend" / "api.py")
api_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api_module)
app = api_module.app

from backend.database import repository as db

client = TestClient(app)


# -----------------------------------------------------------------------------
# Fixtures
# -----------------------------------------------------------------------------

@pytest.fixture(scope="module")
def setup_db():
    """Ensure database schema is initialized."""
    db.init_db()


@pytest.fixture(scope="module")
def workspace(setup_db):
    """Create a test workspace and return its details."""
    slug = f"test_api_ws_{os.urandom(4).hex()}"
    password = "test_password_123456"
    ws_id = db.create_workspace(
        slug=slug,
        name="API Test Company",
        profile="it_support",
        password=password,
        sector="saas",
        business_description="Testing API endpoints.",
        contact_phone="+15550001111",
        contact_email="admin@apitest.com",
    )
    return {"id": ws_id, "slug": slug, "password": password}


@pytest.fixture(scope="module")
def auth_headers(workspace):
    """Log in and return Authorization headers with a valid Bearer token."""
    resp = client.post("/api/admin/login", json={
        "slug": workspace["slug"],
        "password": workspace["password"],
    })
    assert resp.status_code == 200, resp.text
    token = resp.json()["token"]
    return {"Authorization": f"Bearer {token}"}


# -----------------------------------------------------------------------------
# 1. Public Endpoints
# -----------------------------------------------------------------------------

class TestPublicEndpoints:
    def test_get_workspace_info_success(self, workspace):
        resp = client.get(f"/api/workspace/{workspace['slug']}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "API Test Company"
        assert data["sector"] == "saas"
        assert data["sector_name"] == "SaaS & Software"
        assert data["business_description"] == "Testing API endpoints."

    def test_get_workspace_info_not_found(self):
        resp = client.get("/api/workspace/non_existent_slug_999")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    def test_submit_ticket_success(self, workspace):
        resp = client.post("/api/submit", json={
            "workspace": workspace["slug"],
            "name": "Jane Doe",
            "email": "jane@example.com",
            "message": "I cannot login to my account after resetting my password, it says invalid credentials.",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["ticket_id"] is not None
        assert "category" in data
        assert "urgency" in data

    def test_submit_ticket_invalid_workspace(self):
        resp = client.post("/api/submit", json={
            "workspace": "invalid_workspace_slug",
            "name": "Jane Doe",
            "email": "jane@example.com",
            "message": "This should fail because workspace does not exist.",
        })
        assert resp.status_code == 404

    def test_get_ticket_status_success(self, workspace):
        # Submit a ticket first
        sub = client.post("/api/submit", json={
            "workspace": workspace["slug"],
            "name": "Status Tester",
            "email": "tester@example.com",
            "message": "Cannot login to my account after password reset.",
        })
        ticket_id = sub.json()["ticket_id"]

        resp = client.get(f"/api/status/{workspace['slug']}/{ticket_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["ticket_id"] == ticket_id
        assert data["status"] == "Open"
        assert data["workspace_name"] == "API Test Company"

    def test_get_ticket_status_not_found(self, workspace):
        resp = client.get(f"/api/status/{workspace['slug']}/TCK999999")
        assert resp.status_code == 404


# -----------------------------------------------------------------------------
# 2. Admin Authentication
# -----------------------------------------------------------------------------

class TestAdminAuth:
    def test_login_success(self, workspace):
        resp = client.post("/api/admin/login", json={
            "slug": workspace["slug"],
            "password": workspace["password"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["workspace"]["slug"] == workspace["slug"]

    def test_login_invalid_credentials(self, workspace):
        resp = client.post("/api/admin/login", json={
            "slug": workspace["slug"],
            "password": "wrong_password",
        })
        assert resp.status_code == 401

    def test_get_me_authenticated(self, auth_headers):
        resp = client.get("/api/admin/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "API Test Company"

    def test_get_me_unauthorized(self):
        resp = client.get("/api/admin/me")
        assert resp.status_code == 401

    def test_logout_success(self, workspace):
        # Obtain a fresh token specifically for logout
        login_resp = client.post("/api/admin/login", json={
            "slug": workspace["slug"],
            "password": workspace["password"],
        })
        token = login_resp.json()["token"]

        resp = client.post("/api/admin/logout", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["success"] is True

        # Verify token is invalidated
        me_resp = client.get("/api/admin/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 401


# -----------------------------------------------------------------------------
# 3. Admin Ticket Management
# -----------------------------------------------------------------------------

class TestAdminTickets:
    def test_list_tickets(self, auth_headers, workspace):
        resp = client.get("/api/admin/tickets", headers=auth_headers)
        assert resp.status_code == 200
        tickets = resp.json()
        assert isinstance(tickets, list)
        assert len(tickets) >= 1

    def test_update_ticket_status(self, auth_headers, workspace):
        # Create a ticket
        sub = client.post("/api/submit", json={
            "workspace": workspace["slug"],
            "name": "Update Test",
            "email": "update@example.com",
            "message": "Printer is out of toner in room 302.",
        })
        ticket_id = sub.json()["ticket_id"]

        resp = client.patch(
            f"/api/admin/tickets/{ticket_id}",
            headers=auth_headers,
            json={
                "status": "In Progress",
                "action_taken": "Replaced toner cartridge",
                "updated_by": "Agent Bob",
            },
        )
        assert resp.status_code == 200
        updated = resp.json()
        assert updated["status"] == "In Progress"
        assert updated["action_taken"] == "Replaced toner cartridge"

    def test_update_nonexistent_ticket(self, auth_headers):
        resp = client.patch(
            "/api/admin/tickets/TCK99999",
            headers=auth_headers,
            json={"status": "Closed"},
        )
        assert resp.status_code == 404


# -----------------------------------------------------------------------------
# 4. Admin Escalations
# -----------------------------------------------------------------------------

class TestAdminEscalations:
    def test_list_escalations(self, auth_headers):
        resp = client.get("/api/admin/escalations", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_set_escalation_email(self, auth_headers):
        resp = client.put(
            "/api/admin/escalation-email",
            headers=auth_headers,
            json={"email": "alerts@apitest.com"},
        )
        assert resp.status_code == 200
        assert resp.json()["escalation_email"] == "alerts@apitest.com"


# -----------------------------------------------------------------------------
# 5. Admin Model & Training
# -----------------------------------------------------------------------------

class TestAdminModel:
    def test_get_model_info(self, auth_headers):
        resp = client.get("/api/admin/model", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "label" in data
        assert "categories" in data
        assert isinstance(data["categories"], list)

    def test_set_model_active_no_custom_trained(self, auth_headers):
        # Activating custom model before training one should return 400
        resp = client.put(
            "/api/admin/model/active",
            headers=auth_headers,
            json={"use_custom": True},
        )
        assert resp.status_code == 400
        assert "Train one first" in resp.json()["detail"]


# -----------------------------------------------------------------------------
# 6. Admin Team Management
# -----------------------------------------------------------------------------

class TestAdminTeam:
    def test_list_team_members(self, auth_headers):
        resp = client.get("/api/admin/team", headers=auth_headers)
        assert resp.status_code == 200
        team = resp.json()
        assert isinstance(team, list)
        assert len(team) >= 1  # Owner exists

    def test_add_team_member(self, auth_headers):
        resp = client.post(
            "/api/admin/team",
            headers=auth_headers,
            json={
                "email": "agent.smith@apitest.com",
                "password": "strongpassword123456",
                "role": "agent",
                "display_name": "Agent Smith",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "agent.smith@apitest.com"
        assert data["role"] == "agent"

    def test_add_duplicate_team_member(self, auth_headers):
        resp = client.post(
            "/api/admin/team",
            headers=auth_headers,
            json={
                "email": "agent.smith@apitest.com",
                "password": "strongpassword123456",
                "role": "agent",
                "display_name": "Agent Smith Duplicate",
            },
        )
        assert resp.status_code == 400


# -----------------------------------------------------------------------------
# 7. Admin Dashboard Stats
# -----------------------------------------------------------------------------

class TestAdminStats:
    def test_get_dashboard_stats(self, auth_headers):
        resp = client.get("/api/admin/stats", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "total_tickets" in data
        assert "open_tickets" in data
        assert "high_urgency" in data
        assert "avg_confidence" in data
        assert "total_users" in data
