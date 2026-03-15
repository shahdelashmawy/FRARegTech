from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.alert import Alert
from app.models.user import User
from app.schemas.alert import AlertCreate, AlertUpdate, AlertResponse, AlertListResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/", response_model=AlertListResponse)
async def list_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all alerts for the current user."""
    count_result = await db.execute(
        select(func.count()).select_from(Alert).where(Alert.user_id == current_user.id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Alert)
        .where(Alert.user_id == current_user.id)
        .order_by(Alert.created_at.desc())
    )
    alerts = result.scalars().all()

    return AlertListResponse(
        items=[AlertResponse.model_validate(a) for a in alerts],
        total=total,
    )


@router.post("/", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_data: AlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new regulatory alert."""
    alert = Alert(
        user_id=current_user.id,
        name=alert_data.name,
        keywords=alert_data.keywords,
        regulation_types=alert_data.regulation_types,
        is_active=alert_data.is_active,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return AlertResponse.model_validate(alert)


@router.put("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    update_data: AlertUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing alert."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == current_user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(alert, field, value)

    await db.commit()
    await db.refresh(alert)
    return AlertResponse.model_validate(alert)


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an alert."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == current_user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    await db.delete(alert)
    await db.commit()


@router.post("/{alert_id}/test", status_code=status.HTTP_200_OK)
async def test_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a test notification for an alert to verify the setup."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == current_user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    # Create a mock regulation for the test
    from app.models.regulation import Regulation
    from datetime import date as dt_date

    mock_regulation = Regulation(
        id=0,
        title_en="Test Regulation - FRA RegTech Alert Test",
        title_ar="لائحة اختبار - اختبار تنبيه هيئة الرقابة المالية",
        summary_en="This is a test notification for your alert configuration.",
        summary_ar="هذا إشعار اختباري لإعدادات التنبيه الخاصة بك.",
        regulation_type=alert.regulation_types[0] if alert.regulation_types else "announcement",
        source_url="https://www.fra.gov.eg",
        published_date=dt_date.today(),
    )

    from app.services.notification_service import notify_user_about_regulation
    results = await notify_user_about_regulation(current_user, mock_regulation)

    return {
        "message": "Test notification sent",
        "channels": results,
        "alert_id": alert_id,
    }
