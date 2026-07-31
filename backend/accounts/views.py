import os
import sys
from datetime import datetime, timedelta

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

import jwt

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.database import repository as db

JWT_SECRET = os.environ.get('JWT_SECRET', 'sevak-ai-jwt-secret-change-in-prod')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 24

# In-memory token store for password resets
_reset_tokens: dict[str, dict] = {}


def _generate_token(workspace_id: int) -> str:
    """Generate a JWT token for the given workspace."""
    now = datetime.utcnow()
    payload = {
        'workspace_id': workspace_id,
        'iat': now,
        'exp': now + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _workspace_admin_info(workspace) -> dict:
    return {
        'id': workspace['id'],
        'slug': workspace['slug'],
        'name': workspace['name'],
        'profile': workspace['profile'],
        'sector': workspace['sector'],
        'business_description': workspace['business_description'] or '',
        'contact_phone': workspace['contact_phone'] or '',
        'contact_email': workspace['contact_email'] or '',
        'ticket_prefix': workspace['ticket_prefix'] or '',
        'uses_custom_model': bool(workspace['uses_custom_model']),
        'escalation_email': workspace['escalation_email'],
    }


# ─── Auth Endpoints ────────────────────────────────────────────────────────


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """POST /api/auth/login — authenticate workspace slug+password, return JWT."""
    slug = request.data.get('slug', '').strip()
    password = request.data.get('password', '')

    if not slug or not password:
        return Response({'detail': 'Slug and password are required.'}, status=400)

    workspace = db.authenticate_workspace(slug, password)
    if not workspace:
        return Response({'detail': 'Incorrect workspace ID or password.'}, status=401)

    # Create a DB session for compatibility with the existing frontend
    db.delete_expired_sessions()
    token = db.create_session(workspace['id'])

    return Response({
        'token': token,
        'workspace': _workspace_admin_info(workspace),
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    """POST /api/auth/signup — create workspace + auto-login, return JWT."""
    slug = request.data.get('slug', '').strip()
    name = request.data.get('name', '').strip()
    profile = request.data.get('profile', '')
    password = request.data.get('password', '')
    ticket_prefix = request.data.get('ticket_prefix', '')

    if not slug or not name or not password:
        return Response({'detail': 'Slug, name, and password are required.'}, status=400)

    try:
        workspace_id = db.create_workspace(
            slug=slug,
            name=name,
            profile=profile,
            password=password,
            ticket_prefix=ticket_prefix,
            sector=request.data.get('sector', 'other'),
            business_description=request.data.get('business_description', ''),
            contact_phone=request.data.get('contact_phone', ''),
            contact_email=request.data.get('contact_email', ''),
        )
    except ValueError as e:
        return Response({'detail': str(e)}, status=409)

    workspace = db.get_workspace(workspace_id)
    token = db.create_session(workspace_id)
    return Response({
        'token': token,
        'workspace': _workspace_admin_info(workspace),
    }, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """POST /api/auth/logout — invalidate token."""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    token = auth_header.split(' ', 1)[1].strip() if auth_header.startswith('Bearer ') else ''
    if token:
        db.delete_session(token)
    return Response({'success': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """GET /api/auth/me — rehydrate session."""
    workspace_id = request.user.id
    workspace = db.get_workspace(workspace_id)
    if not workspace:
        return Response({'detail': 'Workspace not found.'}, status=404)
    return Response(_workspace_admin_info(workspace))


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """POST /api/auth/forgot-password — request password reset."""
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'detail': 'Email is required.'}, status=400)

    # Find user by email
    import sqlite3
    try:
        with db.get_connection() as conn:
            user = conn.execute(
                "SELECT id, workspace_id, email FROM workspace_users WHERE email = ? AND is_active = 1",
                (email,),
            ).fetchone()
    except Exception:
        user = None

    import secrets
    if user:
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        # Store in-memory (same as FastAPI version)
        _reset_tokens[reset_token] = {
            'user_id': user['id'],
            'workspace_id': user['workspace_id'],
            'email': user['email'],
            'expires_at': expires_at,
        }
        reset_link = f"http://localhost:3000/reset-password/{reset_token}"
        print(f"\n🔐 PASSWORD RESET LINK: {reset_link}\n")

    return Response({
        'success': True,
        'message': 'If that email exists, a reset link has been sent.',
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """POST /api/auth/reset-password — reset password using token."""
    token = request.data.get('token', '')
    new_password = request.data.get('password', '')

    token_data = _reset_tokens.get(token)
    if not token_data:
        return Response({'detail': 'Invalid or expired reset token.'}, status=400)
    if datetime.utcnow() > token_data['expires_at']:
        del _reset_tokens[token]
        return Response({'detail': 'Token has expired. Request a new one.'}, status=400)

    password_hash, salt = db._hash_password(new_password)
    import sqlite3
    with db.get_connection() as conn:
        conn.execute(
            "UPDATE workspace_users SET password_hash = ?, password_salt = ? WHERE id = ?",
            (password_hash, salt, token_data['user_id']),
        )
        conn.execute(
            "DELETE FROM admin_sessions WHERE workspace_id = ?",
            (token_data['workspace_id'],),
        )

    del _reset_tokens[token]
    return Response({
        'success': True,
        'message': 'Password reset successfully. Please log in again.',
    })
