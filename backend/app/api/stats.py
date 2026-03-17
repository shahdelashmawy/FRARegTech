from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.regulation import Regulation
from app.models.alert import Alert
from app.models.document import Document
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("/")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import datetime, timedelta
    one_week_ago = datetime.utcnow() - timedelta(days=7)

    total_regulations = await db.scalar(
        select(func.count()).where(Regulation.is_active == True)
    )

    new_this_week = await db.scalar(
        select(func.count()).where(
            Regulation.is_active == True,
            Regulation.scraped_at >= one_week_ago,
        )
    )

    active_alerts = await db.scalar(
        select(func.count()).where(
            Alert.user_id == current_user.id,
            Alert.is_active == True,
        )
    )

    saved_documents = await db.scalar(
        select(func.count()).where(Document.user_id == current_user.id)
    )

    return {
        "total_regulations": total_regulations or 0,
        "new_this_week": new_this_week or 0,
        "active_alerts": active_alerts or 0,
        "saved_documents": saved_documents or 0,
    }
