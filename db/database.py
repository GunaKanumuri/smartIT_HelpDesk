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
# =============================================================================

"""
db/database.py

SQLite persistence layer for TriageIQ.

Three tables:
  - workspaces: one row per business/tenant. Each workspace picks a
    business sector and profile at signup, with contact info and
    escalation settings.
  - tickets: every ticket belongs to exactly one workspace_id, so
    each business only ever sees its own data.
  - escalations: audit trail for every escalation notification attempt.
"""

import hashlib
import hmac
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "triageiq.db"

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
"""


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
    """Create a new workspace (tenant). Returns its id. Raises ValueError if slug taken."""
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
        return cursor.lastrowid


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


# endregion

# =============================================================================
# region 4. TICKET CRUD
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
