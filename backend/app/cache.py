"""
cache.py — Unified cache layer.
Primary: Redis (if REDIS_URL env var set and redis-py installed).
Fallback: In-memory TTL dict (thread-safe, suitable for single-process dev).
"""
import os
import time
import json
import threading
import logging

logger = logging.getLogger(__name__)

# ── In-memory fallback ──────────────────────────────────────────────────────

_store: dict[str, tuple[float, str]] = {}  # key -> (expires_at, json_value)
_lock = threading.Lock()


def _mem_get(key: str):
    with _lock:
        entry = _store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if time.time() > expires_at:
            del _store[key]
            return None
        return json.loads(value)


def _mem_set(key: str, value, ttl: int):
    with _lock:
        _store[key] = (time.time() + ttl, json.dumps(value, default=str))


def _mem_delete(key: str):
    with _lock:
        _store.pop(key, None)


# ── Redis client (optional) ─────────────────────────────────────────────────

_redis_client = None
_redis_available = False


def _init_redis():
    global _redis_client, _redis_available
    redis_url = os.getenv("REDIS_URL", "")
    if not redis_url:
        logger.info("REDIS_URL not set — using in-memory cache fallback")
        return
    try:
        import redis  # noqa: PLC0415
        client = redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=2)
        client.ping()
        _redis_client = client
        _redis_available = True
        logger.info("Redis cache connected: %s", redis_url)
    except Exception as exc:
        logger.warning("Redis unavailable (%s) — using in-memory cache fallback", exc)


_init_redis()


# ── Public API ──────────────────────────────────────────────────────────────

def get_cached(key: str):
    """Return cached value or None on miss/expiry."""
    if _redis_available and _redis_client:
        try:
            raw = _redis_client.get(key)
            return json.loads(raw) if raw else None
        except Exception as exc:
            logger.warning("Redis GET error: %s", exc)
    return _mem_get(key)


def set_cached(key: str, value, ttl: int = 30):
    """Store a value with TTL seconds expiry."""
    if _redis_available and _redis_client:
        try:
            _redis_client.setex(key, ttl, json.dumps(value, default=str))
            return
        except Exception as exc:
            logger.warning("Redis SET error: %s", exc)
    _mem_set(key, value, ttl)


def invalidate(key: str):
    """Delete a cache key."""
    if _redis_available and _redis_client:
        try:
            _redis_client.delete(key)
            return
        except Exception as exc:
            logger.warning("Redis DEL error: %s", exc)
    _mem_delete(key)
