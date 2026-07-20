"""
utils/profiles.py

Central registry of business profiles. Adding a new profile means:
  1. Add a row here.
  2. Add data/profiles/<id>.csv with ticket_text,category columns.
  3. Run `python model/train_model.py <id>`.

This is the piece that makes the engine business-agnostic: the app,
the admin dashboard, and the trainer all read from this one list
instead of hardcoding category names anywhere.
"""

import json
from pathlib import Path

MODEL_DIR = Path(__file__).resolve().parent.parent / "model" / "profiles"

PROFILES = {
    "it_support": "IT Support Helpdesk",
    "customer_support": "General Customer Support",
}


def get_categories(profile: str) -> list[str]:
    """Read the category list for a profile from its trained metrics.json."""
    metrics_path = MODEL_DIR / profile / "metrics.json"
    if not metrics_path.exists():
        return []
    data = json.loads(metrics_path.read_text())
    return data.get("categories", [])


def get_accuracy(profile: str) -> float | None:
    metrics_path = MODEL_DIR / profile / "metrics.json"
    if not metrics_path.exists():
        return None
    data = json.loads(metrics_path.read_text())
    return data.get("test_accuracy")
