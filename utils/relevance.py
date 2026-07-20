# =============================================================================
# utils/relevance.py
#
# Sector relevance filter — runs BEFORE the ML classifier to catch messages
# that are completely unrelated to the business type. Solves the
# "bakery gets neck pain" problem.
#
# TABLE OF CONTENTS
# -----------------
# 1. CONSTANTS            — Thresholds and configuration
# 2. TEXT ANALYSIS         — Keyword overlap and domain detection
# 3. RELEVANCE CHECK      — Main entry point for the filter
# 4. OFF-TOPIC DOMAINS    — Known domains for cross-sector detection
# =============================================================================

"""
utils/relevance.py

Sector relevance filter for TriageIQ. Runs before ML classification to
detect messages that are completely unrelated to the business's sector.

Example: A bakery workspace receiving "I have emergency neck pain" gets
caught here rather than being nonsensically classified as "Billing."

The filter is deliberately lenient — it only rejects messages that have
ZERO overlap with the sector AND match a known off-topic domain. This
means ambiguous messages still go through to the ML classifier, which
is the right behavior (better to classify uncertainly than reject wrongly).

Kept DB-agnostic (operates on plain strings/dicts) so it's unit-testable
without a database.
"""

import re

from utils.sectors import SECTORS, has_emergency_keywords

# =============================================================================
# region 1. CONSTANTS
# =============================================================================

# Minimum keyword overlap ratio to consider a message relevant.
# Set very low intentionally — even 1 keyword match is enough to pass.
MIN_KEYWORD_OVERLAP = 0.0  # Any single keyword match = relevant

# If a message has zero sector keyword matches AND matches an off-topic
# domain this strongly, it's flagged as irrelevant.
OFF_TOPIC_CONFIDENCE_THRESHOLD = 2  # At least 2 off-topic domain keywords

# endregion

# =============================================================================
# region 2. TEXT ANALYSIS
# =============================================================================


def _tokenize(text: str) -> set[str]:
    """Lowercase, split into words, strip punctuation — for keyword matching."""
    words = re.findall(r"[a-z]+", text.lower())
    return set(words)


def _bigrams(text: str) -> set[str]:
    """Extract bigrams for matching multi-word keywords like 'hot water'."""
    words = re.findall(r"[a-z]+", text.lower())
    return {f"{words[i]} {words[i+1]}" for i in range(len(words) - 1)}


def count_keyword_matches(text: str, keywords: list[str]) -> int:
    """Count how many sector keywords appear in the text."""
    if not keywords:
        return 0

    words = _tokenize(text)
    phrases = _bigrams(text)
    lowered = text.lower()

    count = 0
    for kw in keywords:
        if " " in kw:
            # Multi-word keyword — check as substring
            if kw in lowered:
                count += 1
        else:
            # Single word — check in token set
            if kw in words:
                count += 1
    return count


# endregion

# =============================================================================
# region 3. RELEVANCE CHECK
# =============================================================================


def check_relevance(text: str, sector_id: str, business_name: str) -> dict:
    """
    Check if a message is relevant to the given business sector.

    Returns:
        {
            "relevant": bool,
            "sector_matches": int,        # keyword matches with the sector
            "off_topic_domain": str|None,  # detected off-topic domain
            "off_topic_matches": int,      # matches with off-topic domain
            "response": str|None,          # message to show if irrelevant
            "emergency": bool,             # true if emergency keywords found
            "emergency_text": str|None,    # emergency redirect text
        }
    """
    sector = SECTORS.get(sector_id)

    # "other" sector or unknown — skip filtering entirely
    if not sector or sector_id == "other" or not sector["keywords"]:
        return {
            "relevant": True,
            "sector_matches": 0,
            "off_topic_domain": None,
            "off_topic_matches": 0,
            "response": None,
            "emergency": False,
            "emergency_text": None,
        }

    # Check for cross-sector emergencies first
    emergency = has_emergency_keywords(text)
    emergency_text = sector.get("emergency_redirect") if emergency else None

    # Count sector keyword matches
    sector_matches = count_keyword_matches(text, sector["keywords"])

    # If we have ANY sector keyword match, it's relevant
    if sector_matches > 0:
        return {
            "relevant": True,
            "sector_matches": sector_matches,
            "off_topic_domain": None,
            "off_topic_matches": 0,
            "response": None,
            "emergency": emergency,
            "emergency_text": emergency_text,
        }

    # Zero sector matches — check if it matches a known off-topic domain
    best_domain = None
    best_domain_matches = 0

    for domain_id, domain_keywords in OFF_TOPIC_DOMAINS.items():
        # Don't flag a message as off-topic if the off-topic domain IS
        # the sector (e.g., medical sector shouldn't flag medical keywords)
        if domain_id == sector_id:
            continue

        matches = count_keyword_matches(text, domain_keywords)
        if matches > best_domain_matches:
            best_domain = domain_id
            best_domain_matches = matches

    # Only flag as irrelevant if we have strong off-topic signal
    if best_domain_matches >= OFF_TOPIC_CONFIDENCE_THRESHOLD:
        response = sector.get("irrelevant_response", "").format(
            business_name=business_name
        )
        if emergency_text:
            response = f"{emergency_text}\n\n{response}"

        return {
            "relevant": False,
            "sector_matches": 0,
            "off_topic_domain": best_domain,
            "off_topic_matches": best_domain_matches,
            "response": response,
            "emergency": emergency,
            "emergency_text": emergency_text,
        }

    # Zero sector matches but no strong off-topic signal either —
    # let it through to the ML classifier (benefit of the doubt)
    return {
        "relevant": True,
        "sector_matches": 0,
        "off_topic_domain": None,
        "off_topic_matches": 0,
        "response": None,
        "emergency": emergency,
        "emergency_text": emergency_text,
    }


# endregion

# =============================================================================
# region 4. OFF-TOPIC DOMAINS
# =============================================================================

# Known topic domains for cross-sector detection. When a message has zero
# overlap with the business sector but strong overlap with one of these,
# it's flagged as irrelevant. These are intentionally broad — the goal is
# to catch obviously-wrong messages, not be a topic classifier.

OFF_TOPIC_DOMAINS = {
    "medical": [
        "doctor", "hospital", "pain", "symptom", "diagnosis", "surgery",
        "prescription", "medication", "nurse", "clinic", "health",
        "headache", "fever", "cough", "injury", "blood", "emergency room",
        "ambulance", "therapy", "mental health", "depression", "anxiety",
        "neck pain", "back pain", "chest pain",
    ],
    "legal": [
        "lawyer", "attorney", "court", "lawsuit", "legal", "judge",
        "trial", "verdict", "bail", "arrest", "police", "crime",
        "criminal", "defense", "prosecution", "warrant", "subpoena",
    ],
    "automotive": [
        "car", "vehicle", "engine", "brake", "tire", "transmission",
        "mechanic", "garage", "collision", "accident", "insurance claim",
    ],
    "tech": [
        "software", "hardware", "computer", "laptop", "server", "code",
        "programming", "database", "network", "wifi", "internet",
        "bug", "crash", "update", "download", "install",
    ],
    "finance": [
        "bank", "loan", "mortgage", "investment", "stock", "trading",
        "credit score", "tax", "irs", "accountant", "audit", "interest rate",
    ],
    "real_estate": [
        "property", "house", "apartment", "rent", "lease", "landlord",
        "tenant", "eviction", "mortgage", "realtor", "listing",
    ],
    "education": [
        "school", "university", "college", "teacher", "professor",
        "exam", "grade", "homework", "tuition", "scholarship", "degree",
    ],
}

# endregion
