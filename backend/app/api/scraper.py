from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.regulation import Regulation
from app.models.user import User
from app.api.deps import get_current_admin_user

router = APIRouter(prefix="/scraper", tags=["Scraper"])

# In-memory scrape status store (use Redis in production)
_last_scrape_status = {
    "status": "never_run",
    "last_run": None,
    "result": None,
}


@router.post("/trigger", status_code=status.HTTP_202_ACCEPTED)
async def trigger_scraper(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Admin: manually trigger FRA website scraping."""
    global _last_scrape_status

    try:
        # Try to dispatch to Celery
        from app.services.scheduler import scrape_fra_website
        task = scrape_fra_website.delay()
        _last_scrape_status["status"] = "queued"
        _last_scrape_status["task_id"] = task.id
        return {
            "message": "Scraping task queued",
            "task_id": task.id,
            "status": "queued",
        }
    except Exception:
        # Celery not available - run synchronously
        import asyncio
        from app.services.scraper import run_scraper
        from datetime import datetime

        _last_scrape_status["status"] = "running"
        result = await run_scraper(db)
        _last_scrape_status.update({
            "status": "completed",
            "last_run": datetime.utcnow().isoformat(),
            "result": result,
        })
        return {
            "message": "Scraping completed synchronously",
            "result": result,
        }


@router.get("/status")
async def get_scraper_status(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Get the status of the last scraping run."""
    # Get total regulation count
    count_result = await db.execute(
        select(func.count()).select_from(Regulation).where(Regulation.is_active == True)
    )
    total_regulations = count_result.scalar_one()

    # Get latest scraped regulation
    latest_result = await db.execute(
        select(Regulation)
        .where(Regulation.is_active == True)
        .order_by(Regulation.scraped_at.desc())
        .limit(1)
    )
    latest = latest_result.scalar_one_or_none()

    return {
        "scraper_status": _last_scrape_status,
        "database_stats": {
            "total_regulations": total_regulations,
            "latest_scraped": latest.scraped_at.isoformat() if latest and latest.scraped_at else None,
        },
    }
