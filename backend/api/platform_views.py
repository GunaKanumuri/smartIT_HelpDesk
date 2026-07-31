"""
backend/api/platform_views.py

Endpoints for SEVAKAI PLATFORM ADMINS (us — the operators of the system).
These are protected by platform-level authentication (currently JWT).
They provide health/observability and future platform-wide management.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from backend.database import repository as db


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    """GET /api/health — liveness/readiness probe.

    Used by load balancers and monitoring. Verifies the database is reachable.
    """
    db_ok = True
    try:
        with db.get_connection() as conn:
            conn.execute("SELECT 1")
    except Exception:
        db_ok = False

    return Response({
        'status': 'ok' if db_ok else 'degraded',
        'db': 'ok' if db_ok else 'error',
        'service': 'sevak-ai-api',
    }, status=200 if db_ok else 503)
