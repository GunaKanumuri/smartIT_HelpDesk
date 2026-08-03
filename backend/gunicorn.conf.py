"""
backend/gunicorn.conf.py

Gunicorn configuration for production deployment of the SevakAI API.

Run with:
    cd backend
    gunicorn sevak_ai.wsgi:application -c gunicorn.conf.py
"""

import multiprocessing
import os

# ─── Server binding ───────────────────────────────────────────────────────────
bind = os.environ.get("GUNICORN_BIND", "0.0.0.0:8001")
backlog = 2048

# ─── Workers ──────────────────────────────────────────────────────────────────
# 2x CPU + 1 is a good default for CPU-bound Django apps.
workers = int(os.environ.get("GUNICORN_WORKERS", multiprocessing.cpu_count() * 2 + 1))
worker_class = "gthread"
threads = int(os.environ.get("GUNICORN_THREADS", "4"))
timeout = 120
graceful_timeout = 30

# ─── Request limits ───────────────────────────────────────────────────────────
max_requests = 1000
max_requests_jitter = 100
keepalive = 5

# ─── Logging ──────────────────────────────────────────────────────────────────
accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("GUNICORN_LOG_LEVEL", "info")

# ─── TLS (terminate at the proxy in most setups; only if needed here) ─────────
# certfile = "/etc/ssl/certs/sevakai.crt"
# keyfile = "/etc/ssl/private/sevakai.key"

# ─── Preload ──────────────────────────────────────────────────────────────────
# Preload the app (and warm the ML model cache) before forking workers.
preload_app = True


def on_starting(server):
    """Warm the ML model cache so first requests aren't slow."""
    import os
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sevak_ai.settings")
    import django
    django.setup()
    from backend.domain.ticket_utils import load_model
    try:
        load_model("customer_support")
        load_model("it_support")
        server.log.info("Preloaded ML models.")
    except Exception as exc:  # noqa: BLE001
        server.log.warning(f"Could not preload models: {exc}")
