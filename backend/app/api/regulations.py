from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.database import get_db
from app.models.regulation import Regulation
from app.models.user import User
from app.schemas.regulation import (
    RegulationCreate,
    RegulationUpdate,
    RegulationResponse,
    RegulationListResponse,
)
from app.api.deps import get_current_user, get_current_admin_user
from app.services.embedding_service import generate_embedding
from app.services.translation_service import summarize_regulation, translate_to_arabic, translate_to_english
from app.config import settings

router = APIRouter(prefix="/regulations", tags=["Regulations"])


@router.get("/", response_model=RegulationListResponse)
async def list_regulations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    regulation_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    tags: Optional[str] = None,  # comma-separated
    language: str = Query("en", regex="^(en|ar)$"),
    db: AsyncSession = Depends(get_db),
):
    """List regulations with optional filters and pagination."""
    filters = [Regulation.is_active == True]

    if regulation_type:
        filters.append(Regulation.regulation_type == regulation_type)
    if date_from:
        filters.append(Regulation.published_date >= date_from)
    if date_to:
        filters.append(Regulation.published_date <= date_to)
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        # JSON contains any of the tags (PostgreSQL-specific)
        for tag in tag_list:
            filters.append(Regulation.tags.contains([tag]))

    # Count total
    count_stmt = select(func.count()).select_from(Regulation).where(and_(*filters))
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Fetch page
    stmt = (
        select(Regulation)
        .where(and_(*filters))
        .order_by(Regulation.published_date.desc().nullslast(), Regulation.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    regulations = result.scalars().all()

    return RegulationListResponse(
        items=[RegulationResponse.model_validate(r) for r in regulations],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/latest", response_model=List[RegulationResponse])
async def get_latest_regulations(
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Get the latest regulations (most recently scraped)."""
    stmt = (
        select(Regulation)
        .where(Regulation.is_active == True)
        .order_by(Regulation.scraped_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    regulations = result.scalars().all()
    return [RegulationResponse.model_validate(r) for r in regulations]


@router.get("/types", response_model=List[str])
async def get_regulation_types(db: AsyncSession = Depends(get_db)):
    """Get list of distinct regulation types in the database."""
    stmt = select(Regulation.regulation_type).distinct().where(Regulation.is_active == True)
    result = await db.execute(stmt)
    types = [row[0] for row in result.fetchall() if row[0]]
    # Add standard types even if not yet in DB
    standard_types = {"law", "decree", "circular", "announcement"}
    all_types = sorted(standard_types.union(set(types)))
    return all_types


@router.get("/{regulation_id}", response_model=RegulationResponse)
async def get_regulation(
    regulation_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single regulation by ID."""
    result = await db.execute(
        select(Regulation).where(
            Regulation.id == regulation_id,
            Regulation.is_active == True,
        )
    )
    regulation = result.scalar_one_or_none()
    if not regulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Regulation {regulation_id} not found",
        )
    return RegulationResponse.model_validate(regulation)


@router.post("/", response_model=RegulationResponse, status_code=status.HTTP_201_CREATED)
async def create_regulation(
    regulation_data: RegulationCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Admin: manually create a regulation entry."""
    # Check for duplicate source URL
    if regulation_data.source_url:
        existing = await db.execute(
            select(Regulation).where(Regulation.source_url == regulation_data.source_url)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Regulation with this source URL already exists",
            )

    # Generate summaries and embeddings if content provided
    summary_en = regulation_data.summary_en
    summary_ar = regulation_data.summary_ar
    embedding = None

    source_text = regulation_data.content_en or regulation_data.content_ar or ""
    if source_text and settings.ANTHROPIC_API_KEY:
        if not summary_en:
            summary_en = await summarize_regulation(source_text, "en")
        if not summary_ar:
            summary_ar = await summarize_regulation(source_text, "ar")

    combined_text = " ".join(filter(None, [
        regulation_data.title_en,
        regulation_data.title_ar,
        regulation_data.content_en,
        regulation_data.content_ar,
    ]))
    if combined_text:
        embedding = generate_embedding(combined_text)

    regulation = Regulation(
        **regulation_data.model_dump(),
        summary_en=summary_en,
        summary_ar=summary_ar,
        embedding=embedding,
        is_active=True,
    )
    db.add(regulation)
    await db.commit()
    await db.refresh(regulation)
    return RegulationResponse.model_validate(regulation)


@router.put("/{regulation_id}", response_model=RegulationResponse)
async def update_regulation(
    regulation_id: int,
    update_data: RegulationUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Admin: update a regulation entry."""
    result = await db.execute(
        select(Regulation).where(Regulation.id == regulation_id)
    )
    regulation = result.scalar_one_or_none()
    if not regulation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regulation not found")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(regulation, field, value)

    await db.commit()
    await db.refresh(regulation)
    return RegulationResponse.model_validate(regulation)
