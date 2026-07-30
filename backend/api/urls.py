from django.urls import path, re_path
from api import views

urlpatterns = [
    # Public endpoints
    path('workspace/<str:slug>', views.get_workspace_info),
    path('submit', views.submit_ticket_endpoint),
    re_path(r'^status/(?P<slug>[^/]+)/(?P<ticket_id>[^/]+)$', views.get_ticket_status),

    # Admin endpoints (JWT protected)
    path('admin/me', views.admin_me),
    path('admin/tickets', views.admin_tickets),
    re_path(r'^admin/tickets/(?P<ticket_id>[^/]+)$', views.admin_tickets),
    path('admin/escalations', views.admin_escalations),
    path('admin/escalation-email', views.admin_escalation_email),
    path('admin/model', views.admin_model_info),
    path('admin/model/active', views.admin_model_active),
    path('admin/train', views.admin_train_model),
    path('admin/team', views.admin_team_list),
    path('admin/team/add', views.admin_team_add),
    re_path(r'^admin/team/(?P<user_id>\d+)$', views.admin_team_member),
    path('admin/stats', views.admin_stats),
]
