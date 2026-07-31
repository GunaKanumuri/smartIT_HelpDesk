"""
backend/domain/ticket_utils.py

Classification helper, aware of business profiles. Each profile (e.g.
"it_support", "customer_support") has its own trained model under
storage/models/profiles/<profile>/ticket_classifier.pkl.

The public entry point `classify_ticket` routes through the circuit-breaker
runner (ml_runner) so a slow or crashing model can never hang the request
thread. `_classify_local` is the pure inference used internally.
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


def _classify_local(text: str, profile: str, model=None):
    """Pure classification — no circuit breaker, no thread wrapper.

    Returns a dict with category/confidence/raw_category. Used by
    ml_runner (to break the circular import) and by callers that want
    the raw result without fallback behaviour.
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


# Try to import the circuit-breaker runner; if unavailable (shouldn't happen),
# fall back to the pure local classifier.
try:
    from backend.domain.ml_runner import classify_with_fallback

    def classify_ticket(text: str, profile: str, model=None):
        """Classify with circuit-breaker + timeout protection."""
        if model is None:
            model = load_model(profile)
        return classify_with_fallback(text, profile, model=model)

except ImportError:
    classify_ticket = _classify_local
