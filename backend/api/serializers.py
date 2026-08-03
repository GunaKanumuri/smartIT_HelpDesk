from rest_framework import serializers
from api.models import Workspace, Ticket, Escalation, WorkspaceUser


class WorkspaceInfoSerializer(serializers.Serializer):
    """Public workspace info — no sensitive fields."""
    name = serializers.CharField()
    sector = serializers.CharField()
    sector_name = serializers.SerializerMethodField()
    business_description = serializers.CharField()
    contact_phone = serializers.CharField()
    contact_email = serializers.CharField()

    def get_sector_name(self, obj):
        from backend.domain.sectors import get_sector_name
        return get_sector_name(obj.sector)


class TicketSubmissionSerializer(serializers.Serializer):
    workspace = serializers.CharField()
    name = serializers.CharField(default='guest')
    email = serializers.CharField(default='')
    message = serializers.CharField()


class TicketStatusSerializer(serializers.Serializer):
    ticket_id = serializers.CharField()
    status = serializers.CharField()
    category = serializers.CharField()
    urgency = serializers.CharField()
    created_at = serializers.CharField()
    workspace_name = serializers.CharField()


class TicketOutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = '__all__'


class TicketUpdateSerializer(serializers.Serializer):
    status = serializers.CharField()
    action_taken = serializers.CharField(default='')
    updated_by = serializers.CharField(default='')
    reassigned_to = serializers.CharField(default='')


class EscalationOutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Escalation
        fields = '__all__'


class ModelInfoSerializer(serializers.Serializer):
    label = serializers.CharField()
    categories = serializers.ListField(child=serializers.CharField())
    accuracy = serializers.FloatField(allow_null=True)
    is_custom_active = serializers.BooleanField()
    has_custom_model = serializers.BooleanField()
    custom_metrics = serializers.DictField(allow_null=True)


class ModelActiveSerializer(serializers.Serializer):
    use_custom = serializers.BooleanField()


class TrainMetricsSerializer(serializers.Serializer):
    workspace_slug = serializers.CharField()
    test_accuracy = serializers.FloatField()
    evaluation_method = serializers.CharField()
    classification_report = serializers.DictField()
    n_samples = serializers.IntegerField()
    categories = serializers.ListField(child=serializers.CharField())


class WorkspaceAdminInfoSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    slug = serializers.CharField()
    name = serializers.CharField()
    profile = serializers.CharField()
    sector = serializers.CharField()
    business_description = serializers.CharField()
    contact_phone = serializers.CharField()
    contact_email = serializers.CharField()
    uses_custom_model = serializers.BooleanField()
    escalation_email = serializers.CharField(allow_null=True, allow_blank=True)


class TeamUserOutSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    workspace_id = serializers.IntegerField()
    email = serializers.CharField()
    display_name = serializers.CharField()
    role = serializers.CharField()
    is_active = serializers.IntegerField()
    created_at = serializers.CharField()
    last_login_at = serializers.CharField(allow_null=True, allow_blank=True)


class AddTeamMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8)
    role = serializers.CharField(default='agent')
    display_name = serializers.CharField(default='')


class UpdateTeamMemberSerializer(serializers.Serializer):
    role = serializers.CharField(required=False)
    is_active = serializers.BooleanField(required=False)


class DashboardStatsSerializer(serializers.Serializer):
    total_tickets = serializers.IntegerField()
    open_tickets = serializers.IntegerField()
    high_urgency = serializers.IntegerField()
    needs_review = serializers.IntegerField()
    avg_confidence = serializers.FloatField()
    total_users = serializers.IntegerField()
