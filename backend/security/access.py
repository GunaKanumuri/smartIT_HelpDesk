"""Central role and permission policy for SevaK AI workspace users.

Keep policy here rather than scattering role checks through UI and API code.
This makes every future endpoint answer the same question: is this user
allowed to perform this action in *their own* workspace?
"""

ROLE_PERMISSIONS = {
    "owner": {"manage_workspace", "manage_users", "view_tickets", "update_tickets", "view_audit"},
    "admin": {"manage_workspace", "manage_users", "view_tickets", "update_tickets", "view_audit"},
    "agent": {"view_tickets", "update_tickets"},
    "viewer": {"view_tickets"},
}


def has_permission(role: str, permission: str) -> bool:
    """Return whether a workspace role has a named permission."""
    return permission in ROLE_PERMISSIONS.get(role, set())


def require_permission(role: str, permission: str) -> None:
    """Raise PermissionError when a caller is not authorized."""
    if not has_permission(role, permission):
        raise PermissionError(f"Role '{role}' cannot perform '{permission}'.")
