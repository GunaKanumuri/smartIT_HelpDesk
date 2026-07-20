"""
tests/test_duplicates.py

Pure-logic tests for utils/duplicates.py — no database involved.
"""

from utils.duplicates import (
    ESCALATE_AFTER_REPEATS,
    find_duplicate,
    normalize,
    should_escalate_for_repeats,
    similarity,
)


def test_normalize_strips_punctuation_and_case():
    assert normalize("My Order Hasn't Arrived!!") == "my order hasnt arrived"


def test_similarity_identical_text_is_1():
    assert similarity("my order hasn't arrived", "My Order Hasn't Arrived!") == 1.0


def test_similarity_unrelated_text_is_low():
    assert similarity("my order hasn't arrived", "I want a refund immediately") < 0.5


def test_find_duplicate_matches_near_identical_text():
    candidates = [
        {"ticket_id": "TCK1001", "issue_description": "My order hasn't arrived yet", "duplicate_count": 0},
        {"ticket_id": "TCK1002", "issue_description": "I was charged twice", "duplicate_count": 0},
    ]
    result = find_duplicate("my order hasnt arrived yet!!", candidates)
    assert result is not None
    assert result["ticket_id"] == "TCK1001"
    assert result["similarity"] >= 0.85


def test_find_duplicate_returns_none_when_nothing_matches():
    candidates = [
        {"ticket_id": "TCK1001", "issue_description": "My order hasn't arrived yet", "duplicate_count": 0},
    ]
    assert find_duplicate("I want a refund for a damaged item", candidates) is None


def test_find_duplicate_picks_best_match_among_several():
    candidates = [
        {"ticket_id": "TCK1001", "issue_description": "my order is late", "duplicate_count": 0},
        {"ticket_id": "TCK1002", "issue_description": "my order hasn't arrived yet", "duplicate_count": 2},
    ]
    result = find_duplicate("my order hasn't arrived yet", candidates)
    assert result["ticket_id"] == "TCK1002"


def test_should_escalate_for_repeats_threshold():
    assert should_escalate_for_repeats(ESCALATE_AFTER_REPEATS - 1) is False
    assert should_escalate_for_repeats(ESCALATE_AFTER_REPEATS) is True
    assert should_escalate_for_repeats(ESCALATE_AFTER_REPEATS + 5) is True
