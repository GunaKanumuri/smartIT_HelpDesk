# =============================================================================
# api.py
#
# FastAPI backend for TriageIQ's public-facing endpoints.
# Runs alongside Streamlit — public HTML pages call these endpoints.
#
# TABLE OF CONTENTS
# -----------------
# 1. IMPORTS & SETUP       — FastAPI app, CORS, database init
# 2. MODELS                — Pydantic request/response models
# 3. WORKSPACE ENDPOINTS   — Get workspace info by slug
# 4. TICKET SUBMISSION     — Public submit with full pipeline
# 5. TICKET STATUS         — Customer-facing status check
# =============================================================================

"""
api.py

FastAPI backend for TriageIQ public access. Provides three endpoints:

  GET  /api/workspace/{slug}              — workspace info for branding
  POST /api/submit                        — public ticket submission
  GET  /api/status/{slug}/{ticket_id}     — customer ticket status

Run with:  uvicorn api:app --port 8001 --reload
"""

# =============================================================================
# region 1. IMPORTS & SETUP
# =============================================================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import database as db
from db.database import (
    get_workspace_by_slug,
    init_db,
    insert_ticket,
)
from utils.active_model import resolve_active_model
from utils.duplicates import find_duplicate, should_escalate_for_repeats
from utils.notifications import send_escalation
from utils.relevance import check_relevance
from utils.sectors import get_sector_name
from utils.ticket_utils import classify_ticket
from utils.urgency import score_urgency

app = FastAPI(
    title="TriageIQ Public API",
    description="Public endpoints for ticket submission and status checking.",
    version="1.0.0",
)

# Allow cross-origin requests from public HTML pages
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
init_db()

# endregion

# =============================================================================
# region 2. MODELS
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
# region 3. WORKSPACE ENDPOINTS
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
# region 4. TICKET SUBMISSION
# =============================================================================


@app.post("/api/submit")
async def submit_ticket(submission: TicketSubmission):
    """
    Public ticket submission — runs the full pipeline:
      1. Validate workspace exists
      2. Relevance check (sector filter)
      3. ML classification
      4. Urgency scoring
      5. Duplicate detection
      6. Ticket creation
      7. Escalation if HIGH urgency
      8. Return ticket ID + confirmation
    """
    # 1. Validate workspace
    workspace = get_workspace_by_slug(submission.workspace)
    if not workspace:
        raise HTTPException(status_code=404, detail=f"Workspace '{submission.workspace}' not found.")

    workspace_dict = {
        "id": workspace["id"],
        "slug": workspace["slug"],
        "name": workspace["name"],
        "profile": workspace["profile"],
        "sector": workspace["sector"],
        "uses_custom_model": bool(workspace["uses_custom_model"]),
        "escalation_email": workspace["escalation_email"],
    }

    # 2. Relevance check
    relevance = check_relevance(
        submission.message,
        workspace["sector"],
        workspace["name"],
    )

    if not relevance["relevant"]:
        return IrrelevantResponse(
            success=False,
            relevant=False,
            message=relevance["response"],
            emergency=relevance.get("emergency", False),
            emergency_text=relevance.get("emergency_text"),
        )

    # 3. ML classification
    try:
        model, categories, accuracy, model_label, is_custom = resolve_active_model(workspace_dict)
        result = classify_ticket(submission.message, profile=workspace["profile"], model=model)
    except (FileNotFoundError, AttributeError) as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {e}")

    # 4. Urgency scoring
    urgency = score_urgency(submission.message, result["confidence"])

    # 5. Duplicate detection
    user_id = submission.name or "guest"
    candidates = db.get_recent_tickets_for_dedup(workspace["id"], user_id)
    duplicate = find_duplicate(submission.message, candidates)

    if duplicate:
        prospective_count = duplicate["duplicate_count"] + 1
        escalate = should_escalate_for_repeats(prospective_count)
        new_count = db.bump_duplicate(
            workspace["id"], duplicate["ticket_id"], escalate=escalate
        )

        if escalate:
            notify_result = send_escalation(
                workspace_name=workspace["name"],
                escalation_email=workspace["escalation_email"],
                ticket_id=duplicate["ticket_id"],
                issue_text=submission.message,
                category=result["category"],
                reason="repeated submissions",
            )
            db.record_escalation(
                workspace["id"], duplicate["ticket_id"], "repeated submissions",
                notify_result["channel"], notify_result["recipient"],
                notify_result["status"], notify_result["detail"],
            )

        return TicketResponse(
            success=True,
            duplicate=True,
            existing_ticket_id=duplicate["ticket_id"],
            category=result["category"],
            urgency="High" if escalate else urgency,
            message=(
                f"This matches an existing ticket {duplicate['ticket_id']} — "
                f"we've noted you've mentioned it {new_count}x."
            ),
        )

    # 6. Create ticket
    ticket_id = insert_ticket(
        workspace_id=workspace["id"],
        user_id=user_id,
        issue_description=submission.message,
        category=result["category"],
        confidence=result["confidence"],
        urgency=urgency,
        secondary_category=result["secondary_category"],
        secondary_confidence=result["secondary_confidence"],
        raw_category=result["raw_category"],
        user_email=submission.email,
    )

    # 7. Escalation if HIGH urgency
    if urgency == "High":
        notify_result = send_escalation(
            workspace_name=workspace["name"],
            escalation_email=workspace["escalation_email"],
            ticket_id=ticket_id,
            issue_text=submission.message,
            category=result["category"],
            reason="high urgency",
        )
        db.record_escalation(
            workspace["id"], ticket_id, "high urgency",
            notify_result["channel"], notify_result["recipient"],
            notify_result["status"], notify_result["detail"],
        )

    # 8. Return confirmation
    return TicketResponse(
        success=True,
        ticket_id=ticket_id,
        category=result["category"],
        urgency=urgency,
        message=f"Your issue has been logged. Ticket ID: {ticket_id}",
    )


# endregion

# =============================================================================
# region 5. TICKET STATUS
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
