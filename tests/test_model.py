"""
tests/test_model.py

Sanity checks on both trained classifiers and the urgency scorer.
Requires the models to be trained — run `python model/train_model.py` first.
"""

from pathlib import Path

import pytest

from utils.confidence import confidence_floor, is_out_of_scope
from utils.profiles import PROFILES
from utils.ticket_utils import classify_ticket, load_model
from utils.urgency import score_urgency

MODEL_DIR = Path("model/profiles")

pytestmark = pytest.mark.skipif(
    not all((MODEL_DIR / p / "ticket_classifier.pkl").exists() for p in PROFILES),
    reason="Models not trained yet — run `python model/train_model.py` first.",
)


@pytest.mark.parametrize("profile,text,expected_category", [
    ("it_support", "Wi-Fi keeps disconnecting", "Network"),
    ("it_support", "My laptop screen is flickering", "Hardware"),
    ("it_support", "Outlook won't open", "Software"),
    ("customer_support", "Where is my order? It hasn't arrived", "Shipping & Delivery"),
    ("customer_support", "I want a refund for this item", "Refund & Returns"),
])
def test_classify_ticket_predicts_expected_category(profile, text, expected_category):
    result = classify_ticket(text, profile=profile)
    assert result["category"] == expected_category


def test_each_profile_loads_independently():
    it_model = load_model("it_support")
    cs_model = load_model("customer_support")
    assert set(it_model.classes_) == {"Hardware", "Network", "Software"}
    assert set(cs_model.classes_) == {
        "Billing", "Product Issue", "Refund & Returns", "Sales Inquiry", "Shipping & Delivery"
    }


def test_classify_ticket_confidence_is_valid_probability():
    result = classify_ticket("My computer won't turn on", profile="it_support")
    assert 0.0 <= result["confidence"] <= 1.0


# --------------------------------------------------------------- Confidence
def test_confidence_floor_scales_with_category_count():
    # More categories -> lower random-guess baseline -> lower (but bounded) floor.
    three_way = confidence_floor(3)
    five_way = confidence_floor(5)
    assert five_way <= three_way
    assert 0.35 <= five_way <= 0.45
    assert 0.35 <= three_way <= 0.45


def test_is_out_of_scope_thresholding():
    assert is_out_of_scope(0.22, num_categories=5) is True
    assert is_out_of_scope(0.9, num_categories=5) is False


def test_classify_ticket_flags_out_of_scope_text():
    # An issue with nothing to do with any customer_support category
    # (Billing / Product Issue / Refund & Returns / Sales Inquiry /
    # Shipping & Delivery) should come back low-confidence and flagged.
    result = classify_ticket("I have neck pain", profile="customer_support")
    if result["confidence"] < result["confidence_floor"]:
        assert result["out_of_scope"] is True
        assert result["category"] == "Needs Review"
        assert result["raw_category"] in {
            "Billing", "Product Issue", "Refund & Returns", "Sales Inquiry", "Shipping & Delivery"
        }


def test_classify_ticket_confident_text_is_not_out_of_scope():
    result = classify_ticket("Wi-Fi keeps disconnecting", profile="it_support")
    assert result["out_of_scope"] is False
    assert result["category"] == "Network"
    assert result["raw_category"] == "Network"


# ------------------------------------------------------------------ Urgency
@pytest.mark.parametrize("text,confidence,expected", [
    ("This is urgent, my system is down", 0.9, "High"),
    ("I am furious, this is unacceptable, refund me now", 0.6, "High"),
    ("My order is delayed and I'm not sure why", 0.8, "Medium"),
    ("What's your return policy?", 0.95, "Low"),
])
def test_score_urgency_keyword_signals(text, confidence, expected):
    assert score_urgency(text, confidence) == expected


def test_score_urgency_low_confidence_bumps_to_medium():
    assert score_urgency("something vague and unclear", 0.3) == "Medium"
