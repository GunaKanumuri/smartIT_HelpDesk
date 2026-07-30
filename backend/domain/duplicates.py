"""
utils/duplicates.py

Duplicate/spam detection for ticket submissions. Nothing today stops
someone (accidentally double-clicking, or deliberately flooding) from
submitting the same message dozens of times, each spawning its own
ticket. This is a lightweight heuristic v1 — text-similarity matching
against a workspace's recent tickets — not a second ML model, in the
same spirit as urgency scoring.

Kept DB-agnostic (operates on plain dicts) so it's unit-testable without
a database, and reusable if the storage layer ever changes.
"""

import re
from difflib import SequenceMatcher

SIMILARITY_THRESHOLD = 0.85
# Repeated resubmission of the same issue is itself a signal something's
# wrong (an angry customer re-sending, or the same bug hitting them
# again) — auto-escalate once it crosses this many total submissions.
ESCALATE_AFTER_REPEATS = 3


def normalize(text: str) -> str:
    """Lowercase, collapse whitespace, strip punctuation — for comparison only."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text


def similarity(text_a: str, text_b: str) -> float:
    return SequenceMatcher(None, normalize(text_a), normalize(text_b)).ratio()


def find_duplicate(new_text: str, candidates: list[dict]) -> dict | None:
    """
    candidates: dicts with at least "ticket_id" and "issue_description",
    already narrowed by the caller to the same workspace/user and a
    reasonable time window (e.g. same workspace, last 24h).

    Returns the best-matching candidate dict (with a "similarity" key
    added) if it's at or above the threshold, else None. Ties broken by
    highest similarity.
    """
    best = None
    best_ratio = 0.0
    for candidate in candidates:
        ratio = similarity(new_text, candidate["issue_description"])
        if ratio >= SIMILARITY_THRESHOLD and ratio > best_ratio:
            best = {**candidate, "similarity": ratio}
            best_ratio = ratio
    return best


def should_escalate_for_repeats(duplicate_count: int) -> bool:
    """duplicate_count is the count *after* incrementing for this submission."""
    return duplicate_count >= ESCALATE_AFTER_REPEATS
