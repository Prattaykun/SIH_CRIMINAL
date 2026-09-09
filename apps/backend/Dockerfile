FROM python:3.10-slim

WORKDIR /app

# Render Root Directory must be: apps/backend
# (build context = this folder, not the repo root)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Keep import path used by main.py: apps.backend.app.main:app
RUN mkdir -p /app/apps && touch /app/apps/__init__.py
COPY . /app/apps/backend/
RUN touch /app/apps/backend/__init__.py

ENV PYTHONPATH=/app
ENV PORT=8000

EXPOSE 8000

CMD ["sh", "-c", "uvicorn apps.backend.app.main:app --host 0.0.0.0 --port ${PORT}"]
