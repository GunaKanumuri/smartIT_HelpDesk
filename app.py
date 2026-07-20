# =============================================================================
# app.py
#
# Public-facing entry point for TriageIQ.
#
# TABLE OF CONTENTS
# -----------------
# 1. IMPORTS & CONFIG       — Dependencies and Streamlit page config
# 2. HELPERS                — Slug generation, session management
# 3. WORKSPACE GATE         — Login/signup flow with sector selection
# 4. TICKET SUBMISSION UI   — Relevance check → classify → submit → escalate
# =============================================================================

"""
app.py

Public-facing entry point for TriageIQ.

Flow (clean two-step, not tabs):
  1. Landing screen: two clear choices — "Create a workspace" or "Log in".
  2. A focused form for whichever was chosen, with a way back.
  3. Once authenticated, the ticket submission chat for that workspace.

Signing up automatically logs the workspace in — no separate "now go log
in" step required, since making someone re-enter a password they just
typed is friction with no real benefit here.

Admin tools live in pages/1_Admin_Dashboard.py (Streamlit's multipage
support picks up anything under pages/ automatically).
"""

# =============================================================================
# region 1. IMPORTS & CONFIG
# =============================================================================

import re

import streamlit as st

from db import database as db
from db.database import authenticate_workspace, create_workspace, init_db, insert_ticket
from utils.active_model import resolve_active_model
from utils.duplicates import find_duplicate, should_escalate_for_repeats
from utils.knowledge_base import get_suggested_reply
from utils.notifications import send_escalation
from utils.profiles import PROFILES
from utils.relevance import check_relevance
from utils.sectors import get_sector_choices, get_sector_name
from utils.ticket_utils import classify_ticket
from utils.urgency import score_urgency

st.set_page_config(page_title="TriageIQ", page_icon="🚀", layout="centered")
init_db()

# endregion

# =============================================================================
# region 2. HELPERS
# =============================================================================


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "workspace"


def go_home():
    st.session_state["auth_mode"] = None


def _workspace_session_dict(workspace) -> dict:
    """Build the workspace dict stored in session state — one place, not two."""
    return {
        "id": workspace["id"],
        "slug": workspace["slug"],
        "name": workspace["name"],
        "profile": workspace["profile"],
        "sector": workspace["sector"],
        "business_description": workspace.get("business_description", ""),
        "contact_phone": workspace.get("contact_phone", ""),
        "contact_email": workspace.get("contact_email", ""),
        "uses_custom_model": bool(workspace["uses_custom_model"]),
        "escalation_email": workspace["escalation_email"],
    }


# endregion

# =============================================================================
# region 3. WORKSPACE GATE
# =============================================================================

if "workspace" not in st.session_state:
    st.session_state.setdefault("auth_mode", None)

    st.title("🚀 TriageIQ")
    st.markdown(
        "AI-powered inbound message triage. Describe your issue and it's "
        "automatically classified, prioritized, and logged — no manual sorting."
    )
    st.divider()

    # ------------------------------------------------------------ Choice
    if st.session_state["auth_mode"] is None:
        col1, col2 = st.columns(2)
        with col1:
            st.subheader("New here?")
            st.caption("Set up a workspace for your business in under a minute.")
            if st.button("🆕 Create a workspace", use_container_width=True):
                st.session_state["auth_mode"] = "signup"
                st.rerun()
        with col2:
            st.subheader("Already have a workspace?")
            st.caption("Log in to submit or manage tickets.")
            if st.button("🔑 Log in", use_container_width=True):
                st.session_state["auth_mode"] = "login"
                st.rerun()

    # -------------------------------------------------------------- Login
    elif st.session_state["auth_mode"] == "login":
        st.button("← Back", on_click=go_home)
        st.subheader("Log in to your workspace")

        login_slug = st.text_input("Workspace ID", key="login_slug", autocomplete="off")
        login_password = st.text_input(
            "Password", type="password", key="login_password", autocomplete="off"
        )

        if st.button("Log in", type="primary"):
            if not login_slug or not login_password:
                st.error("Enter both your workspace ID and password.")
            else:
                workspace = authenticate_workspace(login_slug.strip(), login_password)
                if workspace:
                    st.session_state["workspace"] = _workspace_session_dict(workspace)
                    st.session_state["auth_mode"] = None
                    st.rerun()
                else:
                    st.error("Incorrect workspace ID or password.")

    # ------------------------------------------------------------- Signup
    elif st.session_state["auth_mode"] == "signup":
        st.button("← Back", on_click=go_home)
        st.subheader("Create a new workspace")
        st.caption("This is a demo — no email verification, just pick a workspace ID and password.")

        signup_name = st.text_input("Business name", key="signup_name", autocomplete="off")

        # --- Sector selection ---
        sector_choices = get_sector_choices()
        sector_labels = list(sector_choices.values())
        sector_ids = list(sector_choices.keys())
        selected_sector_label = st.selectbox(
            "What sector is your business in?",
            sector_labels,
            key="signup_sector",
            help="This helps TriageIQ understand what kinds of messages are relevant to your business.",
        )
        selected_sector_id = sector_ids[sector_labels.index(selected_sector_label)]

        # --- Profile selection ---
        signup_profile_label = st.selectbox(
            "Classifier profile (determines initial category set)",
            list(PROFILES.values()),
            key="signup_profile",
            help="Pick the closest match. You can always train a custom model later.",
        )

        # --- Business details ---
        with st.expander("📝 Business details (optional but recommended)"):
            signup_description = st.text_area(
                "Describe what your business does",
                key="signup_description",
                placeholder="e.g. We sell custom cakes and provide catering for events...",
                help="Helps the system understand your business context.",
            )
            signup_phone = st.text_input(
                "Contact phone",
                key="signup_phone",
                placeholder="e.g. (555) 123-4567",
            )
            signup_contact_email = st.text_input(
                "Contact email (shown on public form)",
                key="signup_contact_email",
                placeholder="e.g. hello@yourbusiness.com",
            )

        signup_password = st.text_input(
            "Password", type="password", key="signup_password", autocomplete="new-password"
        )

        if st.button("Create workspace", type="primary"):
            if not signup_name or not signup_password:
                st.error("Business name and password are required.")
            else:
                profile_id = next(k for k, v in PROFILES.items() if v == signup_profile_label)
                slug = slugify(signup_name)
                try:
                    create_workspace(
                        slug=slug,
                        name=signup_name,
                        profile=profile_id,
                        password=signup_password,
                        sector=selected_sector_id,
                        business_description=signup_description if "signup_description" in dir() else "",
                        contact_phone=signup_phone if "signup_phone" in dir() else "",
                        contact_email=signup_contact_email if "signup_contact_email" in dir() else "",
                    )
                    # Auto-login: no reason to make them retype what they just typed.
                    workspace = authenticate_workspace(slug, signup_password)
                    st.session_state["workspace"] = _workspace_session_dict(workspace)
                    st.session_state["auth_mode"] = None
                    st.success(f"Workspace created! Your workspace ID is `{slug}` — you're logged in.")
                    st.rerun()
                except ValueError:
                    st.error(f"Workspace ID '{slug}' is already taken. Try a different business name.")

    st.stop()

# endregion

# =============================================================================
# region 4. TICKET SUBMISSION UI
# =============================================================================

workspace = st.session_state["workspace"]
profile = workspace["profile"]
sector = workspace.get("sector", "other")

try:
    model, categories, accuracy, model_label, is_custom = resolve_active_model(workspace)
except FileNotFoundError as e:
    st.error(str(e))
    st.stop()

col_title, col_logout = st.columns([4, 1])
with col_title:
    st.title(f"🚀 {workspace['name']}")
    sector_display = get_sector_name(sector)
    st.caption(f"{sector_display} · {model_label} · categories: {', '.join(categories)}")
with col_logout:
    if st.button("Log out"):
        del st.session_state["workspace"]
        st.rerun()

if accuracy:
    st.caption(f"Classifier test accuracy: {accuracy:.0%}")

user_id = st.text_input("👤 Your name or user ID (optional)", value="guest", autocomplete="off")
ticket_text = st.chat_input("Describe your issue...")

if ticket_text:
    with st.chat_message("user"):
        st.markdown(ticket_text)

    # ----------------------------------------------------- Relevance check
    relevance = check_relevance(ticket_text, sector, workspace["name"])

    if not relevance["relevant"]:
        with st.chat_message("assistant"):
            st.markdown(relevance["response"])
            if relevance.get("emergency_text") and relevance["emergency"]:
                st.error(f"⚠️ {relevance['emergency_text']}")
        st.toast("🚫 Message not related to this business")
        st.stop()

    # If there's an emergency keyword but the message IS relevant, show
    # the emergency text alongside the normal ticket flow
    if relevance.get("emergency") and relevance.get("emergency_text"):
        st.warning(f"⚠️ {relevance['emergency_text']}")

    try:
        result = classify_ticket(ticket_text, profile=profile, model=model)
    except AttributeError:
        st.error(
            "The trained model file isn't compatible with the scikit-learn version "
            "installed here (this happens when a `.pkl` was trained with a different "
            "scikit-learn version than the one currently installed). "
            "Fix: run `python model/train_model.py` in a terminal to regenerate the "
            "models locally, then reload this page."
        )
        st.stop()
    urgency = score_urgency(ticket_text, result["confidence"])

    # ------------------------------------------------------- Duplicate check
    candidates = db.get_recent_tickets_for_dedup(workspace["id"], user_id or "guest")
    duplicate = find_duplicate(ticket_text, candidates)

    if duplicate:
        prospective_count = duplicate["duplicate_count"] + 1
        escalate = should_escalate_for_repeats(prospective_count)
        new_count = db.bump_duplicate(workspace["id"], duplicate["ticket_id"], escalate=escalate)

        with st.chat_message("assistant"):
            st.markdown(
                f"Looks like this matches something you already told us — "
                f"ticket **{duplicate['ticket_id']}** is already open, and we've "
                f"noted you've mentioned it {new_count}x."
            )
            if escalate:
                st.markdown(
                    "🔴 Repeated submissions on this one — it's been escalated to "
                    "**high urgency** for a human to take a look."
                )
                notify_result = send_escalation(
                    workspace_name=workspace["name"],
                    escalation_email=workspace.get("escalation_email"),
                    ticket_id=duplicate["ticket_id"],
                    issue_text=ticket_text,
                    category=result["category"],
                    reason="repeated submissions",
                )
                db.record_escalation(
                    workspace["id"], duplicate["ticket_id"], "repeated submissions",
                    notify_result["channel"], notify_result["recipient"],
                    notify_result["status"], notify_result["detail"],
                )

        st.toast(f"🔁 Matched existing ticket {duplicate['ticket_id']}")
        st.stop()

    with st.chat_message("assistant"):
        if result["out_of_scope"]:
            st.markdown(
                "I couldn't confidently match this to an existing category, so "
                "I've flagged it for a teammate to review directly rather than "
                "guess. ✅"
            )
        elif result["confidence"] < 0.7:
            st.markdown(
                f"I've logged this under **{result['category']}**, though I'm not "
                "fully certain — our team will double check and redirect if needed. ✅"
            )
        else:
            st.markdown(
                f"Your issue has been logged under **{result['category']}**. "
                "Our team will handle it shortly. ✅"
            )
        if urgency == "High":
            st.markdown("🔴 This has been flagged as **high urgency**.")

        if not is_custom and not result["out_of_scope"]:
            suggested_reply = get_suggested_reply(profile, result["category"])
            if suggested_reply:
                with st.expander("💡 Suggested next steps while you wait"):
                    st.markdown(suggested_reply)

    ticket_id = insert_ticket(
        workspace_id=workspace["id"],
        user_id=user_id or "guest",
        issue_description=ticket_text,
        category=result["category"],
        confidence=result["confidence"],
        urgency=urgency,
        secondary_category=result["secondary_category"],
        secondary_confidence=result["secondary_confidence"],
        raw_category=result["raw_category"],
    )

    if urgency == "High":
        notify_result = send_escalation(
            workspace_name=workspace["name"],
            escalation_email=workspace.get("escalation_email"),
            ticket_id=ticket_id,
            issue_text=ticket_text,
            category=result["category"],
            reason="high urgency",
        )
        db.record_escalation(
            workspace["id"], ticket_id, "high urgency",
            notify_result["channel"], notify_result["recipient"],
            notify_result["status"], notify_result["detail"],
        )
        if notify_result["status"] == "sent":
            st.caption(f"🔔 Escalation email sent to {notify_result['recipient']}")
        elif notify_result["status"] == "logged":
            st.caption(f"🔔 Escalation logged — {notify_result['detail']}")

    st.toast(f"📝 Ticket {ticket_id} logged")
    st.caption(f"Ticket ID: `{ticket_id}` · Urgency: {urgency}")

# endregion
