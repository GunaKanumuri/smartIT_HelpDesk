import io
import os
import sys

import pandas as pd
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

# Ensure we can import from the project root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from api.models import Workspace, Ticket, Escalation, WorkspaceUser
from api.serializers import (
    WorkspaceInfoSerializer, TicketStatusSerializer,
    TicketOutSerializer, TicketUpdateSerializer,
    EscalationOutSerializer, ModelInfoSerializer,
    TrainMetricsSerializer, DashboardStatsSerializer,
    TeamUserOutSerializer, AddTeamMemberSerializer,
    UpdateTeamMemberSerializer,
    WorkspaceAdminInfoSerializer,
)
from backend.database import repository as db
from backend.services.ticket_pipeline import submit_ticket
from backend.domain.sectors import get_sector_name


# ─── Helper ────────────────────────────────────────────────────────────────


def _workspace_dict(w):
    """Convert a Django Workspace model instance to the dict format
    that backend.services.ticket_pipeline and admin_operations expect."""
    return {
        'id': w.id,
        'slug': w.slug,
        'name': w.name,
        'profile': w.profile,
        'sector': w.sector,
        'uses_custom_model': bool(w.uses_custom_model),
        'escalation_email': w.escalation_email,
    }


def _get_workspace_from_request(request):
    """Extract workspace from JWT token workspace_id claim."""
    workspace_id = request.user.id  # workspace_id stored as the user id in JWT
    w = Workspace.objects.filter(id=workspace_id).first()
    if not w:
        return None
    return w


# ─── Public Endpoints (no auth) ────────────────────────────────────────────


@api_view(['GET'])
def get_workspace_info(request, slug):
    """GET /api/workspace/{slug} — public workspace info."""
    w = Workspace.objects.filter(slug=slug).first()
    if not w:
        return Response({'detail': f"Workspace '{slug}' not found."}, status=404)
    ser = WorkspaceInfoSerializer(w)
    return Response(ser.data)


@api_view(['POST'])
def submit_ticket_endpoint(request):
    """POST /api/submit — public ticket submission."""
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
def get_ticket_status(request, slug, ticket_id):
    """GET /api/status/{slug}/{ticket_id} — public ticket status."""
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


# ─── Admin Endpoints (JWT required) ────────────────────────────────────────


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_me(request):
    """GET /api/admin/me — rehydrate session."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)
    return Response({
        'id': w.id, 'slug': w.slug, 'name': w.name,
        'profile': w.profile, 'sector': w.sector,
        'business_description': w.business_description or '',
        'contact_phone': w.contact_phone or '',
        'contact_email': w.contact_email or '',
        'uses_custom_model': bool(w.uses_custom_model),
        'escalation_email': w.escalation_email,
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_tickets(request, ticket_id=None):
    """GET /api/admin/tickets — list all tickets.
       PATCH /api/admin/tickets/{ticket_id} — update a ticket."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)

    if request.method == 'GET':
        from backend.services.admin_operations import list_tickets
        rows = list_tickets(w.id)
        return Response([dict(r) for r in rows])

    if request.method == 'PATCH':
        from backend.services.admin_operations import update_ticket
        ser = TicketUpdateSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        updated = update_ticket(
            workspace_id=w.id, ticket_id=ticket_id, **ser.validated_data,
        )
        if not updated:
            return Response({'detail': f"Ticket '{ticket_id}' not found."}, status=404)
        return Response(dict(updated))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_escalations(request):
    """GET /api/admin/escalations — escalation history."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)
    from backend.services.admin_operations import list_escalations
    rows = list_escalations(w.id)
    return Response([dict(r) for r in rows])


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def admin_escalation_email(request):
    """PUT /api/admin/escalation-email — set escalation email."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)
    email = request.data.get('email')
    from backend.services.admin_operations import set_escalation_email
    email = set_escalation_email(w.id, email)
    return Response({'success': True, 'escalation_email': email})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_model_info(request):
    """GET /api/admin/model — model info."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)
    from backend.services.admin_operations import get_model_info
    info = get_model_info(_workspace_dict(w))
    return Response(info)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def admin_model_active(request):
    """PUT /api/admin/model/active — toggle active model."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)
    use_custom = request.data.get('use_custom', False)
    from backend.services.admin_operations import set_model_active, NoCustomModelError
    try:
        set_model_active(w.id, w.slug, use_custom)
    except NoCustomModelError as e:
        return Response({'detail': str(e)}, status=400)
    return Response({'success': True, 'uses_custom_model': use_custom})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_train_model(request):
    """POST /api/admin/train — upload CSV and train model."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)

    file = request.FILES.get('file')
    if not file:
        return Response({'detail': 'No file provided.'}, status=400)

    try:
        upload_df = pd.read_csv(io.BytesIO(file.read()))
    except Exception as e:
        return Response({'detail': f"Couldn't read that file as a CSV: {e}"}, status=400)

    from backend.services.admin_operations import train_model
    is_valid, message, metrics = train_model(w.slug, upload_df)
    if not is_valid:
        return Response({'detail': message}, status=422)

    return Response(metrics)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_team_list(request):
    """GET /api/admin/team — list team members."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)
    rows = db.list_workspace_users(w.id)
    return Response([dict(r) for r in rows])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_team_add(request):
    """POST /api/admin/team — add team member."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)
    ser = AddTeamMemberSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=400)
    try:
        user_id = db.create_workspace_user(
            workspace_id=w.id,
            email=ser.validated_data['email'],
            password=ser.validated_data['password'],
            role=ser.validated_data.get('role', 'agent'),
            display_name=ser.validated_data.get('display_name', ''),
        )
    except ValueError as e:
        return Response({'detail': str(e)}, status=400)
    user = db.get_workspace_user(w.id, user_id)
    return Response(dict(user), status=201)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_team_member(request, user_id):
    """PATCH /api/admin/team/{user_id} — update member.
       DELETE /api/admin/team/{user_id} — deactivate member."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)

    if request.method == 'PATCH':
        ser = UpdateTeamMemberSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        if ser.validated_data.get('is_active') is not None:
            try:
                db.set_workspace_user_active(
                    workspace_id=w.id, user_id=int(user_id),
                    active=ser.validated_data['is_active'],
                )
            except ValueError as e:
                return Response({'detail': str(e)}, status=400)
        return Response({'success': True})

    # DELETE — soft delete (deactivate)
    try:
        db.set_workspace_user_active(
            workspace_id=w.id, user_id=int(user_id), active=False,
        )
    except ValueError as e:
        return Response({'detail': str(e)}, status=400)
    return Response({'success': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    """GET /api/admin/stats — dashboard statistics."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)

    tickets = db.get_all_tickets(w.id)
    users = db.list_workspace_users(w.id)

    total = len(tickets)
    open_count = sum(1 for t in tickets if t['status'] == 'Open')
    high_count = sum(1 for t in tickets if t['urgency'] == 'High')
    needs_review = sum(1 for t in tickets if t['category'] == 'Needs Review')
    avg_conf = (sum(t['confidence'] for t in tickets) / total) if total > 0 else 0.0

    return Response({
        'total_tickets': total,
        'open_tickets': open_count,
        'high_urgency': high_count,
        'needs_review': needs_review,
        'avg_confidence': round(avg_conf, 4),
        'total_users': len(users),
    })
