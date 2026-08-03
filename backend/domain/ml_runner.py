"""
backend/domain/ml_runner.py

Provides ML inference isolation and circuit-breaker protection so heavy
model loads / predictions never block the main request thread, and so a
misbehaving model service (e.g. running out of memory) cannot take down
the entire API.

Usage:
    from backend.domain.ml_runner import classify_with_fallback
    result = classify_with_fallback("Wi-Fi keeps disconnecting", "it_support")
"""

import os
import threading
import time
from typing import Any

# NOTE: We deliberately do NOT import classify_ticket from ticket_utils here.
# That would create a circular import (ticket_utils imports us). Instead we
# implement the core inference here, and ticket_utils re-exports it.

# Circuit breaker configuration (all tunable via env vars)
_CIRCUIT_OPEN_DURATION = int(os.environ.get("ML_CIRCUIT_OPEN_SECONDS", "30"))
_FAILURE_THRESHOLD = int(os.environ.get("ML_CIRCUIT_FAILURE_THRESHOLD", "3"))
_INFERENCE_TIMEOUT = int(os.environ.get("ML_INFERENCE_TIMEOUT", "5"))

# Circuit breaker state (in-process — shared across threads within one worker)
_lock = threading.Lock()
_failures = 0
_open_until: float = 0.0


class MLServiceUnhealthy(Exception):
    """Raised when the circuit breaker is open (ML service considered down)."""


class MLInferenceTimeout(Exception):
    """Raised when ML inference takes too long."""


def _record_success():
    """Reset the failure counter when inference succeeds."""
    global _failures
    with _lock:
        _failures = 0


def _record_failure():
    """Increment the failure counter; open the circuit if threshold breached."""
    global _failures, _open_until
    with _lock:
        _failures += 1
        if _failures >= _FAILURE_THRESHOLD:
            _open_until = time.time() + _CIRCUIT_OPEN_DURATION


def _is_open() -> bool:
    """True if the circuit breaker is currently tripped (open)."""
    global _open_until
    with _lock:
        return time.time() < _open_until


def _run_inference(text: str, profile: str, model: Any = None) -> dict:
    """Run classification in a bounded thread so it cannot hang the main
    worker thread. Returns the classification dict or raises MLInferenceTimeout."""
    result: dict = {}
    error: list = [None]

    def _worker():
        try:
            # Import here to avoid circular import at module load time
            from backend.domain.ticket_utils import _classify_local
            result.update(_classify_local(text, profile, model))
        except Exception as exc:
            error[0] = exc

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()
    thread.join(timeout=_INFERENCE_TIMEOUT)

    if thread.is_alive():
        raise MLInferenceTimeout(
            f"ML inference exceeded {_INFERENCE_TIMEOUT}s limit"
        )

    if error[0] is not None:
        raise error[0]

    return result


def classify_with_fallback(
    text: str,
    profile: str,
    model: Any = None,
) -> dict:
    """Run ML classification with circuit-breaker and timeout protection.

    Returns a classification dict on success. On any failure (timeout,
    exception, or open circuit breaker) returns a safe fallback dict
    that routes the ticket to "Needs Review" so a human can look at it.
    """
    # Circuit breaker: if we've had too many recent failures, skip ML entirely
    if _is_open():
        return _fallback_result(text, "Circuit breaker open — ML service temporarily disabled.")

    try:
        result = _run_inference(text, profile, model=model)
        _record_success()
        return result
    except (MLInferenceTimeout, Exception) as exc:
        _record_failure()
        return _fallback_result(text, str(exc))


def _fallback_result(text: str, reason: str) -> dict:
    """Safe fallback when ML is unavailable: routes to Needs Review."""
    return {
        "category": "Needs Review",
        "confidence": 0.0,
        "secondary_category": None,
        "secondary_confidence": None,
        "raw_category": "Needs Review",
        "out_of_scope": True,
        "confidence_floor": 0.0,
        "fallback_reason": reason,
    }


def circuit_breaker_status() -> dict:
    """Return the current circuit breaker state for observability."""
    with _lock:
        return {
            "failures": _failures,
            "threshold": _FAILURE_THRESHOLD,
            "open_until": _open_until,
            "is_open": time.time() < _open_until,
        }
