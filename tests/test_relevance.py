# =============================================================================
# tests/test_relevance.py
#
# Tests for the sector relevance filter (utils/relevance.py).
#
# TABLE OF CONTENTS
# -----------------
# 1. RELEVANT MESSAGES     — Messages that should pass through
# 2. IRRELEVANT MESSAGES   — Messages that should be rejected
# 3. EDGE CASES            — Ambiguous, emergency, other sector
# 4. HELPER FUNCTIONS      — Keyword counting tests
# =============================================================================

"""
tests/test_relevance.py

Tests for the sector relevance filter. Verifies that irrelevant messages
(bakery gets neck pain) are caught, relevant messages pass through, and
edge cases are handled correctly.
"""

import pytest

from utils.relevance import check_relevance, count_keyword_matches
from utils.sectors import has_emergency_keywords

# =============================================================================
# region 1. RELEVANT MESSAGES — should pass through to ML classifier
# =============================================================================


class TestRelevantMessages:
    """Messages that ARE relevant to the business sector — should pass."""

    def test_bakery_cake_order(self):
        result = check_relevance(
            "My birthday cake order for Saturday hasn't been confirmed",
            "bakery",
            "Sweet Bakes Bakery",
        )
        assert result["relevant"] is True

    def test_bakery_bread_quality(self):
        result = check_relevance(
            "The bread I bought yesterday was stale",
            "bakery",
            "Sweet Bakes Bakery",
        )
        assert result["relevant"] is True

    def test_plumbing_pipe_leak(self):
        result = check_relevance(
            "My pipe is leaking badly in the basement",
            "plumbing",
            "Joe's Plumbing",
        )
        assert result["relevant"] is True

    def test_restaurant_reservation(self):
        result = check_relevance(
            "I'd like to make a reservation for 4 people tonight",
            "restaurant",
            "Mama Mia's",
        )
        assert result["relevant"] is True

    def test_ecommerce_shipping(self):
        result = check_relevance(
            "Where is my order? Tracking says it was shipped 5 days ago",
            "ecommerce",
            "ShopPlus",
        )
        assert result["relevant"] is True

    def test_saas_bug_report(self):
        result = check_relevance(
            "The login page keeps showing an error when I enter my password",
            "saas",
            "CloudApp Inc",
        )
        assert result["relevant"] is True

    def test_salon_appointment(self):
        result = check_relevance(
            "I need to cancel my haircut appointment for tomorrow",
            "salon",
            "Style Studio",
        )
        assert result["relevant"] is True

    def test_fitness_membership(self):
        result = check_relevance(
            "How do I cancel my gym membership?",
            "fitness",
            "FitZone",
        )
        assert result["relevant"] is True


# endregion

# =============================================================================
# region 2. IRRELEVANT MESSAGES — should be flagged and rejected
# =============================================================================


class TestIrrelevantMessages:
    """Messages that are NOT relevant to the business sector."""

    def test_bakery_neck_pain(self):
        """The canonical example: bakery gets a medical complaint."""
        result = check_relevance(
            "I have emergency neck pain and need to see a doctor",
            "bakery",
            "Sweet Bakes Bakery",
        )
        assert result["relevant"] is False
        assert result["off_topic_domain"] == "medical"
        assert "Sweet Bakes Bakery" in result["response"]

    def test_plumbing_laptop(self):
        """Plumber gets a tech support request."""
        result = check_relevance(
            "My laptop won't boot and the software keeps crashing",
            "plumbing",
            "Joe's Plumbing",
        )
        assert result["relevant"] is False
        assert result["off_topic_domain"] == "tech"

    def test_bakery_legal_advice(self):
        """Bakery gets asked for legal advice."""
        result = check_relevance(
            "I need a lawyer for my court case and trial date",
            "bakery",
            "Sweet Bakes Bakery",
        )
        assert result["relevant"] is False
        assert result["off_topic_domain"] == "legal"

    def test_salon_car_repair(self):
        """Salon gets a car repair request."""
        result = check_relevance(
            "My car engine is making strange noises and the brake pads need replacing",
            "salon",
            "Style Studio",
        )
        assert result["relevant"] is False
        assert result["off_topic_domain"] == "automotive"

    def test_irrelevant_response_includes_business_name(self):
        """The rejection message should include the business name."""
        result = check_relevance(
            "I need to see a doctor about my symptoms and diagnosis",
            "bakery",
            "Cupcake Corner",
        )
        assert result["relevant"] is False
        assert "Cupcake Corner" in result["response"]


# endregion

# =============================================================================
# region 3. EDGE CASES
# =============================================================================


class TestEdgeCases:
    """Ambiguous messages, emergency keywords, 'other' sector."""

    def test_other_sector_passes_everything(self):
        """The 'other' sector should never filter — it's a catch-all."""
        result = check_relevance(
            "I have emergency neck pain",
            "other",
            "Generic Business",
        )
        assert result["relevant"] is True

    def test_ambiguous_message_passes(self):
        """A vague message with no sector matches AND no off-topic matches
        should pass through (benefit of the doubt)."""
        result = check_relevance(
            "hello, I have a question about something",
            "bakery",
            "Sweet Bakes Bakery",
        )
        assert result["relevant"] is True

    def test_emergency_keywords_detected(self):
        """Emergency keywords should be flagged even in relevant messages."""
        result = check_relevance(
            "I think I'm having a heart attack after eating your cake",
            "bakery",
            "Sweet Bakes Bakery",
        )
        # "cake" makes it relevant, but emergency should still be flagged
        assert result["relevant"] is True
        assert result["emergency"] is True

    def test_unknown_sector_passes_everything(self):
        """An unrecognized sector ID should behave like 'other'."""
        result = check_relevance(
            "I have emergency neck pain",
            "nonexistent_sector",
            "Mystery Business",
        )
        assert result["relevant"] is True

    def test_single_keyword_match_is_enough(self):
        """Even one sector keyword match should make the message relevant."""
        result = check_relevance(
            "I want to ask about delivery options for a large event",
            "bakery",
            "Sweet Bakes Bakery",
        )
        assert result["relevant"] is True  # "delivery" matches


# endregion

# =============================================================================
# region 4. HELPER FUNCTIONS
# =============================================================================


class TestHelperFunctions:
    """Tests for keyword counting and emergency detection."""

    def test_count_keyword_matches_single_word(self):
        count = count_keyword_matches("My cake order is late", ["cake", "bread", "order"])
        assert count == 2

    def test_count_keyword_matches_multi_word(self):
        count = count_keyword_matches(
            "The hot water heater is broken",
            ["hot water", "heater", "pipe"],
        )
        assert count == 2  # "hot water" (multi-word) + "heater" (single)

    def test_count_keyword_matches_case_insensitive(self):
        count = count_keyword_matches("MY CAKE ORDER", ["cake", "order"])
        assert count == 2

    def test_count_keyword_matches_empty_keywords(self):
        count = count_keyword_matches("anything at all", [])
        assert count == 0

    def test_emergency_keywords_positive(self):
        assert has_emergency_keywords("I think I'm having a heart attack") is True
        assert has_emergency_keywords("please call 911 immediately") is True

    def test_emergency_keywords_negative(self):
        assert has_emergency_keywords("My cake order is late") is False
        assert has_emergency_keywords("The appointment was good") is False


# endregion
