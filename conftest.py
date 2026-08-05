"""
Root-level pytest conftest.

Disables the in-memory rate limiter (backend/security/rate_limit.py) for
the whole test session. The current test suite exercises domain modules
directly and never hits api.py through a TestClient, so this has no effect
today — it's here so that if API-level tests are added later, a fast test
loop doesn't start tripping 429s against itself.
"""

import os

os.environ.setdefault("RATE_LIMIT_DISABLED", "1")
