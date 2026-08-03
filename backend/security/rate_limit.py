# =============================================================================
# backend/security/rate_limit.py
#
# Lightweight in-memory rate limiter for public and auth endpoints.
#
# Why not a library: this project runs as a single process against SQLite,
# so a process-local sliding window is sufficient and adds zero new
# infrastructure or dependencies. If the app is later scaled to multiple
# workers/instances, swap the in-memory store below for Redis (the project
# already has a REDIS_URL / CACHE_BACKEND convention in .env.example) —
# the public `check` function signature does not need to change.
# =============================================================================

import os
import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request

# {bucket_key: deque[timestamps]}
_HITS: dict[str, deque] = defaultdict(deque)
_LOCK = Lock()


def _client_ip(request: Request) -> str:
    # Respect a reverse proxy's forwarded header if present (Render, Fly,
    # nginx, etc. all set this); fall back to the direct client host.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(bucket: str, max_requests: int, window_seconds: int):
    """
    FastAPI dependency factory. Usage:

        @app.post("/api/submit")
        def submit(..., _rl=Depends(rate_limit("submit", 20, 60))):
            ...

    Limits are keyed by (bucket, client IP) so one noisy client can't burn
    another client's quota. Raises 429 with a Retry-After header when the
    window is exceeded.

    Set RATE_LIMIT_DISABLED=1 in the environment to disable (useful for
    local dev and for pytest, which drives many requests in a tight loop).
    """

    def _dependency(request: Request):
        if os.environ.get("RATE_LIMIT_DISABLED") == "1":
            return
        key = f"{bucket}:{_client_ip(request)}"
        now = time.monotonic()
        with _LOCK:
            hits = _HITS[key]
            while hits and now - hits[0] > window_seconds:
                hits.popleft()
            if len(hits) >= max_requests:
                retry_after = max(1, int(window_seconds - (now - hits[0])))
                raise HTTPException(
                    status_code=429,
                    detail="Too many requests. Please try again shortly.",
                    headers={"Retry-After": str(retry_after)},
                )
            hits.append(now)

    return _dependency
