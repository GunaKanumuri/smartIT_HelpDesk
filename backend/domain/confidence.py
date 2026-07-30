"""
utils/confidence.py

Out-of-scope detection: decides when a classifier's top prediction is too
close to a random guess to trust, and should be routed to a human instead
of silently filed under a confident-looking (but wrong) category.

The floor scales with how many categories a profile has, since "22%
confidence" means something very different on a 3-way model (33% baseline)
than a 5-way model (20% baseline). Concretely: the floor is 1.75x the
random-guess baseline (1 / num_categories), clamped to a sane [0.35, 0.45]
range so it's neither trivially easy nor unreasonably strict at the
extremes (e.g. a hypothetical 20-category profile).
"""

FLOOR_MULTIPLIER = 1.75
MIN_FLOOR = 0.35
MAX_FLOOR = 0.45

NEEDS_REVIEW_LABEL = "Needs Review"


def confidence_floor(num_categories: int) -> float:
    """The minimum top-1 confidence required to trust a prediction outright."""
    if num_categories <= 1:
        return MIN_FLOOR
    baseline = 1 / num_categories
    return min(MAX_FLOOR, max(MIN_FLOOR, FLOOR_MULTIPLIER * baseline))


def is_out_of_scope(confidence: float, num_categories: int) -> bool:
    return confidence < confidence_floor(num_categories)
