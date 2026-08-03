"""
utils/ticket_utils.py

Classification helper, aware of business profiles. Each profile (e.g.
"it_support", "customer_support") has its own trained model under
model/profiles/<profile>/ticket_classifier.pkl.
"""

from pathlib import Path

import joblib

from backend.domain.confidence import NEEDS_REVIEW_LABEL, confidence_floor, is_out_of_scope

MODEL_DIR = Path(__file__).resolve().parents[2] / "storage" / "models" / "profiles"

_model_cache: dict[str, object] = {}


def load_model(profile: str):
    """Load (and cache) the trained classifier pipeline for a given profile."""
    if profile not in _model_cache:
        model_path = MODEL_DIR / profile / "ticket_classifier.pkl"
        if not model_path.exists():
            raise FileNotFoundError(
                f"No model found for profile '{profile}' at {model_path}. "
                f"Run `python -m backend.ml.train_model {profile}` first."
            )
        _model_cache[profile] = joblib.load(model_path)
    return _model_cache[profile]


def classify_ticket(text: str, profile: str, model=None):
    """
    Classify a ticket description using the given profile's model.

    Returns a dict with the top category + confidence, the runner-up
    category + confidence, and out-of-scope detection: if the top
    confidence is too close to a random guess for this profile's number
    of categories, `category` becomes "Needs Review" instead of a
    confident-looking but likely-wrong label, and `out_of_scope` is True.
    The model's actual top guess is preserved as `raw_category` either way,
    so a human reviewing it isn't starting from nothing.
    """
    if model is None:
        model = load_model(profile)

    probabilities = model.predict_proba([text])[0]
    labels = model.classes_

    ranked = sorted(zip(labels, probabilities), key=lambda pair: pair[1], reverse=True)

    primary_label, primary_conf = ranked[0]
    secondary_label, secondary_conf = ranked[1] if len(ranked) > 1 else (None, None)
    primary_conf = round(float(primary_conf), 4)

    out_of_scope = is_out_of_scope(primary_conf, len(labels))

    return {
        "category": NEEDS_REVIEW_LABEL if out_of_scope else primary_label,
        "confidence": primary_conf,
        "secondary_category": secondary_label,
        "secondary_confidence": round(float(secondary_conf), 4) if secondary_conf is not None else None,
        "raw_category": primary_label,
        "out_of_scope": out_of_scope,
        "confidence_floor": confidence_floor(len(labels)),
    }
