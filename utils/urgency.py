"""
utils/urgency.py

Heuristic urgency scoring: combines the classifier's confidence with a
keyword signal to flag Low / Medium / High urgency.

This is intentionally a rule-based v1, not a second ML model — it's fast,
transparent, and easy to tune per business. A natural "v2" roadmap item is
training a dedicated urgency classifier once there's enough labeled data
on real resolution times.
"""

import re

HIGH_URGENCY_KEYWORDS = [
    "urgent", "asap", "immediately", "emergency", "critical",
    "not working", "won't work", "broken", "down", "outage",
    "can't access", "cannot access", "locked out", "security",
    "data loss", "lost my", "scam", "fraud", "unauthorized",
    "lawsuit", "legal", "refund now", "cancel my account",
    "angry", "furious", "unacceptable", "third time",
]

MEDIUM_URGENCY_KEYWORDS = [
    "soon", "when will", "still waiting", "haven't received",
    "delay", "delayed", "late", "issue", "problem", "error",
    "wrong", "missing", "damaged", "defective",
]


def score_urgency(text: str, confidence: float) -> str:
    """
    Return 'High', 'Medium', or 'Low' urgency for a ticket.

    Keyword signals take priority over confidence, since a low-confidence
    classification of an angry message is still urgent. Low classifier
    confidence on its own bumps a ticket to at least Medium, since it
    likely needs a human to sort out the right category anyway.
    """
    lowered = text.lower()

    if any(re.search(rf"\b{re.escape(kw)}\b", lowered) for kw in HIGH_URGENCY_KEYWORDS):
        return "High"

    if any(re.search(rf"\b{re.escape(kw)}\b", lowered) for kw in MEDIUM_URGENCY_KEYWORDS):
        return "Medium"

    if confidence < 0.5:
        return "Medium"

    return "Low"
