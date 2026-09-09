FROM python:3.10-slim

WORKDIR /app

# Build context MUST be the repository root (leave Render Root Directory empty).
COPY apps/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/backend/ /app/apps/backend/
COPY packages/shared/ /app/packages/shared/

ENV PYTHONPATH=/app
# Render injects PORT; local Docker defaults to 8000.
ENV PORT=8000

EXPOSE 8000

# Matches apps.backend.app.main:app (FastAPI instance in main.py)
CMD ["sh", "-c", "uvicorn apps.backend.app.main:app --host 0.0.0.0 --port ${PORT}"]
