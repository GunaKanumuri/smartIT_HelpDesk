from django.db import models


class Workspace(models.Model):
    """Mirrors the existing `workspaces` table in sevak_ai.db."""
    id = models.IntegerField(primary_key=True)
    slug = models.TextField(unique=True)
    name = models.TextField()
    profile = models.TextField()
    sector = models.TextField(default='other')
    business_description = models.TextField(default='')
    contact_phone = models.TextField(default='')
    contact_email = models.TextField(default='')
    password_hash = models.TextField()
    password_salt = models.TextField()
    uses_custom_model = models.IntegerField(default=0)
    escalation_email = models.TextField(null=True, blank=True)
    ticket_prefix = models.TextField(default='')
    created_at = models.TextField()

    class Meta:
        managed = False
        db_table = 'workspaces'


class Ticket(models.Model):
    """Mirrors the existing `tickets` table."""
    id = models.IntegerField(primary_key=True)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, db_column='workspace_id')
    ticket_id = models.TextField()
    created_at = models.TextField()
    updated_at = models.TextField()
    resolved_at = models.TextField(null=True, blank=True)
    user_id = models.TextField()
    user_email = models.TextField(default='')
    issue_description = models.TextField()
    category = models.TextField()
    confidence = models.FloatField()
    secondary_category = models.TextField(null=True, blank=True)
    secondary_confidence = models.FloatField(null=True, blank=True)
    raw_category = models.TextField(null=True, blank=True)
    urgency = models.TextField(default='Low')
    status = models.TextField(default='Open')
    action_taken = models.TextField(default='')
    updated_by = models.TextField(default='')
    reassigned_to = models.TextField(default='')
    assigned_to_user_id = models.IntegerField(null=True, blank=True)
    duplicate_count = models.IntegerField(default=0)
    last_duplicate_at = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'tickets'
        unique_together = ('workspace', 'ticket_id')


class Escalation(models.Model):
    """Mirrors the existing `escalations` table."""
    id = models.IntegerField(primary_key=True)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, db_column='workspace_id')
    ticket_id = models.TextField()
    created_at = models.TextField()
    reason = models.TextField()
    channel = models.TextField()
    recipient = models.TextField(null=True, blank=True)
    status = models.TextField()
    detail = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'escalations'


class AdminSession(models.Model):
    """Mirrors the existing `admin_sessions` table."""
    token = models.TextField(primary_key=True)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, db_column='workspace_id')
    user_id = models.IntegerField(null=True, blank=True)
    created_at = models.TextField()
    expires_at = models.TextField()

    class Meta:
        managed = False
        db_table = 'admin_sessions'


class WorkspaceUser(models.Model):
    """Mirrors the existing `workspace_users` table."""
    id = models.IntegerField(primary_key=True)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, db_column='workspace_id')
    email = models.TextField()
    display_name = models.TextField(default='')
    password_hash = models.TextField()
    password_salt = models.TextField()
    role = models.TextField(default='agent')
    is_active = models.IntegerField(default=1)
    created_at = models.TextField()
    last_login_at = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'workspace_users'
        unique_together = ('workspace', 'email')


class AuditEvent(models.Model):
    """Mirrors the existing `audit_events` table."""
    id = models.IntegerField(primary_key=True)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, db_column='workspace_id')
    actor_user_id = models.IntegerField(null=True, blank=True)
    action = models.TextField()
    target_type = models.TextField()
    target_id = models.TextField(null=True, blank=True)
    detail = models.TextField(default='')
    created_at = models.TextField()

    class Meta:
        managed = False
        db_table = 'audit_events'
