# =============================================================================
# Dockerfile — SevakAI backend (FastAPI)
#
# Multi-stage build: install deps in a builder layer, copy only what's
# needed into a slim runtime image.
# =============================================================================

FROM python:3.12-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.12-slim

WORKDIR /app

# Bring in packages installed to the user site-packages in the builder stage
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

COPY backend/ ./backend/
COPY storage/ ./storage/
COPY requirements.txt .

# storage/ holds the SQLite DB, trained models, and datasets — mount this
# as a volume in production so data survives container restarts/rebuilds.
VOLUME ["/app/storage"]

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# gunicorn manages worker processes; uvicorn's ASGI worker class serves
# FastAPI within each one. Adjust --workers to available CPU cores.
CMD ["gunicorn", "backend.api:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "2", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "60"]
