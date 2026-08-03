"""
backend/api/client_views.py

Endpoints for CLIENT ADMINS & STAFF (workspace owners and their team).
These are protected by WorkspaceJWTAuthentication and scoped to the
logged-in workspace only — no client can ever see another's data.
"""

import io
import pandas as pd
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import Workspace
from api.serializers import (
    TicketUpdateSerializer, AddTeamMemberSerializer, UpdateTeamMemberSerializer,
)
from backend.database import repository as db


def _get_workspace_from_request(request):
    """Extract the workspace for the currently authenticated user."""
    workspace_id = request.user.id
    return Workspace.objects.filter(id=workspace_id).first()


def _workspace_dict(w):
    return {
        'id': w.id, 'slug': w.slug, 'name': w.name, 'profile': w.profile,
        'sector': w.sector, 'uses_custom_model': bool(w.uses_custom_model),
        'escalation_email': w.escalation_email,
    }


# ─── Workspace Settings ──────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_me(request):
    """GET /api/admin/me — rehydrate the logged-in workspace session."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)
    return Response({
        'id': w.id, 'slug': w.slug, 'name': w.name,
        'profile': w.profile, 'sector': w.sector,
        'business_description': w.business_description or '',
        'contact_phone': w.contact_phone or '',
        'contact_email': w.contact_email or '',
        'ticket_prefix': w.ticket_prefix or '',
        'uses_custom_model': bool(w.uses_custom_model),
        'escalation_email': w.escalation_email,
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def admin_escalation_email(request):
    """PUT /api/admin/escalation-email — set escalation notification email."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)
    email = request.data.get('email')
    from backend.services.admin_operations import set_escalation_email
    email = set_escalation_email(w.id, email)
    return Response({'success': True, 'escalation_email': email})


# ─── Ticket Management ───────────────────────────────────────────────────────

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_tickets(request, ticket_id=None):
    """GET /api/admin/tickets — list all tickets in workspace.
       PATCH /api/admin/tickets/{ticket_id} — update a ticket."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)

    if request.method == 'GET':
        from backend.services.admin_operations import list_tickets
        # Optional ?mine=1 — filter to tickets assigned to the logged-in user
        mine = request.query_params.get('mine', '')
        if mine in ('1', 'true'):
            user_id = getattr(request.user, 'user_id', None)
            rows = db.get_all_tickets(w.id, assigned_to_user_id=user_id)
        else:
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


# ─── Escalation History ──────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_escalations(request):
    """GET /api/admin/escalations — escalation audit trail for workspace."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)
    from backend.services.admin_operations import list_escalations
    rows = list_escalations(w.id)
    return Response([dict(r) for r in rows])


# ─── ML Model Management ─────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_model_info(request):
    """GET /api/admin/model — info about the active classification model."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)
    from backend.services.admin_operations import get_model_info
    info = get_model_info(_workspace_dict(w))
    return Response(info)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def admin_model_active(request):
    """PUT /api/admin/model/active — toggle between preset and custom model."""
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
    """POST /api/admin/train — upload CSV and train a custom model."""
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


# ─── Team Management ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_team_list(request):
    """GET /api/admin/team — list team members in workspace."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)
    rows = db.list_workspace_users(w.id)
    return Response([dict(r) for r in rows])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_team_add(request):
    """POST /api/admin/team — add a new team member."""
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_logout_all(request):
    """POST /api/admin/logout-all — revoke all active sessions for this workspace.
    Use after a suspected compromise or when an employee leaves."""
    w = _get_workspace_from_request(request)
    if not w:
        return Response({'detail': 'Workspace not found.'}, status=404)
    db.revoke_all_sessions(w.id)
    return Response({'success': True, 'message': 'All sessions revoked.'})


# ─── Dashboard Stats ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    """GET /api/admin/stats — dashboard statistics for workspace."""
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
