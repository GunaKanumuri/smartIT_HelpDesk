# =============================================================================
# services/ticket_pipeline.py
#
# Shared ticket-submission pipeline used by both the Streamlit chat UI
# (app.py) and the FastAPI public endpoint (api.py) — one implementation
# of relevance -> classify -> urgency -> dedupe -> insert -> escalate, so
# the two entry points can't quietly drift apart.
#
# TABLE OF CONTENTS
# -----------------
# 1. IMPORTS               — Dependencies
# 2. PIPELINE               — submit_ticket() — the shared sequence
# =============================================================================

"""
services/ticket_pipeline.py

Runs a single message through the full TriageIQ pipeline and returns a
plain dict describing what happened. Callers (Streamlit, FastAPI) are
responsible for turning that dict into UI/response output — this module
has no opinion about how the result gets displayed.

Return shape (`outcome` is always one of "irrelevant" | "duplicate" | "created"):

  irrelevant:
    {"outcome": "irrelevant", "relevance": <dict from check_relevance>}

  duplicate:
    {"outcome": "duplicate", "ticket_id": str, "category": str,
     "duplicate_count": int, "escalated": bool, "urgency": str,
     "notify_result": dict | None, "relevance": dict}

  created:
    {"outcome": "created", "ticket_id": str, "category": str,
     "confidence": float, "secondary_category": str | None,
     "secondary_confidence": float | None, "out_of_scope": bool,
     "urgency": str, "escalated": bool, "notify_result": dict | None,
     "is_custom_model": bool, "relevance": dict}

Raises FileNotFoundError or AttributeError if the workspace's model
can't be loaded or is incompatible with the installed scikit-learn
version — callers decide how to present that (Streamlit shows a fix-it
message, FastAPI raises a 500).

`workspace` must be a dict with at least: id, slug, name, profile,
sector, uses_custom_model, escalation_email.
"""

# =============================================================================
# region 1. IMPORTS
# =============================================================================

from backend.database import repository as db
from backend.domain.active_model import resolve_active_model
from backend.domain.duplicates import find_duplicate, should_escalate_for_repeats
from backend.domain.notifications import send_escalation
from backend.domain.relevance import check_relevance
from backend.domain.ticket_utils import classify_ticket
from backend.domain.urgency import score_urgency

# endregion

# =============================================================================
# region 2. PIPELINE
# =============================================================================


def submit_ticket(workspace: dict, message: str, user_id: str = "guest", user_email: str = "") -> dict:
    """Run one message through the full pipeline. See module docstring for the return shape."""
    user_id = user_id or "guest"

    # 1. Relevance check — catches messages unrelated to the business's sector
    relevance = check_relevance(message, workspace.get("sector", "other"), workspace["name"])
    if not relevance["relevant"]:
        return {"outcome": "irrelevant", "relevance": relevance}

    # 2. ML classification — raises FileNotFoundError/AttributeError on model
    #    trouble; that's the caller's problem to present, not ours to swallow.
    model, categories, accuracy, model_label, is_custom = resolve_active_model(workspace)
    # Fall back to sector if profile is empty (new signups don't set profile)
    profile = workspace.get("profile") or workspace.get("sector", "other")
    result = classify_ticket(message, profile=profile, model=model)

    # 3. Urgency scoring
    urgency = score_urgency(message, result["confidence"])

    # 4. Duplicate detection
    candidates = db.get_recent_tickets_for_dedup(workspace["id"], user_id)
    duplicate = find_duplicate(message, candidates)

    if duplicate:
        prospective_count = duplicate["duplicate_count"] + 1
        escalate = should_escalate_for_repeats(prospective_count)
        new_count = db.bump_duplicate(workspace["id"], duplicate["ticket_id"], escalate=escalate)

        notify_result = None
        if escalate:
            notify_result = send_escalation(
                workspace_name=workspace["name"],
                escalation_email=workspace.get("escalation_email"),
                ticket_id=duplicate["ticket_id"],
                issue_text=message,
                category=result["category"],
                reason="repeated submissions",
            )
            db.record_escalation(
                workspace["id"], duplicate["ticket_id"], "repeated submissions",
                notify_result["channel"], notify_result["recipient"],
                notify_result["status"], notify_result["detail"],
            )

        return {
            "outcome": "duplicate",
            "ticket_id": duplicate["ticket_id"],
            "category": result["category"],
            "duplicate_count": new_count,
            "escalated": escalate,
            "urgency": "High" if escalate else urgency,
            "notify_result": notify_result,
            "relevance": relevance,
        }

    # 5. Create ticket
    ticket_id = db.insert_ticket(
        workspace_id=workspace["id"],
        user_id=user_id,
        issue_description=message,
        category=result["category"],
        confidence=result["confidence"],
        urgency=urgency,
        secondary_category=result["secondary_category"],
        secondary_confidence=result["secondary_confidence"],
        raw_category=result["raw_category"],
        user_email=user_email,
    )

    # 6. Escalate if high urgency
    notify_result = None
    if urgency == "High":
        notify_result = send_escalation(
            workspace_name=workspace["name"],
            escalation_email=workspace.get("escalation_email"),
            ticket_id=ticket_id,
            issue_text=message,
            category=result["category"],
            reason="high urgency",
        )
        db.record_escalation(
            workspace["id"], ticket_id, "high urgency",
            notify_result["channel"], notify_result["recipient"],
            notify_result["status"], notify_result["detail"],
        )

    return {
        "outcome": "created",
        "ticket_id": ticket_id,
        "category": result["category"],
        "confidence": result["confidence"],
        "secondary_category": result["secondary_category"],
        "secondary_confidence": result["secondary_confidence"],
        "out_of_scope": result["out_of_scope"],
        "urgency": urgency,
        "escalated": urgency == "High",
        "notify_result": notify_result,
        "is_custom_model": is_custom,
        "relevance": relevance,
    }


# endregion
