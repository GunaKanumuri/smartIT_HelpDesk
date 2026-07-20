# =============================================================================
# pages/1_Admin_Dashboard.py
#
# Admin view scoped to the logged-in workspace. Five tabs:
#   - Tickets:      filter (including by urgency), inspect, and update status
#   - Analytics:    category/status/urgency breakdowns and volume over time
#   - Escalations:  escalation email settings and history feed
#   - Integration:  public links, embed code, API endpoints
#   - Train:        upload real message examples and train a custom model
#
# TABLE OF CONTENTS
# -----------------
# 1. IMPORTS & CONFIG      — Dependencies, page config, auth gate
# 2. TICKETS TAB           — Filter, inspect, update tickets
# 3. ESCALATIONS TAB       — Escalation email settings + history
# 4. ANALYTICS TAB         — Charts, SLA, summary metrics
# 5. INTEGRATION TAB       — Public links, embed code, API docs
# 6. TRAINING TAB          — Upload data, train custom model
# =============================================================================

"""
pages/1_Admin_Dashboard.py

Admin view scoped to the logged-in workspace (from st.session_state,
set during login/signup on the main app page). Five tabs:
  - Tickets:      filter (including by urgency), inspect, and update status
  - Analytics:    category/status/urgency breakdowns and volume over time
  - Escalations:  escalation email settings and history feed
  - Integration:  public links, embed code, API endpoints for client setup
  - Train on Your Data: upload real message examples and train a
    workspace-specific model instead of using the generic preset —
    this is what makes "trained on your business" an honest claim.
"""

# =============================================================================
# region 1. IMPORTS & CONFIG
# =============================================================================

import io

import pandas as pd
import streamlit as st

from db.database import (
    get_all_tickets,
    get_escalations,
    init_db,
    set_escalation_email,
    set_uses_custom_model,
    update_ticket,
)
from utils.custom_training import (
    get_custom_metrics,
    has_custom_model,
    train_custom_model,
    validate_training_data,
)
from utils.knowledge_base import get_suggested_reply
from utils.profiles import PROFILES
from utils.sectors import get_sector_name

st.set_page_config(page_title="Admin Dashboard", page_icon="🛠️", layout="wide")
init_db()

if "workspace" not in st.session_state:
    st.title("🔒 Admin Dashboard")
    st.info("Please log in to your workspace on the main page first.")
    st.stop()

workspace = st.session_state["workspace"]
profile = workspace["profile"]
sector = workspace.get("sector", "other")
sector_name = get_sector_name(sector)

st.title(f"🛠️ Admin Dashboard — {workspace['name']}")
st.caption(f"{sector_name} · {PROFILES.get(profile, profile)}")

if st.button("Log out"):
    del st.session_state["workspace"]
    st.rerun()

tab_tickets, tab_analytics, tab_escalations, tab_integration, tab_train = st.tabs(
    ["🎟️ Tickets", "📊 Analytics", "🔔 Escalations", "🔗 Integration", "🎓 Train on Your Data"]
)

rows = get_all_tickets(workspace["id"])
df = pd.DataFrame([dict(r) for r in rows]) if rows else pd.DataFrame()

# endregion

# =============================================================================
# region 2. TICKETS TAB
# =============================================================================

with tab_tickets:
    if df.empty:
        st.info("No tickets logged yet for this workspace.")
    else:
        st.subheader("Filter Tickets")
        col1, col2, col3 = st.columns(3)
        with col1:
            status_filter = st.multiselect(
                "Status", df["status"].unique(), default=list(df["status"].unique())
            )
        with col2:
            category_filter = st.multiselect(
                "Category", df["category"].unique(), default=list(df["category"].unique())
            )
        with col3:
            urgency_order = ["High", "Medium", "Low"]
            available_urgency = [u for u in urgency_order if u in df["urgency"].unique()]
            urgency_filter = st.multiselect("Urgency", available_urgency, default=available_urgency)

        filtered_df = df[
            df["status"].isin(status_filter)
            & df["category"].isin(category_filter)
            & df["urgency"].isin(urgency_filter)
        ].copy()

        urgency_rank = {"High": 0, "Medium": 1, "Low": 2}
        filtered_df["_rank"] = filtered_df["urgency"].map(urgency_rank)
        filtered_df = filtered_df.sort_values(["_rank", "created_at"], ascending=[True, False])

        st.dataframe(
            filtered_df[["ticket_id", "created_at", "user_id", "issue_description",
                         "category", "urgency", "confidence", "status", "duplicate_count"]],
            use_container_width=True,
            hide_index=True,
        )

        st.subheader("✏️ Update a Ticket")
        if filtered_df.empty:
            st.info("No tickets match the current filters.")
        else:
            ticket_ids = filtered_df["ticket_id"].tolist()
            selected_ticket = st.selectbox("Select Ticket ID", ticket_ids)
            ticket_row = df[df["ticket_id"] == selected_ticket].iloc[0]

            st.markdown(f"**Issue:** {ticket_row['issue_description']}")

            is_needs_review = ticket_row["category"] == "Needs Review"
            if is_needs_review:
                st.warning(
                    f"⚠️ Below the confidence floor — needs a human call. "
                    f"Model's best guess: **{ticket_row['raw_category']}** "
                    f"({ticket_row['confidence']:.0%} confidence) · "
                    f"**Urgency:** {ticket_row['urgency']}"
                )
            else:
                st.markdown(
                    f"**Predicted category:** {ticket_row['category']} "
                    f"({ticket_row['confidence']:.0%} confidence) · "
                    f"**Urgency:** {ticket_row['urgency']}"
                )
            if ticket_row["secondary_category"]:
                st.caption(
                    f"Runner-up: {ticket_row['secondary_category']} "
                    f"({ticket_row['secondary_confidence']:.0%})"
                )
            if ticket_row.get("duplicate_count", 0):
                st.caption(
                    f"🔁 Reported {ticket_row['duplicate_count']}x more by the same "
                    f"user (last: {ticket_row['last_duplicate_at']})"
                )

            if not workspace.get("uses_custom_model") and not is_needs_review:
                suggested_reply = get_suggested_reply(profile, ticket_row["category"])
                if suggested_reply:
                    st.text_area("💡 Suggested reply (edit before sending)", suggested_reply, height=100)

            status_options = ["Open", "Pending", "Closed", "Reassigned"]
            status = st.selectbox(
                "Status", status_options,
                index=status_options.index(ticket_row["status"])
                if ticket_row["status"] in status_options else 0,
            )
            action_taken = st.text_input("Action Taken", ticket_row["action_taken"] or "")
            updated_by = st.text_input("Updated By", ticket_row["updated_by"] or "")
            reassigned_to = st.selectbox("Reassigned To (if any)", [""] + df["category"].unique().tolist())

            if st.button("💾 Save Update"):
                update_ticket(
                    workspace_id=workspace["id"],
                    ticket_id=selected_ticket,
                    status=status,
                    action_taken=action_taken,
                    updated_by=updated_by,
                    reassigned_to=reassigned_to,
                )
                st.success("Ticket updated successfully!")
                st.rerun()

# endregion

# =============================================================================
# region 3. ESCALATIONS TAB
# =============================================================================

with tab_escalations:
    st.subheader("🔔 Escalation Settings")
    st.caption(
        "When a ticket is flagged High urgency (or the same person resubmits "
        "the same issue 3+ times), TriageIQ notifies this address instead of "
        "waiting for someone to spot it in the dashboard."
    )
    current_email = workspace.get("escalation_email") or ""
    new_email = st.text_input("Escalation email", value=current_email, key="escalation_email_input")
    if st.button("Save escalation email"):
        set_escalation_email(workspace["id"], new_email.strip() or None)
        workspace["escalation_email"] = new_email.strip() or None
        st.session_state["workspace"] = workspace
        st.success("Saved.")
        st.rerun()

    if not current_email:
        st.info(
            "No escalation email set — High-urgency tickets are still logged and "
            "flagged in the dashboard, just not emailed anywhere."
        )

    st.divider()
    st.subheader("Recent Escalations")
    escalation_rows = get_escalations(workspace["id"])
    if not escalation_rows:
        st.info("No escalations yet — they'll show up here once a High-urgency ticket comes in.")
    else:
        esc_df = pd.DataFrame([dict(r) for r in escalation_rows])
        st.dataframe(
            esc_df[["created_at", "ticket_id", "reason", "channel", "status", "recipient", "detail"]],
            use_container_width=True,
            hide_index=True,
        )

# endregion

# =============================================================================
# region 4. ANALYTICS TAB
# =============================================================================

with tab_analytics:
    if df.empty:
        st.info("No tickets logged yet — analytics will show up here once tickets start coming in.")
    else:
        st.subheader("Ticket Volume by Category")
        st.bar_chart(df["category"].value_counts())

        col_a, col_b = st.columns(2)
        with col_a:
            st.subheader("Urgency Breakdown")
            urgency_counts = df["urgency"].value_counts().reindex(["High", "Medium", "Low"]).dropna()
            st.bar_chart(urgency_counts)
        with col_b:
            st.subheader("Status Breakdown")
            st.bar_chart(df["status"].value_counts())

        st.subheader("Tickets Over Time")
        df["date"] = pd.to_datetime(df["created_at"]).dt.date
        daily_counts = df.groupby("date").size()
        st.line_chart(daily_counts)

        st.subheader("⏱️ SLA — Resolution Time")
        resolved = df[df["resolved_at"].notna()].copy()
        if resolved.empty:
            st.info("No tickets resolved yet — resolution time will show up here once tickets are marked Closed.")
        else:
            resolved["resolution_hours"] = (
                pd.to_datetime(resolved["resolved_at"]) - pd.to_datetime(resolved["created_at"])
            ).dt.total_seconds() / 3600
            col_sla1, col_sla2 = st.columns(2)
            with col_sla1:
                st.metric("Avg. Resolution Time", f"{resolved['resolution_hours'].mean():.1f} hrs")
            with col_sla2:
                st.metric("Median Resolution Time", f"{resolved['resolution_hours'].median():.1f} hrs")
            st.caption("Average resolution time by category")
            st.bar_chart(resolved.groupby("category")["resolution_hours"].mean())

        st.subheader("Summary")
        c1, c2, c3, c4, c5 = st.columns(5)
        c1.metric("Total Tickets", len(df))
        c2.metric("Open Tickets", int((df["status"] == "Open").sum()))
        c3.metric("High Urgency", int((df["urgency"] == "High").sum()))
        c4.metric("Needs Review", int((df["category"] == "Needs Review").sum()))
        c5.metric("Avg. Confidence", f"{df['confidence'].mean():.0%}")

# endregion

# =============================================================================
# region 5. INTEGRATION TAB
# =============================================================================

with tab_integration:
    st.subheader("🔗 Integration — Connect TriageIQ to Your Website")
    st.caption(
        f"Your workspace slug is `{workspace['slug']}`. Use it in the URLs "
        "below to connect TriageIQ to your website."
    )

    st.divider()

    # --- Option 1: Direct Link ---
    st.markdown("### Option 1: Direct Link (2 minutes)")
    st.markdown(
        "Add a **Contact Us** or **Report an Issue** button on your website "
        "that links to your public form. Your customers click it, submit "
        "their issue — no login required."
    )
    public_url = f"http://localhost:8001/landing/public_submit.html?workspace={workspace['slug']}"
    st.code(public_url, language="text")
    st.caption("📋 Copy this URL and add it as a link/button on your website.")

    st.divider()

    # --- Option 2: Embed Widget ---
    st.markdown("### Option 2: Embed Widget (5 minutes)")
    st.markdown(
        "Paste this single line of code anywhere in your website's HTML. "
        "A floating **💬 Contact Us** button will appear in the bottom-right "
        "corner. Clicking it opens the submission form in an overlay."
    )
    embed_code = (
        f'<script src="http://localhost:8001/landing/embed.js" '
        f'data-workspace="{workspace["slug"]}"></script>'
    )
    st.code(embed_code, language="html")
    st.caption("That's it — one line. Your customers see a floating button.")

    st.divider()

    # --- Option 3: API ---
    st.markdown("### Option 3: API Integration (for developers)")
    st.markdown(
        "If you already have a contact form on your website, your developer "
        "can POST messages directly to our API. Your existing form stays "
        "exactly the same — the messages just also flow through TriageIQ."
    )
    st.markdown("**Submit a ticket:**")
    api_example = f"""POST http://localhost:8001/api/submit
Content-Type: application/json

{{
  "workspace": "{workspace['slug']}",
  "name": "Customer Name",
  "email": "customer@example.com",
  "message": "My order hasn't arrived yet"
}}"""
    st.code(api_example, language="http")

    st.markdown("**Check ticket status:**")
    status_example = f"GET http://localhost:8001/api/status/{workspace['slug']}/TCK1001"
    st.code(status_example, language="http")

    st.markdown("**Get workspace info:**")
    info_example = f"GET http://localhost:8001/api/workspace/{workspace['slug']}"
    st.code(info_example, language="http")

    st.divider()

    # --- Customer Status Page ---
    st.markdown("### Customer Status Page")
    st.markdown(
        "Your customers can check their ticket status at any time using this "
        "link format. Include the ticket ID in the URL:"
    )
    status_url = f"http://localhost:8001/landing/ticket_status.html?workspace={workspace['slug']}&ticket=TCK1001"
    st.code(status_url, language="text")

# endregion

# =============================================================================
# region 6. TRAINING TAB
# =============================================================================

with tab_train:
    st.subheader("🎓 Train a model on your own messages")
    st.markdown(
        "The preset categories are generic. For a model that actually understands "
        "*your* business, upload real past messages labeled with the category they "
        "belong to — a customer support inbox export, old support tickets, "
        "anything you already have."
    )

    slug = workspace["slug"]
    existing_metrics = get_custom_metrics(slug)

    if existing_metrics:
        st.success(
            f"✅ You have a custom model trained on {existing_metrics['n_samples']} examples "
            f"across {len(existing_metrics['categories'])} categories "
            f"({existing_metrics['test_accuracy']:.0%} accuracy, evaluated on "
            f"{existing_metrics['evaluation_method']})."
        )
        st.caption(f"Categories: {', '.join(existing_metrics['categories'])}")

        currently_active = workspace.get("uses_custom_model", False)
        col_toggle1, col_toggle2 = st.columns(2)
        with col_toggle1:
            if currently_active:
                st.info("🟢 This custom model is currently active for your workspace.")
            else:
                if st.button("Switch to my custom model"):
                    set_uses_custom_model(workspace["id"], True)
                    workspace["uses_custom_model"] = True
                    st.session_state["workspace"] = workspace
                    st.rerun()
        with col_toggle2:
            if currently_active:
                if st.button("Revert to preset model"):
                    set_uses_custom_model(workspace["id"], False)
                    workspace["uses_custom_model"] = False
                    st.session_state["workspace"] = workspace
                    st.rerun()

        st.divider()
        st.markdown("**Retrain with new or additional data:**")

    st.markdown("#### Upload your training data")
    st.caption(
        "CSV with two columns: `text` (the message) and `category` (its label). "
        "Need at least 2 categories and 5 examples per category."
    )

    template_csv = "text,category\nMy order hasn't arrived yet,Shipping\nI was charged twice,Billing\n"
    st.download_button(
        "📥 Download a template CSV", data=template_csv,
        file_name="training_data_template.csv", mime="text/csv",
    )

    uploaded_file = st.file_uploader("Upload CSV", type=["csv"], key="training_upload")

    if uploaded_file is not None:
        try:
            upload_df = pd.read_csv(uploaded_file)
        except Exception as e:
            st.error(f"Couldn't read that file as a CSV: {e}")
            upload_df = None

        if upload_df is not None:
            is_valid, message = validate_training_data(upload_df)
            if is_valid:
                st.success(message)
                if st.button("🚀 Train model on this data", type="primary"):
                    with st.spinner("Training..."):
                        metrics = train_custom_model(slug, upload_df)
                    st.success(
                        f"Trained! Accuracy: {metrics['test_accuracy']:.0%} "
                        f"(evaluated on {metrics['evaluation_method']})"
                    )
                    st.caption(
                        "Review the accuracy above — if it looks low, the most common fix "
                        "is more examples per category, not a different algorithm."
                    )
                    st.rerun()
            else:
                st.error(message)

# endregion
