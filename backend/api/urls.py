from django.urls import path, re_path

from api import platform_views as pviews
from api import client_views as cviews
from api import customer_views as uviews

urlpatterns = [
    # ── Platform: health / observability / tenant management ──
    path('health', pviews.health),
    path('platform/stats', pviews.platform_stats),
    path('platform/workspaces', pviews.platform_workspaces),

    # ── Customer (public, unauthenticated): workspace info, ticket submit/track ──
    path('workspace/<str:slug>', uviews.get_workspace_info),
    path('submit', uviews.submit_ticket_endpoint),
    re_path(r'^status/(?P<slug>[^/]+)/(?P<ticket_id>[^/]+)$', uviews.get_ticket_status),

    # ── Client Admin (JWT): workspace settings, tickets, team, ML, stats ──
    path('admin/me', cviews.admin_me),
    path('admin/tickets', cviews.admin_tickets),
    re_path(r'^admin/tickets/(?P<ticket_id>[^/]+)$', cviews.admin_tickets),
    path('admin/escalations', cviews.admin_escalations),
    path('admin/escalation-email', cviews.admin_escalation_email),
    path('admin/model', cviews.admin_model_info),
    path('admin/model/active', cviews.admin_model_active),
    path('admin/train', cviews.admin_train_model),
    path('admin/team', cviews.admin_team_list),
    path('admin/team/add', cviews.admin_team_add),
    re_path(r'^admin/team/(?P<user_id>\d+)$', cviews.admin_team_member),
    path('admin/logout-all', cviews.admin_logout_all),
    path('admin/stats', cviews.admin_stats),
]
