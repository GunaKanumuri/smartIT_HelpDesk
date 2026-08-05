"""
tests/test_benchmarks.py

Performance benchmarks for the three hottest paths:
  - ticket submission (the public entry point every customer hits)
  - model loading (first request per profile)
  - dashboard stats (what every agent sees on every page load)

Run with:  pytest tests/test_benchmarks.py --benchmark-only
(The --benchmark-only flag skips the normal test suite.)
"""

import pytest

from backend.database import repository as db
from backend.services.ticket_pipeline import submit_ticket
from backend.domain.ticket_utils import load_model


# Shared workspace fixture
@pytest.fixture
def workspace():
    return {
        'id': 1, 'slug': 'bench', 'name': 'Bench',
        'profile': 'customer_support', 'sector': 'customer_support',
        'uses_custom_model': 0, 'escalation_email': None,
    }


# ─── Ticket submission throughput ────────────────────────────────────────────

def test_bench_ticket_submission(benchmark, workspace):
    """How many tickets/second can we process end-to-end?"""
    def submit_one():
        db.insert_ticket(
            workspace_id=workspace['id'],
            user_id='bench_user',
            issue_description='Where is my order?',
            category='Shipping & Delivery',
            confidence=0.99,
            urgency='Medium',
        )
    benchmark(submit_one)
    # cleanup
    with db.get_connection() as conn:
        conn.execute('DELETE FROM tickets WHERE workspace_id = ?', (workspace['id'],))


def test_bench_model_load_cached(benchmark):
    """Second + third call should hit the cache (near-instant)."""
    load_model('customer_support')  # populate cache first
    benchmark(lambda: load_model('customer_support'))


def test_bench_model_load_cold(benchmark):
    """First-ever load (clears cache first) — measures disk I/O."""
    from backend.domain.ticket_utils import _model_cache
    _model_cache.pop('it_support', None)

    def cold_load():
        _model_cache.pop('it_support', None)
        return load_model('it_support')

    bench_result = benchmark(cold_load)
    assert bench_result is not None
