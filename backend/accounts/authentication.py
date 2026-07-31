import os
import sys
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from backend.database import repository as db


class WorkspaceJWTAuthentication(BaseAuthentication):
    """Authenticates opaque session tokens against the admin_sessions table."""

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.lower().startswith('bearer '):
            return None

        token = auth_header.split(' ', 1)[1].strip()
        if not token:
            return None

        session = db.get_workspace_by_session(token)
        if not session:
            raise AuthenticationFailed('Invalid or expired token.')

        user = type('WorkspaceUser', (), {
            'id': session['id'],
            'pk': session['id'],
            'is_authenticated': True,
        })()
        return (user, token)
