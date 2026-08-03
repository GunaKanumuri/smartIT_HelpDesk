# =============================================================================
# tests/test_sectors.py
#
# Tests for the sector registry (utils/sectors.py).
#
# TABLE OF CONTENTS
# -----------------
# 1. REGISTRY COMPLETENESS — All 13 sectors exist with required keys
# 2. HELPER FUNCTIONS      — Sector lookups, validation, choices
# 3. EMERGENCY DETECTION   — Cross-sector emergency keyword detection
# =============================================================================

"""
tests/test_sectors.py

Tests for the sector registry. Verifies all 13 sectors are present,
have required keys, and helper functions work correctly.
"""

import pytest

from backend.domain.sectors import (
    SECTORS,
    get_default_categories,
    get_sector,
    get_sector_choices,
    get_sector_keywords,
    get_sector_name,
    has_emergency_keywords,
    is_valid_sector,
)

EXPECTED_SECTORS = [
    "bakery", "plumbing", "restaurant", "ecommerce", "legal",
    "medical", "saas", "real_estate", "automotive", "salon",
    "fitness", "education", "other",
]

REQUIRED_KEYS = ["name", "keywords", "default_categories", "irrelevant_response", "emergency_redirect"]

# =============================================================================
# region 1. REGISTRY COMPLETENESS
# =============================================================================


class TestRegistryCompleteness:
    """Verify all 13 sectors exist with correct structure."""

    def test_all_13_sectors_exist(self):
        for sector_id in EXPECTED_SECTORS:
            assert sector_id in SECTORS, f"Missing sector: {sector_id}"

    def test_exactly_13_sectors(self):
        assert len(SECTORS) == 13

    @pytest.mark.parametrize("sector_id", EXPECTED_SECTORS)
    def test_sector_has_required_keys(self, sector_id):
        sector = SECTORS[sector_id]
        for key in REQUIRED_KEYS:
            assert key in sector, f"Sector '{sector_id}' missing key: {key}"

    @pytest.mark.parametrize("sector_id", EXPECTED_SECTORS)
    def test_sector_has_name_string(self, sector_id):
        assert isinstance(SECTORS[sector_id]["name"], str)
        assert len(SECTORS[sector_id]["name"]) > 0

    @pytest.mark.parametrize("sector_id", EXPECTED_SECTORS)
    def test_sector_keywords_is_list(self, sector_id):
        assert isinstance(SECTORS[sector_id]["keywords"], list)

    @pytest.mark.parametrize("sector_id", EXPECTED_SECTORS)
    def test_sector_has_default_categories(self, sector_id):
        cats = SECTORS[sector_id]["default_categories"]
        assert isinstance(cats, list)
        assert len(cats) >= 1

    def test_other_sector_has_empty_keywords(self):
        """'other' sector should have no keywords — no sector filtering."""
        assert SECTORS["other"]["keywords"] == []

    def test_other_sector_has_no_irrelevant_response(self):
        """'other' sector should not filter anything."""
        assert SECTORS["other"]["irrelevant_response"] is None


# endregion

# =============================================================================
# region 2. HELPER FUNCTIONS
# =============================================================================


class TestHelperFunctions:
    """Test sector lookup and validation functions."""

    def test_get_sector_valid(self):
        sector = get_sector("bakery")
        assert sector is not None
        assert sector["name"] == "Bakery & Confectionery"

    def test_get_sector_invalid(self):
        assert get_sector("nonexistent") is None

    def test_get_sector_name_valid(self):
        assert get_sector_name("plumbing") == "Plumbing & Home Services"

    def test_get_sector_name_invalid_returns_id(self):
        assert get_sector_name("nonexistent") == "nonexistent"

    def test_get_sector_choices_returns_all(self):
        choices = get_sector_choices()
        assert len(choices) == 13
        assert isinstance(choices, dict)
        assert "bakery" in choices

    def test_get_sector_keywords_valid(self):
        keywords = get_sector_keywords("bakery")
        assert isinstance(keywords, list)
        assert "cake" in keywords
        assert "bread" in keywords

    def test_get_sector_keywords_invalid(self):
        assert get_sector_keywords("nonexistent") == []

    def test_get_default_categories(self):
        cats = get_default_categories("bakery")
        assert isinstance(cats, list)
        assert "Orders & Delivery" in cats

    def test_get_default_categories_invalid(self):
        assert get_default_categories("nonexistent") == []

    def test_is_valid_sector_true(self):
        assert is_valid_sector("bakery") is True
        assert is_valid_sector("other") is True

    def test_is_valid_sector_false(self):
        assert is_valid_sector("nonexistent") is False
        assert is_valid_sector("") is False


# endregion

# =============================================================================
# region 3. EMERGENCY DETECTION
# =============================================================================


class TestEmergencyDetection:
    """Test cross-sector emergency keyword detection."""

    def test_detects_suicide_mention(self):
        assert has_emergency_keywords("I want to kill myself") is True

    def test_detects_heart_attack(self):
        assert has_emergency_keywords("I think I'm having a heart attack") is True

    def test_detects_call_911(self):
        assert has_emergency_keywords("please call 911") is True

    def test_no_emergency_in_normal_text(self):
        assert has_emergency_keywords("My cake order is late") is False

    def test_no_emergency_in_complaint(self):
        assert has_emergency_keywords("I'm very frustrated with the service") is False

    def test_case_insensitive_emergency(self):
        assert has_emergency_keywords("HEART ATTACK HELP") is True


# endregion
