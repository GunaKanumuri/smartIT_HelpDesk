# =============================================================================
# api.py
#
# FastAPI backend for TriageIQ. Two groups of endpoints:
#   - Public: called by the public HTML pages / embed widget, no auth.
#   - Admin: called by the React admin frontend, requires a bearer token
#     issued by /api/admin/login.
#
# TABLE OF CONTENTS
# -----------------
# 1. IMPORTS & SETUP        — FastAPI app, CORS, database init
# 2. PUBLIC MODELS          — Pydantic models for public endpoints
# 3. ADMIN MODELS           — Pydantic models for admin endpoints
# 4. ADMIN AUTH DEPENDENCY  — Bearer-token -> workspace resolution
# 5. WORKSPACE ENDPOINTS    — Public: get workspace info by slug
# 6. TICKET SUBMISSION      — Public: submit via the shared pipeline
# 7. TICKET STATUS          — Public: customer-facing status check
# 8. ADMIN AUTH ENDPOINTS   — Login, logout, session check
# 9. ADMIN TICKET ENDPOINTS — List and update tickets
# 10. ADMIN ESCALATIONS     — Escalation history + email settings
# 11. ADMIN MODEL & TRAINING — Model info, toggle active model, upload+train
# =============================================================================

"""
api.py

FastAPI backend for TriageIQ.

Public endpoints (no auth):
  GET  /api/workspace/{slug}              — workspace info for branding
  POST /api/submit                        — public ticket submission
  GET  /api/status/{slug}/{ticket_id}     — customer ticket status

Admin endpoints (bearer token from /api/admin/login):
  POST  /api/admin/login
  POST  /api/admin/logout
  GET   /api/admin/me
  GET   /api/admin/tickets
  PATCH /api/admin/tickets/{ticket_id}
  GET   /api/admin/escalations
  PUT   /api/admin/escalation-email
  GET   /api/admin/model
  PUT   /api/admin/model/active
  POST  /api/admin/train

Run with:  uvicorn api:app --port 8001 --reload
"""

# =============================================================================
# region 1. IMPORTS & SETUP
# =============================================================================

import io

import pandas as pd
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.database import repository as db
from backend.database.repository import get_workspace_by_slug, init_db
from backend.services import admin_operations as admin_ops
from backend.services.ticket_pipeline import submit_ticket
from backend.security.access import require_permission
from backend.security.rate_limit import rate_limit
from backend.domain.sectors import get_sector_name

app = FastAPI(
    title="TriageIQ API",
    description="Public ticket-submission endpoints, plus an authenticated admin API.",
    version="1.1.0",
)

# Public endpoints are unauthenticated and cookie-free (slug + ticket ID
# only), so a permissive origin list is fine — but that's exactly why
# allow_credentials must stay False. allow_origins=["*"] + allow_credentials
# =True is a spec-invalid combination browsers reject anyway. The admin
# router below carries its own auth via a bearer token, not cookies, so it
# doesn't need credentialed CORS either — no separate middleware required.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NOTE: a static mount for a pre-Next.js "frontend/landing" HTML folder
# used to live here. That folder was never migrated when the landing page
# moved to frontend/src/app/page.tsx (Next.js), and nothing in the
# frontend references the old /landing path — so the mount just crashed
# app startup with a missing-directory error. Removed rather than papered
# over; if a server-rendered static landing page is needed again later,
# point StaticFiles at wherever that HTML actually lives.

# Initialize database on startup
init_db()

# endregion

# =============================================================================
# region 2. PUBLIC MODELS
# =============================================================================


class TicketSubmission(BaseModel):
    """Request body for submitting a ticket via the public form."""
    workspace: str        # workspace slug
    name: str = "guest"   # submitter's name
    email: str = ""       # submitter's email (optional)
    message: str          # the issue description


class TicketResponse(BaseModel):
    """Response after successful ticket submission."""
    success: bool
    ticket_id: str | None = None
    category: str | None = None
    urgency: str | None = None
    message: str
    duplicate: bool = False
    existing_ticket_id: str | None = None


class WorkspaceInfo(BaseModel):
    """Public workspace info for branding the public form."""
    name: str
    sector: str
    sector_name: str
    business_description: str
    contact_phone: str
    contact_email: str


class TicketStatus(BaseModel):
    """Customer-facing ticket status — limited info, no internal data."""
    ticket_id: str
    status: str
    category: str
    urgency: str
    created_at: str
    workspace_name: str


class IrrelevantResponse(BaseModel):
    """Response when a message is flagged as irrelevant to the business."""
    success: bool = False
    relevant: bool = False
    message: str
    emergency: bool = False
    emergency_text: str | None = None


# endregion

# =============================================================================
# region 3. ADMIN MODELS
# =============================================================================


class AdminLoginRequest(BaseModel):
    slug: str
    password: str


class WorkspaceAdminInfo(BaseModel):
    """Full workspace info for the authenticated admin — includes settings
    a public caller should never see (escalation email, custom-model flag)."""
    id: int
    slug: str
    name: str
    profile: str
    sector: str
    business_description: str
    contact_phone: str
    contact_email: str
    uses_custom_model: bool
    escalation_email: str | None = None


class AdminLoginResponse(BaseModel):
    token: str
    workspace: WorkspaceAdminInfo


class TicketOut(BaseModel):
    ticket_id: str
    created_at: str
    updated_at: str
    resolved_at: str | None = None
    user_id: str
    user_email: str
    issue_description: str
    category: str
    confidence: float
    secondary_category: str | None = None
    secondary_confidence: float | None = None
    raw_category: str | None = None
    urgency: str
    status: str
    action_taken: str
    updated_by: str
    reassigned_to: str
    duplicate_count: int
    last_duplicate_at: str | None = None


class TicketUpdateRequest(BaseModel):
    status: str
    action_taken: str = ""
    updated_by: str = ""
    reassigned_to: str = ""


class EscalationOut(BaseModel):
    ticket_id: str
    created_at: str
    reason: str
    channel: str
    recipient: str | None = None
    status: str
    detail: str | None = None


class EscalationEmailRequest(BaseModel):
    email: str | None = None


class ModelInfo(BaseModel):
    """Currently active model + what custom-training options are available."""
    label: str
    categories: list[str]
    accuracy: float | None = None
    is_custom_active: bool
    has_custom_model: bool
    custom_metrics: dict | None = None


class ModelActiveRequest(BaseModel):
    use_custom: bool


class TrainMetrics(BaseModel):
    workspace_slug: str
    test_accuracy: float
    evaluation_method: str
    classification_report: dict
    n_samples: int
    categories: list[str]


class SignupRequest(BaseModel):
    slug: str
    name: str
    profile: str
    password: str
    sector: str = "other"
    business_description: str = ""
    contact_phone: str = ""
    contact_email: str = ""


class TeamUserOut(BaseModel):
    id: int
    workspace_id: int
    email: str
    display_name: str
    role: str
    is_active: int
    created_at: str
    last_login_at: str | None = None


class AddTeamMemberRequest(BaseModel):
    email: str
    password: str
    role: str = "agent"
    display_name: str = ""


class UpdateTeamMemberRequest(BaseModel):
    role: str | None = None
    is_active: bool | None = None


class DashboardStatsOut(BaseModel):
    total_tickets: int
    open_tickets: int
    high_urgency: int
    needs_review: int
    avg_confidence: float
    total_users: int


# endregion

# =============================================================================
# region 4. ADMIN AUTH DEPENDENCY
# =============================================================================


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    return authorization.split(" ", 1)[1].strip() or None


async def get_current_workspace(authorization: str | None = Header(default=None)):
    """
    FastAPI dependency: resolves the bearer token in the Authorization
    header to a workspace row. Every admin endpoint depends on this —
    workspace_id always comes from the verified session, never from a
    client-supplied field, so cross-tenant access isn't possible even
    if someone forges a request body.
    """
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header.")
    workspace = db.get_workspace_by_session(token)
    if not workspace:
        raise HTTPException(status_code=401, detail="Session expired or invalid — please log in again.")
    # Convert sqlite3.Row -> dict so downstream code can use both
    # row["col"] access and dict .get() (e.g. workspace.get("session_user_id")).
    return dict(workspace)


def require_workspace_permission(permission: str):
    """FastAPI dependency factory for role-based workspace authorization."""
    async def dependency(workspace=Depends(get_current_workspace)):
        try:
            require_permission(workspace["session_role"], permission)
        except PermissionError:
            raise HTTPException(
                status_code=403,
                detail="Your account does not have permission for this action.",
            )
        return workspace
    return dependency


def _workspace_admin_info(workspace) -> WorkspaceAdminInfo:
    return WorkspaceAdminInfo(
        id=workspace["id"],
        slug=workspace["slug"],
        name=workspace["name"],
        profile=workspace["profile"],
        sector=workspace["sector"],
        business_description=workspace["business_description"] or "",
        contact_phone=workspace["contact_phone"] or "",
        contact_email=workspace["contact_email"] or "",
        uses_custom_model=bool(workspace["uses_custom_model"]),
        escalation_email=workspace["escalation_email"],
    )


def _workspace_pipeline_dict(workspace) -> dict:
    """Shape expected by services.ticket_pipeline.submit_ticket()."""
    return {
        "id": workspace["id"],
        "slug": workspace["slug"],
        "name": workspace["name"],
        "profile": workspace["profile"],
        "sector": workspace["sector"],
        "uses_custom_model": bool(workspace["uses_custom_model"]),
        "escalation_email": workspace["escalation_email"],
    }


# endregion

# =============================================================================
# region 5. WORKSPACE ENDPOINTS (public)
# =============================================================================


@app.get("/api/workspace/{slug}", response_model=WorkspaceInfo)
async def get_workspace_info(slug: str):
    """
    Get public workspace info by slug — used by the public form to show
    the client's business name, sector, and contact info. No sensitive data.
    """
    workspace = get_workspace_by_slug(slug)
    if not workspace:
        raise HTTPException(status_code=404, detail=f"Workspace '{slug}' not found.")

    return WorkspaceInfo(
        name=workspace["name"],
        sector=workspace["sector"],
        sector_name=get_sector_name(workspace["sector"]),
        business_description=workspace["business_description"] or "",
        contact_phone=workspace["contact_phone"] or "",
        contact_email=workspace["contact_email"] or "",
    )


# endregion

# =============================================================================
# region 6. TICKET SUBMISSION (public)
# =============================================================================


@app.post("/api/submit")
async def submit_ticket_endpoint(
    submission: TicketSubmission,
    _rl=Depends(rate_limit("submit", max_requests=20, window_seconds=60)),
):
    """Public ticket submission — delegates to the shared pipeline used by app.py."""
    workspace = get_workspace_by_slug(submission.workspace)
    if not workspace:
        raise HTTPException(status_code=404, detail=f"Workspace '{submission.workspace}' not found.")

    try:
        result = submit_ticket(
            workspace=_workspace_pipeline_dict(workspace),
            message=submission.message,
            user_id=submission.name,
            user_email=submission.email,
        )
    except (FileNotFoundError, AttributeError) as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {e}")

    if result["outcome"] == "irrelevant":
        relevance = result["relevance"]
        return IrrelevantResponse(
            success=False,
            relevant=False,
            message=relevance["response"],
            emergency=relevance.get("emergency", False),
            emergency_text=relevance.get("emergency_text"),
        )

    if result["outcome"] == "duplicate":
        return TicketResponse(
            success=True,
            duplicate=True,
            existing_ticket_id=result["ticket_id"],
            category=result["category"],
            urgency=result["urgency"],
            message=(
                f"This matches an existing ticket {result['ticket_id']} — "
                f"we've noted you've mentioned it {result['duplicate_count']}x."
            ),
        )

    # outcome == "created"
    return TicketResponse(
        success=True,
        ticket_id=result["ticket_id"],
        category=result["category"],
        urgency=result["urgency"],
        message=f"Your issue has been logged. Ticket ID: {result['ticket_id']}",
    )


# endregion

# =============================================================================
# region 7. TICKET STATUS (public)
# =============================================================================


@app.get("/api/status/{slug}/{ticket_id}", response_model=TicketStatus)
async def get_ticket_status(slug: str, ticket_id: str):
    """
    Customer-facing ticket status — returns only what a customer should see.
    No confidence scores, no admin notes, no internal data.
    """
    workspace = get_workspace_by_slug(slug)
    if not workspace:
        raise HTTPException(status_code=404, detail=f"Workspace '{slug}' not found.")

    ticket = db.get_ticket(workspace["id"], ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=404,
            detail=f"Ticket '{ticket_id}' not found in workspace '{slug}'.",
        )

    return TicketStatus(
        ticket_id=ticket["ticket_id"],
        status=ticket["status"],
        category=ticket["category"],
        urgency=ticket["urgency"],
        created_at=ticket["created_at"],
        workspace_name=workspace["name"],
    )


# endregion

# =============================================================================
# region 8. ADMIN AUTH ENDPOINTS
# =============================================================================


@app.post("/api/admin/login", response_model=AdminLoginResponse)
async def admin_login(
    body: AdminLoginRequest,
    _rl=Depends(rate_limit("login", max_requests=10, window_seconds=60)),
):
    db.delete_expired_sessions()  # cheap housekeeping, piggybacks on login traffic
    workspace = db.authenticate_workspace(body.slug.strip(), body.password)
    if not workspace:
        raise HTTPException(status_code=401, detail="Incorrect workspace ID or password.")
    token = db.create_session(workspace["id"])
    return AdminLoginResponse(token=token, workspace=_workspace_admin_info(workspace))


@app.post("/api/admin/logout")
async def admin_logout(authorization: str | None = Header(default=None)):
    """Invalidates the token if present. Always succeeds — logout isn't
    something a client should ever see fail."""
    token = _extract_bearer_token(authorization)
    if token:
        db.delete_session(token)
    return {"success": True}


@app.get("/api/admin/me", response_model=WorkspaceAdminInfo)
async def admin_me(workspace=Depends(get_current_workspace)):
    """Lets the React app rehydrate a session on page load without re-prompting for a password."""
    return _workspace_admin_info(workspace)


# endregion

# =============================================================================
# region 9. ADMIN TICKET ENDPOINTS
# =============================================================================


@app.get("/api/admin/tickets", response_model=list[TicketOut])
async def list_tickets(workspace=Depends(require_workspace_permission("view_tickets"))):
    """Returns all tickets for the authenticated workspace. Filtering/sorting
    happens client-side, matching the existing admin dashboard's behavior."""
    rows = admin_ops.list_tickets(workspace["id"])
    return [TicketOut(**dict(r)) for r in rows]


@app.patch("/api/admin/tickets/{ticket_id}", response_model=TicketOut)
async def update_ticket_endpoint(
    ticket_id: str, body: TicketUpdateRequest,
    workspace=Depends(require_workspace_permission("update_tickets")),
):
    updated = admin_ops.update_ticket(
        workspace_id=workspace["id"],
        ticket_id=ticket_id,
        status=body.status,
        action_taken=body.action_taken,
        updated_by=body.updated_by,
        reassigned_to=body.reassigned_to,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Ticket '{ticket_id}' not found.")
    return TicketOut(**dict(updated))


# endregion

# =============================================================================
# region 10. ADMIN ESCALATIONS
# =============================================================================


@app.get("/api/admin/escalations", response_model=list[EscalationOut])
async def list_escalations(workspace=Depends(require_workspace_permission("view_audit"))):
    rows = admin_ops.list_escalations(workspace["id"])
    return [EscalationOut(**dict(r)) for r in rows]


@app.put("/api/admin/escalation-email")
async def set_escalation_email_endpoint(
    body: EscalationEmailRequest,
    workspace=Depends(require_workspace_permission("manage_workspace")),
):
    email = admin_ops.set_escalation_email(workspace["id"], body.email)
    return {"success": True, "escalation_email": email}


# endregion

# =============================================================================
# region 11. ADMIN MODEL & TRAINING
# =============================================================================


@app.get("/api/admin/model", response_model=ModelInfo)
async def get_model_info(workspace=Depends(require_workspace_permission("view_tickets"))):
    info = admin_ops.get_model_info(_workspace_pipeline_dict(workspace))
    return ModelInfo(**info)


@app.put("/api/admin/model/active")
async def set_model_active(
    body: ModelActiveRequest,
    workspace=Depends(require_workspace_permission("manage_workspace")),
):
    try:
        admin_ops.set_model_active(workspace["id"], workspace["slug"], body.use_custom)
    except admin_ops.NoCustomModelError as e:
        raise HTTPException(status_code=400, detail=f"{e} Train one first via /api/admin/train.")
    return {"success": True, "uses_custom_model": body.use_custom}


@app.post("/api/admin/train", response_model=TrainMetrics)
async def train_model_endpoint(
    file: UploadFile = File(...),
    workspace=Depends(require_workspace_permission("manage_workspace")),
):
    contents = await file.read()
    try:
        upload_df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Couldn't read that file as a CSV: {e}")

    is_valid, message, metrics = admin_ops.train_model(workspace["slug"], upload_df)
    if not is_valid:
        raise HTTPException(status_code=422, detail=message)

    return TrainMetrics(**metrics)


# endregion

# =============================================================================
# region 12. SIGNUP (public, no auth required)
# =============================================================================


@app.post("/api/admin/signup", response_model=AdminLoginResponse)
async def admin_signup(
    body: SignupRequest,
    _rl=Depends(rate_limit("signup", max_requests=10, window_seconds=3600)),
):
    """Create a new workspace and auto-login (single step, no extra round-trip)."""
    try:
        workspace_id = db.create_workspace(
            slug=body.slug,
            name=body.name,
            profile=body.profile,
            password=body.password,
            sector=body.sector,
            business_description=body.business_description,
            contact_phone=body.contact_phone,
            contact_email=body.contact_email,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    workspace = db.get_workspace(workspace_id)
    token = db.create_session(workspace_id)
    return AdminLoginResponse(token=token, workspace=_workspace_admin_info(workspace))


# endregion

# =============================================================================
# region 13. ADMIN TEAM MANAGEMENT
# =============================================================================


@app.get("/api/admin/team", response_model=list[TeamUserOut])
async def list_team(workspace=Depends(require_workspace_permission("view_tickets"))):
    rows = db.list_workspace_users(workspace["id"])
    return [TeamUserOut(**dict(r)) for r in rows]


@app.post("/api/admin/team", response_model=TeamUserOut)
async def add_team_member(
    body: AddTeamMemberRequest,
    workspace=Depends(require_workspace_permission("manage_users")),
):
    try:
        user_id = db.create_workspace_user(
            workspace_id=workspace["id"],
            email=body.email,
            password=body.password,
            role=body.role,
            display_name=body.display_name,
            actor_user_id=workspace.get("session_user_id"),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    user = db.get_workspace_user(workspace["id"], user_id)
    return TeamUserOut(**dict(user))


@app.patch("/api/admin/team/{user_id}")
async def update_team_member(
    user_id: int,
    body: UpdateTeamMemberRequest,
    workspace=Depends(require_workspace_permission("manage_users")),
):
    if body.is_active is not None:
        try:
            db.set_workspace_user_active(
                workspace_id=workspace["id"],
                user_id=user_id,
                active=body.is_active,
                actor_user_id=workspace.get("session_user_id"),
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    return {"success": True}


@app.delete("/api/admin/team/{user_id}")
async def remove_team_member(
    user_id: int,
    workspace=Depends(require_workspace_permission("manage_users")),
):
    # Soft-delete: deactivate instead of hard delete
    try:
        db.set_workspace_user_active(
            workspace_id=workspace["id"],
            user_id=user_id,
            active=False,
            actor_user_id=workspace.get("session_user_id"),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"success": True}


# endregion

# =============================================================================
# region 14. ADMIN STATS
# =============================================================================


@app.get("/api/admin/stats", response_model=DashboardStatsOut)
async def get_dashboard_stats(workspace=Depends(require_workspace_permission("view_tickets"))):
    tickets = db.get_all_tickets(workspace["id"])
    users = db.list_workspace_users(workspace["id"])

    total = len(tickets)
    open_count = sum(1 for t in tickets if t["status"] == "Open")
    high_count = sum(1 for t in tickets if t["urgency"] == "High")
    needs_review = sum(1 for t in tickets if t["category"] == "Needs Review")
    avg_conf = (sum(t["confidence"] for t in tickets) / total) if total > 0 else 0.0

    return DashboardStatsOut(
        total_tickets=total,
        open_tickets=open_count,
        high_urgency=high_count,
        needs_review=needs_review,
        avg_confidence=round(avg_conf, 4),
        total_users=len(users),
    )


# endregion

# =============================================================================
# region 15. PASSWORD RESET (feature-flagged — disabled by default)
# =============================================================================

import os as _os

_PW_RESET_ENABLED = _os.environ.get("SEVAK_AI_ENABLE_PASSWORD_RESET", "false").lower() == "true"


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


# In-memory token store for password resets (replace with DB in production)
_reset_tokens: dict[str, dict] = {}
import secrets as _secrets
from datetime import datetime as _dt, timedelta as _td


@app.post("/api/auth/forgot-password")
async def forgot_password(
    body: ForgotPasswordRequest,
    _rl=Depends(rate_limit("forgot-password", max_requests=5, window_seconds=300)),
):
    """Accepts email, generates reset token. Only active when SEVAK_AI_ENABLE_PASSWORD_RESET=true.
    Always returns 200 to prevent email enumeration."""
    if not _PW_RESET_ENABLED:
        raise HTTPException(status_code=404, detail="Not available")

    # Find user by email across all workspaces
    user = None
    with db.get_connection() as conn:
        user = conn.execute(
            "SELECT id, workspace_id, email FROM workspace_users WHERE email = ? AND is_active = 1",
            (body.email.strip().lower(),),
        ).fetchone()

    if user:
        token = _secrets.token_urlsafe(32)
        _reset_tokens[token] = {
            "user_id": user["id"],
            "workspace_id": user["workspace_id"],
            "email": user["email"],
            "expires_at": _dt.now() + _td(hours=1),
        }
        # In dev mode, log the reset link so we can test
        reset_link = f"http://localhost:3000/reset-password/{token}"
        print(f"\n🔐 PASSWORD RESET LINK: {reset_link}\n")

    return {"success": True, "message": "If that email exists, a reset link has been sent."}


@app.post("/api/auth/reset-password")
async def reset_password(
    body: ResetPasswordRequest,
    _rl=Depends(rate_limit("reset-password", max_requests=10, window_seconds=300)),
):
    """Resets password using a valid token. Only active when SEVAK_AI_ENABLE_PASSWORD_RESET=true."""
    if not _PW_RESET_ENABLED:
        raise HTTPException(status_code=404, detail="Not available")

    token_data = _reset_tokens.get(body.token)
    if not token_data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    if _dt.now() > token_data["expires_at"]:
        del _reset_tokens[body.token]
        raise HTTPException(status_code=400, detail="Token has expired. Request a new one.")

    # Update password
    password_hash, salt = db._hash_password(body.password)
    with db.get_connection() as conn:
        conn.execute(
            "UPDATE workspace_users SET password_hash = ?, password_salt = ? WHERE id = ?",
            (password_hash, salt, token_data["user_id"]),
        )
        # Invalidate all sessions for this workspace
        conn.execute(
            "DELETE FROM admin_sessions WHERE workspace_id = ?",
            (token_data["workspace_id"],),
        )

    del _reset_tokens[body.token]
    return {"success": True, "message": "Password reset successfully. Please log in again."}


# endregion
