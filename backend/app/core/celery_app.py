from celery import Celery
from app.config import settings

celery_app = Celery(
    "fra_regtech",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.services.scheduler",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Cairo",
    enable_utc=True,
    beat_schedule={
        "scrape-fra-website-daily": {
            "task": "app.services.scheduler.scrape_fra_website",
            "schedule": 60 * 60 * 24,  # every 24 hours
        },
    },
    task_routes={
        "app.services.scheduler.scrape_fra_website": {"queue": "scraper"},
        "app.services.scheduler.check_alerts": {"queue": "notifications"},
        "app.services.scheduler.process_document": {"queue": "documents"},
    },
)
