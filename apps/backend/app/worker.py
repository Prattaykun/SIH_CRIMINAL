import os
from celery import Celery
from apps.backend.app.core.config import settings

# Initialize Celery app
celery_app = Celery(
    "sih_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["apps.backend.app.tasks.extraction"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
)

if __name__ == "__main__":
    celery_app.start()
