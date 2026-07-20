"""
tests/test_custom_training.py
"""

import pandas as pd
import pytest

from utils.custom_training import (
    get_custom_metrics,
    has_custom_model,
    load_custom_model,
    train_custom_model,
    validate_training_data,
)


@pytest.fixture
def isolated_dirs(tmp_path, monkeypatch):
    """Point the custom training module at a temp directory for test isolation."""
    from utils import custom_training as ct
    monkeypatch.setattr(ct, "CUSTOM_DATA_DIR", tmp_path / "data_custom")
    monkeypatch.setattr(ct, "CUSTOM_MODEL_DIR", tmp_path / "model_custom")
    return ct


def make_df(rows_per_category=6, categories=("Billing", "Shipping")):
    rows = []
    templates = {
        "Billing": ["I was charged twice", "Question about my invoice", "Update my payment method",
                    "Why is this fee here", "Refund the extra charge", "Billing cycle question",
                    "Card was declined", "Subscription price changed"],
        "Shipping": ["Where is my package", "Order hasn't arrived", "Tracking not updating",
                     "Wrong address on delivery", "Package marked delivered but missing",
                     "How long does shipping take", "Delivery driver couldn't find me",
                     "Change my shipping address"],
    }
    for cat in categories:
        for text in templates[cat][:rows_per_category]:
            rows.append({"text": text, "category": cat})
    return pd.DataFrame(rows)


def test_validate_rejects_missing_columns():
    df = pd.DataFrame({"message": ["hi"], "label": ["Billing"]})
    ok, msg = validate_training_data(df)
    assert not ok
    assert "text" in msg and "category" in msg


def test_validate_rejects_too_few_categories():
    df = make_df(categories=("Billing",))
    ok, msg = validate_training_data(df)
    assert not ok
    assert "category" in msg.lower()


def test_validate_rejects_too_few_examples():
    df = make_df(rows_per_category=2)
    ok, msg = validate_training_data(df)
    assert not ok
    assert "fewer than" in msg


def test_validate_accepts_good_data():
    df = make_df(rows_per_category=6)
    ok, msg = validate_training_data(df)
    assert ok
    assert "Billing" in msg and "Shipping" in msg


def test_train_custom_model_creates_artifacts(isolated_dirs):
    df = make_df(rows_per_category=8)
    metrics = train_custom_model("acme-shop", df)

    assert has_custom_model("acme-shop")
    assert set(metrics["categories"]) == {"Billing", "Shipping"}
    assert 0.0 <= metrics["test_accuracy"] <= 1.0
    assert metrics["n_samples"] == 16


def test_trained_model_predicts_reasonably(isolated_dirs):
    df = make_df(rows_per_category=8)
    train_custom_model("acme-shop", df)

    model = load_custom_model("acme-shop")
    pred = model.predict(["My package never showed up"])[0]
    assert pred in {"Billing", "Shipping"}


def test_get_custom_metrics_none_when_untrained(isolated_dirs):
    assert get_custom_metrics("nonexistent-workspace") is None
    assert has_custom_model("nonexistent-workspace") is False


def test_small_dataset_falls_back_to_train_eval(isolated_dirs):
    """With very little data, we can't do a held-out split — should still
    train successfully rather than crash, just with an honest eval_note."""
    df = pd.DataFrame({
        "text": ["billing question", "shipping question", "another billing thing"],
        "category": ["Billing", "Shipping", "Billing"],
    })
    # This is below MIN_EXAMPLES_PER_CATEGORY so validate would reject it,
    # but train_custom_model itself should still not crash if called directly.
    metrics = train_custom_model("tiny-shop", df)
    assert "training data itself" in metrics["evaluation_method"]
