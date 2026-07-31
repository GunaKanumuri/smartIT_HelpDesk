"""
utils/active_model.py

Resolves which model + category set a workspace should actually use:
their custom-trained model if they have one and it's switched on,
otherwise the preset profile they picked at signup. Both app.py and
the admin dashboard need this exact same logic, so it lives in one place.
"""

from backend.domain.custom_training import get_custom_metrics, has_custom_model, load_custom_model
from backend.domain.profiles import PROFILES, get_accuracy, get_categories
from backend.domain.ticket_utils import load_model


def resolve_active_model(workspace: dict):
    """
    Returns (model, categories, accuracy, label, is_custom) for a workspace.
    Raises FileNotFoundError if neither a custom nor preset model is available.
    """
    slug = workspace["slug"]
    profile = workspace.get("profile") or workspace.get("sector", "customer_support")
    if profile not in ["it_support", "customer_support"]:
        profile = "customer_support"  # fallback to general support if sector model not trained yet

    if workspace.get("uses_custom_model") and has_custom_model(slug):
        model = load_custom_model(slug)
        metrics = get_custom_metrics(slug) or {}
        categories = metrics.get("categories", [])
        accuracy = metrics.get("test_accuracy")
        label = f"Custom-trained model ({metrics.get('n_samples', '?')} examples)"
        return model, categories, accuracy, label, True

    model = load_model(profile)  # raises FileNotFoundError if missing
    categories = get_categories(profile)
    accuracy = get_accuracy(profile)
    label = PROFILES.get(profile, profile)
    return model, categories, accuracy, label, False
