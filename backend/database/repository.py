# =============================================================================
# db/database.py
#
# SQLite persistence layer for TriageIQ.
#
# TABLE OF CONTENTS
# -----------------
# 1. SCHEMA & CONNECTION   — Database schema, connection manager, migrations
# 2. PASSWORD HELPERS      — PBKDF2-HMAC-SHA256 hashing and verification
# 3. WORKSPACE CRUD        — Create, auth, get, update workspace operations
# 4. TICKET CRUD           — Insert, get, update, count tickets
# 5. DUPLICATE TRACKING    — Recent ticket lookup and duplicate bumping
# 6. ESCALATION TRACKING   — Record and retrieve escalation events
# 7. ADMIN SESSION TRACKING — Opaque bearer tokens for the admin API
# =============================================================================

"""
db/database.py

SQLite persistence layer for TriageIQ.

Core tables:
  - workspaces: one row per business/tenant. Each workspace picks a
    business sector and profile at signup, with contact info and
    escalation settings.
  - workspace_users: individual, role-based accounts within a workspace.
    This replaces the unsafe long-term pattern of a whole team sharing one
    workspace password.
  - audit_events: an append-only record of important account and ticket
    actions, scoped to the same workspace as the affected data.
  - tickets: every ticket belongs to exactly one workspace_id, so
    each business only ever sees its own data.
  - escalations: audit trail for every escalation notification attempt.
  - admin_sessions: opaque bearer tokens issued on admin login, used by
    the FastAPI admin router (Streamlit's admin dashboard doesn't need
    these — it uses st.session_state directly).
"""

import hashlib
import hmac
import os
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = ROOT / "storage" / "database" / "sevak_ai.db"

# =============================================================================
# region 1. SCHEMA & CONNECTION
# =============================================================================

SCHEMA = """
CREATE TABLE IF NOT EXISTS workspaces (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    slug                  TEXT UNIQUE NOT NULL,
    name                  TEXT NOT NULL,
    profile               TEXT NOT NULL,
    sector                TEXT NOT NULL DEFAULT 'other',
    business_description  TEXT DEFAULT '',
    contact_phone         TEXT DEFAULT '',
    contact_email         TEXT DEFAULT '',
    password_hash         TEXT NOT NULL,
    password_salt         TEXT NOT NULL,
    uses_custom_model     INTEGER NOT NULL DEFAULT 0,
    escalation_email      TEXT,
    created_at            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id        INTEGER NOT NULL,
    ticket_id           TEXT NOT NULL,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL,
    resolved_at         TEXT,
    user_id             TEXT NOT NULL,
    user_email          TEXT DEFAULT '',
    issue_description   TEXT NOT NULL,
    category            TEXT NOT NULL,
    confidence          REAL NOT NULL,
    secondary_category  TEXT,
    secondary_confidence REAL,
    raw_category        TEXT,
    urgency             TEXT NOT NULL DEFAULT 'Low',
    status              TEXT NOT NULL DEFAULT 'Open',
    action_taken        TEXT DEFAULT '',
    updated_by          TEXT DEFAULT '',
    reassigned_to       TEXT DEFAULT '',
    duplicate_count     INTEGER NOT NULL DEFAULT 0,
    last_duplicate_at   TEXT,
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id),
    UNIQUE (workspace_id, ticket_id)
);

CREATE TABLE IF NOT EXISTS escalations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id  INTEGER NOT NULL,
    ticket_id     TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    reason        TEXT NOT NULL,
    channel       TEXT NOT NULL,
    recipient     TEXT,
    status        TEXT NOT NULL,
    detail        TEXT,
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id)
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    token         TEXT PRIMARY KEY,
    workspace_id  INTEGER NOT NULL,
    user_id       INTEGER,
    created_at    TEXT NOT NULL,
    expires_at    TEXT NOT NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id),
    FOREIGN KEY (user_id) REFERENCES workspace_users (id)
);

CREATE TABLE IF NOT EXISTS workspace_users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id   INTEGER NOT NULL,
    email          TEXT NOT NULL,
    display_name   TEXT NOT NULL DEFAULT '',
    password_hash  TEXT NOT NULL,
    password_salt  TEXT NOT NULL,
    role           TEXT NOT NULL DEFAULT 'agent'
                   CHECK (role IN ('owner', 'admin', 'agent', 'viewer')),
    is_active      INTEGER NOT NULL DEFAULT 1,
    created_at     TEXT NOT NULL,
    last_login_at  TEXT,
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id),
    UNIQUE (workspace_id, email)
);

CREATE TABLE IF NOT EXISTS audit_events (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id   INTEGER NOT NULL,
    actor_user_id  INTEGER,
    action         TEXT NOT NULL,
    target_type    TEXT NOT NULL,
    target_id      TEXT,
    detail         TEXT NOT NULL DEFAULT '',
    created_at     TEXT NOT NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id),
    FOREIGN KEY (actor_user_id) REFERENCES workspace_users (id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_users_workspace
    ON workspace_users(workspace_id, is_active);
CREATE INDEX IF NOT EXISTS idx_audit_events_workspace
    ON audit_events(workspace_id, created_at DESC);
"""

VALID_USER_ROLES = {"owner", "admin", "agent", "viewer"}


@contextmanager
def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_connection() as conn:
        conn.executescript(SCHEMA)
        _migrate(conn)


def _migrate(conn):
    """Add columns to existing databases that predate them (safe no-op otherwise)."""
    existing_cols = {row["name"] for row in conn.execute("PRAGMA table_info(workspaces)")}
    if "uses_custom_model" not in existing_cols:
        conn.execute("ALTER TABLE workspaces ADD COLUMN uses_custom_model INTEGER NOT NULL DEFAULT 0")
        conn.commit()
    if "escalation_email" not in existing_cols:
        conn.execute("ALTER TABLE workspaces ADD COLUMN escalation_email TEXT")
        conn.commit()
    if "sector" not in existing_cols:
        conn.execute("ALTER TABLE workspaces ADD COLUMN sector TEXT NOT NULL DEFAULT 'other'")
        conn.commit()
    if "business_description" not in existing_cols:
        conn.execute("ALTER TABLE workspaces ADD COLUMN business_description TEXT DEFAULT ''")
        conn.commit()
    if "contact_phone" not in existing_cols:
        conn.execute("ALTER TABLE workspaces ADD COLUMN contact_phone TEXT DEFAULT ''")
        conn.commit()
    if "contact_email" not in existing_cols:
        conn.execute("ALTER TABLE workspaces ADD COLUMN contact_email TEXT DEFAULT ''")
        conn.commit()

    ticket_cols = {row["name"] for row in conn.execute("PRAGMA table_info(tickets)")}
    if "raw_category" not in ticket_cols:
        conn.execute("ALTER TABLE tickets ADD COLUMN raw_category TEXT")
        conn.commit()
    if "duplicate_count" not in ticket_cols:
        conn.execute("ALTER TABLE tickets ADD COLUMN duplicate_count INTEGER NOT NULL DEFAULT 0")
        conn.commit()
    if "last_duplicate_at" not in ticket_cols:
        conn.execute("ALTER TABLE tickets ADD COLUMN last_duplicate_at TEXT")
        conn.commit()
    if "user_email" not in ticket_cols:
        conn.execute("ALTER TABLE tickets ADD COLUMN user_email TEXT DEFAULT ''")
        conn.commit()

    session_cols = {row["name"] for row in conn.execute("PRAGMA table_info(admin_sessions)")}
    if "user_id" not in session_cols:
        conn.execute("ALTER TABLE admin_sessions ADD COLUMN user_id INTEGER")
        conn.commit()

    # Existing workspaces predate individual accounts. Seed one owner account
    # for each of them using the current workspace credential, so migration
    # never locks out an existing customer. New signups follow the same model.
    workspaces_without_owner = conn.execute(
        """
        SELECT w.* FROM workspaces w
        WHERE NOT EXISTS (
            SELECT 1 FROM workspace_users u
            WHERE u.workspace_id = w.id AND u.role = 'owner'
        )
        """
    ).fetchall()
    for workspace in workspaces_without_owner:
        email = (workspace["contact_email"] or "").strip().lower()
        if not email:
            email = f"owner@{workspace['slug']}.local"
        conn.execute(
            """
            INSERT INTO workspace_users (
                workspace_id, email, display_name, password_hash,
                password_salt, role, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, 'owner', 1, ?)
            """,
            (
                workspace["id"], email, workspace["name"],
                workspace["password_hash"], workspace["password_salt"],
                workspace["created_at"],
            ),
        )


# endregion

# =============================================================================
# region 2. PASSWORD HELPERS
# =============================================================================
def _hash_password(password: str, salt: str = None) -> tuple[str, str]:
    """PBKDF2-HMAC-SHA256 password hashing (no extra dependency needed)."""
    salt = salt or os.urandom(16).hex()
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 200_000)
    return digest.hex(), salt


def _verify_password(password: str, password_hash: str, salt: str) -> bool:
    computed, _ = _hash_password(password, salt)
    return hmac.compare_digest(computed, password_hash)


# endregion

# =============================================================================
# region 3. WORKSPACE CRUD
# =============================================================================
def create_workspace(
    slug: str,
    name: str,
    profile: str,
    password: str,
    sector: str = "other",
    business_description: str = "",
    contact_phone: str = "",
    contact_email: str = "",
) -> int:
    """Create a workspace and its initial owner account.

    The legacy workspace password remains available during the transition to
    individual accounts. The same password seeds the first owner only; future
    team members always receive their own account.
    """
    password_hash, salt = _hash_password(password)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        existing = conn.execute(
            "SELECT id FROM workspaces WHERE slug = ?", (slug,)
        ).fetchone()
        if existing:
            raise ValueError(f"Workspace slug '{slug}' is already taken.")
        cursor = conn.execute(
            """
            INSERT INTO workspaces (
                slug, name, profile, sector, business_description,
                contact_phone, contact_email,
                password_hash, password_salt, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (slug, name, profile, sector, business_description,
             contact_phone, contact_email, password_hash, salt, now),
        )
        workspace_id = cursor.lastrowid
        owner_email = (contact_email or "").strip().lower() or f"owner@{slug}.local"
        conn.execute(
            """
            INSERT INTO workspace_users (
                workspace_id, email, display_name, password_hash,
                password_salt, role, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, 'owner', 1, ?)
            """,
            (workspace_id, owner_email, name, password_hash, salt, now),
        )
        _record_audit_event_with_connection(
            conn, workspace_id, None, "workspace.created", "workspace", str(workspace_id)
        )
        return workspace_id


def authenticate_workspace(slug: str, password: str):
    """Return the workspace row if slug+password match, else None."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM workspaces WHERE slug = ?", (slug,)
        ).fetchone()
    if row is None:
        return None
    if not _verify_password(password, row["password_hash"], row["password_salt"]):
        return None
    return row


def get_workspace(workspace_id: int):
    with get_connection() as conn:
        return conn.execute(
            "SELECT * FROM workspaces WHERE id = ?", (workspace_id,)
        ).fetchone()


def get_workspace_by_slug(slug: str):
    """Fetch a workspace by its slug — used by the public API."""
    with get_connection() as conn:
        return conn.execute(
            "SELECT * FROM workspaces WHERE slug = ?", (slug,)
        ).fetchone()


def set_uses_custom_model(workspace_id: int, enabled: bool):
    with get_connection() as conn:
        conn.execute(
            "UPDATE workspaces SET uses_custom_model = ? WHERE id = ?",
            (1 if enabled else 0, workspace_id),
        )


def set_escalation_email(workspace_id: int, email: str | None):
    with get_connection() as conn:
        conn.execute(
            "UPDATE workspaces SET escalation_email = ? WHERE id = ?",
            (email or None, workspace_id),
        )


# =============================================================================
# region 4. WORKSPACE USERS & AUDIT EVENTS
# =============================================================================

def _normalise_email(email: str) -> str:
    email = (email or "").strip().lower()
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise ValueError("A valid email address is required.")
    return email


def _validate_role(role: str) -> str:
    if role not in VALID_USER_ROLES:
        raise ValueError(f"Unknown role '{role}'.")
    return role


def _record_audit_event_with_connection(
    conn,
    workspace_id: int,
    actor_user_id: int | None,
    action: str,
    target_type: str,
    target_id: str | None = None,
    detail: str = "",
):
    conn.execute(
        """
        INSERT INTO audit_events (
            workspace_id, actor_user_id, action, target_type, target_id, detail, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            workspace_id, actor_user_id, action, target_type, target_id, detail,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        ),
    )


def record_audit_event(
    workspace_id: int,
    actor_user_id: int | None,
    action: str,
    target_type: str,
    target_id: str | None = None,
    detail: str = "",
):
    """Append a workspace-scoped audit event for an important action."""
    with get_connection() as conn:
        _record_audit_event_with_connection(
            conn, workspace_id, actor_user_id, action, target_type, target_id, detail
        )


def list_audit_events(workspace_id: int, limit: int = 100):
    with get_connection() as conn:
        return conn.execute(
            """
            SELECT * FROM audit_events WHERE workspace_id = ?
            ORDER BY id DESC LIMIT ?
            """,
            (workspace_id, limit),
        ).fetchall()


def create_workspace_user(
    workspace_id: int,
    email: str,
    password: str,
    role: str = "agent",
    display_name: str = "",
    actor_user_id: int | None = None,
) -> int:
    """Create one active, individual account inside a workspace."""
    email = _normalise_email(email)
    role = _validate_role(role)
    if len(password) < 12:
        raise ValueError("Password must contain at least 12 characters.")

    password_hash, salt = _hash_password(password)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO workspace_users (
                    workspace_id, email, display_name, password_hash,
                    password_salt, role, is_active, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
                """,
                (workspace_id, email, display_name.strip(), password_hash, salt, role, now),
            )
        except sqlite3.IntegrityError as exc:
            raise ValueError("A user with this email already exists in this workspace.") from exc
        user_id = cursor.lastrowid
        _record_audit_event_with_connection(
            conn, workspace_id, actor_user_id, "user.created", "workspace_user", str(user_id), role
        )
        return user_id


def list_workspace_users(workspace_id: int, include_inactive: bool = False):
    query = "SELECT * FROM workspace_users WHERE workspace_id = ?"
    params: tuple = (workspace_id,)
    if not include_inactive:
        query += " AND is_active = 1"
    query += " ORDER BY role = 'owner' DESC, display_name COLLATE NOCASE, email COLLATE NOCASE"
    with get_connection() as conn:
        return conn.execute(query, params).fetchall()


def get_workspace_user(workspace_id: int, user_id: int):
    with get_connection() as conn:
        return conn.execute(
            "SELECT * FROM workspace_users WHERE workspace_id = ? AND id = ?",
            (workspace_id, user_id),
        ).fetchone()


def set_workspace_user_active(
    workspace_id: int, user_id: int, active: bool, actor_user_id: int | None = None
) -> bool:
    """Activate/deactivate an account without deleting its audit history."""
    with get_connection() as conn:
        user = conn.execute(
            "SELECT role FROM workspace_users WHERE workspace_id = ? AND id = ?",
            (workspace_id, user_id),
        ).fetchone()
        if not user:
            return False
        if user["role"] == "owner" and not active:
            raise ValueError("The workspace owner cannot be deactivated.")
        conn.execute(
            "UPDATE workspace_users SET is_active = ? WHERE workspace_id = ? AND id = ?",
            (1 if active else 0, workspace_id, user_id),
        )
        _record_audit_event_with_connection(
            conn, workspace_id, actor_user_id,
            "user.activated" if active else "user.deactivated", "workspace_user", str(user_id),
        )
        return True


# endregion


# endregion

# =============================================================================
# region 5. TICKET CRUD
# =============================================================================
def _next_ticket_id(conn, workspace_id: int) -> str:
    row = conn.execute(
        "SELECT ticket_id FROM tickets WHERE workspace_id = ? ORDER BY id DESC LIMIT 1",
        (workspace_id,),
    ).fetchone()
    if row is None:
        return "TCK1001"
    last_number = int(row["ticket_id"].replace("TCK", ""))
    return f"TCK{last_number + 1}"


def insert_ticket(
    workspace_id: int,
    user_id: str,
    issue_description: str,
    category: str,
    confidence: float,
    urgency: str,
    secondary_category: str = None,
    secondary_confidence: float = None,
    raw_category: str = None,
    user_email: str = "",
) -> str:
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        ticket_id = _next_ticket_id(conn, workspace_id)
        conn.execute(
            """
            INSERT INTO tickets (
                workspace_id, ticket_id, created_at, updated_at, user_id,
                user_email, issue_description, category, confidence,
                secondary_category, secondary_confidence, raw_category,
                urgency, status, action_taken, updated_by, reassigned_to
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', '', '', '')
            """,
            (
                workspace_id, ticket_id, now, now, user_id, user_email,
                issue_description, category, confidence, secondary_category,
                secondary_confidence, raw_category, urgency,
            ),
        )
    return ticket_id


def get_all_tickets(workspace_id: int):
    with get_connection() as conn:
        return conn.execute(
            "SELECT * FROM tickets WHERE workspace_id = ? ORDER BY id DESC",
            (workspace_id,),
        ).fetchall()


def get_ticket(workspace_id: int, ticket_id: str):
    with get_connection() as conn:
        return conn.execute(
            "SELECT * FROM tickets WHERE workspace_id = ? AND ticket_id = ?",
            (workspace_id, ticket_id),
        ).fetchone()


def update_ticket(workspace_id: int, ticket_id: str, status: str, action_taken: str,
                   updated_by: str, reassigned_to: str):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        if status == "Closed":
            # Only stamp resolved_at the first time a ticket is closed —
            # don't overwrite it if it's already been closed once before.
            existing = conn.execute(
                "SELECT resolved_at FROM tickets WHERE workspace_id = ? AND ticket_id = ?",
                (workspace_id, ticket_id),
            ).fetchone()
            resolved_at = existing["resolved_at"] if existing and existing["resolved_at"] else now
            conn.execute(
                """
                UPDATE tickets
                SET status = ?, action_taken = ?, updated_by = ?,
                    reassigned_to = ?, updated_at = ?, resolved_at = ?
                WHERE workspace_id = ? AND ticket_id = ?
                """,
                (status, action_taken, updated_by, reassigned_to, now, resolved_at,
                 workspace_id, ticket_id),
            )
        else:
            conn.execute(
                """
                UPDATE tickets
                SET status = ?, action_taken = ?, updated_by = ?,
                    reassigned_to = ?, updated_at = ?
                WHERE workspace_id = ? AND ticket_id = ?
                """,
                (status, action_taken, updated_by, reassigned_to, now, workspace_id, ticket_id),
            )


def ticket_count(workspace_id: int) -> int:
    with get_connection() as conn:
        return conn.execute(
            "SELECT COUNT(*) AS c FROM tickets WHERE workspace_id = ?", (workspace_id,)
        ).fetchone()["c"]


# endregion

# =============================================================================
# region 5. DUPLICATE TRACKING
# =============================================================================
def get_recent_tickets_for_dedup(workspace_id: int, user_id: str, hours: int = 24, limit: int = 50):
    """
    Candidate tickets to compare a new submission against: same workspace
    and user, created within the lookback window, most recent first.
    Scoped to user_id so two different customers with similar complaints
    aren't flagged against each other.
    """
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT ticket_id, issue_description, duplicate_count
            FROM tickets
            WHERE workspace_id = ? AND user_id = ?
              AND datetime(created_at) >= datetime('now', ?)
            ORDER BY id DESC
            LIMIT ?
            """,
            (workspace_id, user_id, f"-{hours} hours", limit),
        ).fetchall()
    return [dict(r) for r in rows]


def bump_duplicate(workspace_id: int, ticket_id: str, escalate: bool = False) -> int:
    """Increment a ticket's duplicate_count (and optionally its urgency to High).
    Returns the new duplicate_count."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        if escalate:
            conn.execute(
                """
                UPDATE tickets
                SET duplicate_count = duplicate_count + 1, last_duplicate_at = ?,
                    updated_at = ?, urgency = 'High'
                WHERE workspace_id = ? AND ticket_id = ?
                """,
                (now, now, workspace_id, ticket_id),
            )
        else:
            conn.execute(
                """
                UPDATE tickets
                SET duplicate_count = duplicate_count + 1, last_duplicate_at = ?, updated_at = ?
                WHERE workspace_id = ? AND ticket_id = ?
                """,
                (now, now, workspace_id, ticket_id),
            )
        row = conn.execute(
            "SELECT duplicate_count FROM tickets WHERE workspace_id = ? AND ticket_id = ?",
            (workspace_id, ticket_id),
        ).fetchone()
    return row["duplicate_count"]


# endregion

# =============================================================================
# region 6. ESCALATION TRACKING
# =============================================================================
def record_escalation(workspace_id: int, ticket_id: str, reason: str, channel: str,
                       recipient: str | None, status: str, detail: str | None):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO escalations
                (workspace_id, ticket_id, created_at, reason, channel, recipient, status, detail)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (workspace_id, ticket_id, now, reason, channel, recipient, status, detail),
        )


def get_escalations(workspace_id: int):
    with get_connection() as conn:
        return conn.execute(
            "SELECT * FROM escalations WHERE workspace_id = ? ORDER BY id DESC",
            (workspace_id,),
        ).fetchall()


# endregion

# =============================================================================
# region 7. ADMIN SESSION TRACKING
# =============================================================================

SESSION_TTL_HOURS = 24 * 7  # 1 week


def create_session(
    workspace_id: int, user_id: int | None = None, ttl_hours: int = SESSION_TTL_HOURS
) -> str:
    """Issue a session for one active workspace user.

    Existing workspace-password logins are temporarily mapped to the owner
    account. New individual-user login can supply its explicit ``user_id``.
    """
    token = secrets.token_urlsafe(32)
    now = datetime.now()
    expires_at = now + timedelta(hours=ttl_hours)
    with get_connection() as conn:
        if user_id is None:
            owner = conn.execute(
                """
                SELECT id FROM workspace_users
                WHERE workspace_id = ? AND role = 'owner' AND is_active = 1
                """,
                (workspace_id,),
            ).fetchone()
            if not owner:
                raise ValueError("Workspace has no active owner account.")
            user_id = owner["id"]
        conn.execute(
            """
            INSERT INTO admin_sessions (token, workspace_id, user_id, created_at, expires_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (token, workspace_id, user_id, now.strftime("%Y-%m-%d %H:%M:%S"),
             expires_at.strftime("%Y-%m-%d %H:%M:%S")),
        )
    return token


def get_workspace_by_session(token: str):
    """Return workspace plus session-user role for a valid active session."""
    with get_connection() as conn:
        return conn.execute(
            """
            SELECT w.*, u.id AS session_user_id, u.role AS session_role
            FROM admin_sessions s
            JOIN workspaces w ON w.id = s.workspace_id
            JOIN workspace_users u ON u.id = s.user_id AND u.workspace_id = w.id
            WHERE s.token = ? AND u.is_active = 1 AND datetime(s.expires_at) > datetime('now')
            """,
            (token,),
        ).fetchone()


def delete_session(token: str):
    """Invalidate a single token (logout). No-op if it doesn't exist."""
    with get_connection() as conn:
        conn.execute("DELETE FROM admin_sessions WHERE token = ?", (token,))


def delete_expired_sessions():
    """Housekeeping — sweep out expired tokens. Cheap to call on every login."""
    with get_connection() as conn:
        conn.execute("DELETE FROM admin_sessions WHERE datetime(expires_at) <= datetime('now')")


# endregion
