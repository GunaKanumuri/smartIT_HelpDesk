"""
backend/domain/caching.py

A small caching utility used across the domain layer. In development it
falls back to an in-process LRU-style dict so no external service is
required. In production, set CACHE_BACKEND=redis and REDIS_URL to use a
shared Redis instance across all workers (required for correct behaviour
when running multiple Gunicorn/ASGI workers).

The two hot caches this supports:
  - ML model pipelines (expensive to load from disk)
  - knowledge-base JSON files

Kept dependency-free: uses only the stdlib so the module always imports,
even before optional redis support is installed.
"""

import os

# Attempt to import redis (optional). If unavailable, we silently use the
# in-process dict fallback.
try:
    import redis as _redis  # type: ignore
except ImportError:
    _redis = None

BACKEND = os.environ.get("CACHE_BACKEND", "memory")  # "memory" | "redis"
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")


class _MemoryCache:
    """Simple in-process cache with a max size (evicts oldest by insertion)."""

    def __init__(self, maxsize: int = 128):
        self._store: dict = {}
        self._order: list = []
        self._maxsize = maxsize

    def get(self, key: str):
        return self._store.get(key)

    def set(self, key: str, value):
        if key not in self._store:
            self._order.append(key)
        self._store[key] = value
        while len(self._order) > self._maxsize:
            oldest = self._order.pop(0)
            self._store.pop(oldest, None)

    def clear(self):
        self._store.clear()
        self._order.clear()


class _RedisCache:
    """Redis-backed cache (shared across processes)."""

    def __init__(self, url: str):
        if _redis is None:
            raise RuntimeError("redis package is not installed — pip install redis")
        self._client = _redis.from_url(url)

    def get(self, key: str):
        raw = self._client.get(key)
        if raw is None:
            return None
        import json
        return json.loads(raw)

    def set(self, key: str, value, ttl: int = 3600):
        import json
        self._client.set(key, json.dumps(value), ex=ttl)

    def clear(self):
        self._client.flushdb()


_memory = _MemoryCache()
_redis_cache = None


def _get_cache():
    global _redis_cache
    if BACKEND == "redis":
        if _redis_cache is None:
            _redis_cache = _RedisCache(REDIS_URL)
        return _redis_cache
    return _memory


def cache_get(key: str):
    """Fetch a value from the active cache backend, or None."""
    try:
        return _get_cache().get(key)
    except Exception:
        # If Redis is down, degrade to memory (don't crash the request).
        return _memory.get(key)


def cache_set(key: str, value, ttl: int = 3600):
    """Store a value in the active cache backend. Never raises."""
    try:
        _get_cache().set(key, value, ttl=ttl)
    except Exception:
        _memory.set(key, value)


def cache_clear():
    try:
        _get_cache().clear()
    except Exception:
        _memory.clear()
