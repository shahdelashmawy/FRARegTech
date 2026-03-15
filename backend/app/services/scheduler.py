import logging
import asyncio
from typing import Dict, Any, List

from app.core.celery_app import celery_app
from app.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(name="app.services.scheduler.scrape_fra_website", bind=True, max_retries=3)
def scrape_fra_website(self) -> Dict[str, Any]:
    """
    Celery task: scrape FRA website for new regulations.
    Triggered on schedule (daily) or manually.
    """
    try:
        result = asyncio.run(_run_scraper())
        logger.info(f"Scraping completed: {result}")
        # After scraping, trigger alert checking
        check_alerts.delay()
        return result
    except Exception as e:
        logger.error(f"Scraping task failed: {e}")
        raise self.retry(exc=e, countdown=60 * 10)  # retry after 10 minutes


async def _run_scraper() -> Dict[str, Any]:
    from app.database import AsyncSessionLocal
    from app.services.scraper import run_scraper

    async with AsyncSessionLocal() as db:
        return await run_scraper(db)


@celery_app.task(name="app.services.scheduler.check_alerts", bind=True)
def check_alerts(self) -> Dict[str, Any]:
    """
    Celery task: check all active user alerts against newly scraped regulations
    and send notifications.
    """
    try:
        result = asyncio.run(_check_and_notify())
        logger.info(f"Alert checking completed: {result}")
        return result
    except Exception as e:
        logger.error(f"Alert check task failed: {e}")
        raise self.retry(exc=e, countdown=60 * 5)


async def _check_and_notify() -> Dict[str, Any]:
    from datetime import datetime, timedelta
    from sqlalchemy import select
    from app.database import AsyncSessionLocal
    from app.models.alert import Alert
    from app.models.regulation import Regulation
    from app.models.user import User
    from app.services.notification_service import notify_user_about_regulation

    notifications_sent = 0
    errors: List[str] = []

    async with AsyncSessionLocal() as db:
        # Get regulations scraped in the last 25 hours
        cutoff = datetime.utcnow() - timedelta(hours=25)
        regs_result = await db.execute(
            select(Regulation).where(
                Regulation.scraped_at >= cutoff,
                Regulation.is_active == True,
            )
        )
        new_regulations = regs_result.scalars().all()

        if not new_regulations:
            logger.info("No new regulations to check alerts for")
            return {"notifications_sent": 0, "new_regulations": 0}

        # Get all active alerts
        alerts_result = await db.execute(
            select(Alert).where(Alert.is_active == True)
        )
        active_alerts = alerts_result.scalars().all()

        for alert in active_alerts:
            try:
                # Get the user for this alert
                user_result = await db.execute(
                    select(User).where(User.id == alert.user_id, User.is_active == True)
                )
                user = user_result.scalar_one_or_none()
                if not user:
                    continue

                # Check each new regulation against alert criteria
                for regulation in new_regulations:
                    if _regulation_matches_alert(regulation, alert):
                        await notify_user_about_regulation(user, regulation)
                        notifications_sent += 1

                        # Update last_triggered
                        from datetime import datetime
                        alert.last_triggered = datetime.utcnow()
                        await db.commit()
            except Exception as e:
                error_msg = f"Error processing alert {alert.id}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)

    return {
        "notifications_sent": notifications_sent,
        "new_regulations": len(new_regulations),
        "errors": errors,
    }


def _regulation_matches_alert(regulation, alert) -> bool:
    """Check if a regulation matches an alert's criteria."""
    # Check regulation type filter
    if alert.regulation_types and regulation.regulation_type not in alert.regulation_types:
        return False

    # Check keyword filter (case-insensitive)
    if alert.keywords:
        combined_text = " ".join(filter(None, [
            regulation.title_en,
            regulation.title_ar,
            regulation.summary_en,
            regulation.summary_ar,
        ])).lower()

        matched = any(
            keyword.lower() in combined_text for keyword in alert.keywords
        )
        if not matched:
            return False

    return True


@celery_app.task(name="app.services.scheduler.process_document", bind=True, max_retries=3)
def process_document(self, document_id: int) -> Dict[str, Any]:
    """
    Celery task: process an uploaded document.
    Extracts text, generates embedding, optionally translates.
    """
    try:
        result = asyncio.run(_process_document(document_id))
        logger.info(f"Document {document_id} processed: {result}")
        return result
    except Exception as e:
        logger.error(f"Document processing failed for {document_id}: {e}")
        raise self.retry(exc=e, countdown=30)


async def _process_document(document_id: int) -> Dict[str, Any]:
    from sqlalchemy import select
    from app.database import AsyncSessionLocal
    from app.models.document import Document
    from app.services.document_processor import process_document_file

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Document).where(Document.id == document_id)
        )
        document = result.scalar_one_or_none()
        if not document:
            return {"error": f"Document {document_id} not found"}

        try:
            await process_document_file(db, document)
            return {"document_id": document_id, "status": "processed"}
        except Exception as e:
            document.processing_error = str(e)
            await db.commit()
            raise
