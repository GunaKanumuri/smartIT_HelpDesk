"""
utils/knowledge_base.py

Loads per-profile canned responses (data/kb/<profile>.json) so the app can
auto-suggest a reply once a ticket is classified. This is what chains the
classifier into an actual workflow instead of just labeling tickets.
"""

import json
from pathlib import Path

KB_DIR = Path(__file__).resolve().parent.parent / "data" / "kb"

_kb_cache: dict[str, dict] = {}


def load_kb(profile: str) -> dict:
    if profile not in _kb_cache:
        kb_path = KB_DIR / f"{profile}.json"
        _kb_cache[profile] = json.loads(kb_path.read_text()) if kb_path.exists() else {}
    return _kb_cache[profile]


def get_suggested_reply(profile: str, category: str) -> str | None:
    return load_kb(profile).get(category)
