"""
backend/api/customer_views.py

Endpoints for END-USERS (our clients' customers).
These are public, unauthenticated endpoints used by the widget or public portal.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.models import Workspace
from api.serializers import WorkspaceInfoSerializer
from backend.database import repository as db
from backend.services.ticket_pipeline import submit_ticket


def _workspace_dict(w):
    return {
        'id': w.id,
        'slug': w.slug,
        'name': w.name,
        'profile': w.profile,
        'sector': w.sector,
        'uses_custom_model': bool(w.uses_custom_model),
        'escalation_email': w.escalation_email,
    }


@api_view(['GET'])
@permission_classes([AllowAny])
def get_workspace_info(request, slug):
    """GET /api/workspace/{slug} — public workspace info for customer portal."""
    w = Workspace.objects.filter(slug=slug).first()
    if not w:
        return Response({'detail': f"Workspace '{slug}' not found."}, status=404)
    ser = WorkspaceInfoSerializer(w)
    return Response(ser.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_ticket_endpoint(request):
    """POST /api/submit — customer submits a new support request."""
    workspace_slug = request.data.get('workspace')
    w = Workspace.objects.filter(slug=workspace_slug).first()
    if not w:
        return Response({'detail': f"Workspace '{workspace_slug}' not found."}, status=404)

    try:
        result = submit_ticket(
            workspace=_workspace_dict(w),
            message=request.data.get('message', ''),
            user_id=request.data.get('name', 'guest'),
            user_email=request.data.get('email', ''),
        )
    except (FileNotFoundError, AttributeError) as e:
        return Response({'detail': f'Classification failed: {e}'}, status=500)

    if result['outcome'] == 'irrelevant':
        relevance = result['relevance']
        return Response({
            'success': False, 'relevant': False,
            'message': relevance['response'],
            'emergency': relevance.get('emergency', False),
            'emergency_text': relevance.get('emergency_text'),
        })

    if result['outcome'] == 'duplicate':
        return Response({
            'success': True, 'duplicate': True,
            'existing_ticket_id': result['ticket_id'],
            'category': result['category'],
            'urgency': result['urgency'],
            'message': f"This matches an existing ticket {result['ticket_id']} — "
                       f"we've noted you've mentioned it {result['duplicate_count']}x.",
        })

    return Response({
        'success': True,
        'ticket_id': result['ticket_id'],
        'category': result['category'],
        'urgency': result['urgency'],
        'message': f"Your issue has been logged. Ticket ID: {result['ticket_id']}",
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_ticket_status(request, slug, ticket_id):
    """GET /api/status/{slug}/{ticket_id} — customer tracks their ticket."""
    w = Workspace.objects.filter(slug=slug).first()
    if not w:
        return Response({'detail': f"Workspace '{slug}' not found."}, status=404)

    ticket = db.get_ticket(w.id, ticket_id)
    if not ticket:
        return Response(
            {'detail': f"Ticket '{ticket_id}' not found in workspace '{slug}'."},
            status=404,
        )

    return Response({
        'ticket_id': ticket['ticket_id'],
        'status': ticket['status'],
        'category': ticket['category'],
        'urgency': ticket['urgency'],
        'created_at': ticket['created_at'],
        'workspace_name': w.name,
    })
