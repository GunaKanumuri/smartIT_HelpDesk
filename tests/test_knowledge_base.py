"""
tests/test_knowledge_base.py
"""

from backend.domain.knowledge_base import get_suggested_reply
from backend.domain.profiles import PROFILES, get_categories


def test_every_category_has_a_suggested_reply():
    """Every category in every trained profile should have a canned reply —
    catches the case where a new category is added to the training data
    but the knowledge base file wasn't updated to match."""
    for profile in PROFILES:
        for category in get_categories(profile):
            reply = get_suggested_reply(profile, category)
            assert reply, f"No suggested reply for {profile}/{category}"
            assert len(reply) > 20


def test_unknown_category_returns_none():
    assert get_suggested_reply("it_support", "Not A Real Category") is None
