# =============================================================================
# services/admin_operations.py
#
# Shared admin operations used by both the Streamlit admin page
# (pages/1_Admin_Dashboard.py) and the FastAPI admin endpoints (api.py) —
# one implementation of ticket management, escalation settings, and
# model/training operations, so the two entry points can't quietly drift
# apart. Mirrors the services/ticket_pipeline.py pattern.
#
# TABLE OF CONTENTS
# -----------------
# 1. IMPORTS & ERRORS      — Dependencies, shared exception types
# 2. TICKETS               — List and update tickets
# 3. ESCALATIONS           — Escalation history + email settings
# 4. MODEL & TRAINING      — Model info, toggle active model, train
# =============================================================================

"""
services/admin_operations.py

Callers (Streamlit, FastAPI) are responsible for turning return values and
raised exceptions into UI/response output — this module has no opinion
about how results get displayed.

`workspace` dicts must have at least: id, slug, name, profile, sector,
uses_custom_model, escalation_email (same shape as ticket_pipeline expects).
"""

# =============================================================================
# region 1. IMPORTS & ERRORS
# =============================================================================

from db import database as db
from utils.active_model import resolve_active_model
from utils.custom_training import (
    get_custom_metrics,
    has_custom_model,
    train_custom_model,
    validate_training_data,
)


class NoCustomModelError(Exception):
    """Raised when a workspace tries to activate a custom model it hasn't trained yet."""


# endregion

# =============================================================================
# region 2. TICKETS
# =============================================================================


def list_tickets(workspace_id: int):
    """Returns all tickets for a workspace. Filtering/sorting is left to the caller."""
    return db.get_all_tickets(workspace_id)


def update_ticket(
    workspace_id: int,
    ticket_id: str,
    status: str,
    action_taken: str = "",
    updated_by: str = "",
    reassigned_to: str = "",
):
    """Updates a ticket and returns the refreshed row, or None if it doesn't exist
    in this workspace — callers decide how to surface that (404 vs. st.error)."""
    existing = db.get_ticket(workspace_id, ticket_id)
    if not existing:
        return None

    db.update_ticket(
        workspace_id=workspace_id,
        ticket_id=ticket_id,
        status=status,
        action_taken=action_taken,
        updated_by=updated_by,
        reassigned_to=reassigned_to,
    )
    return db.get_ticket(workspace_id, ticket_id)


# endregion

# =============================================================================
# region 3. ESCALATIONS
# =============================================================================


def list_escalations(workspace_id: int):
    return db.get_escalations(workspace_id)


def set_escalation_email(workspace_id: int, email: str | None):
    db.set_escalation_email(workspace_id, email)
    return email


# endregion

# =============================================================================
# region 4. MODEL & TRAINING
# =============================================================================


def get_model_info(workspace: dict) -> dict:
    """Currently active model + what custom-training options are available."""
    model, categories, accuracy, label, is_custom = resolve_active_model(workspace)
    return {
        "label": label,
        "categories": list(categories),
        "accuracy": accuracy,
        "is_custom_active": is_custom,
        "has_custom_model": has_custom_model(workspace["slug"]),
        "custom_metrics": get_custom_metrics(workspace["slug"]),
    }


def set_model_active(workspace_id: int, slug: str, use_custom: bool) -> bool:
    """Toggles which model is active for a workspace. Raises NoCustomModelError
    if turning on a custom model that hasn't been trained yet."""
    if use_custom and not has_custom_model(slug):
        raise NoCustomModelError(
            "No custom model trained yet for this workspace — train one first."
        )
    db.set_uses_custom_model(workspace_id, use_custom)
    return use_custom


def train_model(slug: str, upload_df):
    """Validates and trains a custom model on uploaded data.

    Returns (is_valid, message, metrics):
      - invalid data:  (False, <validation error>, None)
      - trained:       (True, <success message>, <metrics dict>)
    """
    is_valid, message = validate_training_data(upload_df)
    if not is_valid:
        return False, message, None

    metrics = train_custom_model(slug, upload_df)
    return True, message, metrics


# endregion