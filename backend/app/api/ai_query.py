from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.query_log import QueryLog
from app.models.user import User
from app.schemas.query import (
    QueryRequest,
    QueryResponse,
    CitationSource,
    QueryLogResponse,
    QueryLogListResponse,
)
from app.api.deps import get_current_user, get_optional_current_user
from app.services.rag_service import answer_query

router = APIRouter(prefix="/ai", tags=["AI Query"])


@router.post("/query", response_model=QueryResponse)
async def query_regulations(
    query_request: QueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Ask a question about Egyptian FRA regulations.
    Returns an AI-generated answer with source citations.
    """
    user_id = current_user.id if current_user else None

    result = await answer_query(
        db=db,
        question=query_request.question,
        user_id=user_id,
        language=query_request.language,
        regulation_types=query_request.regulation_types,
        top_k=query_request.top_k,
    )

    sources = [
        CitationSource(
            id=s["id"],
            title=s["title"],
            regulation_type=s["regulation_type"],
            source_url=s.get("source_url"),
            published_date=s.get("published_date"),
            relevance_score=s.get("relevance_score"),
        )
        for s in result["sources"]
    ]

    return QueryResponse(
        answer=result["answer"],
        language=result["language"],
        sources=sources,
        query_log_id=result.get("query_log_id"),
    )


@router.get("/history", response_model=QueryLogListResponse)
async def get_query_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current user's query history."""
    count_result = await db.execute(
        select(func.count()).select_from(QueryLog).where(QueryLog.user_id == current_user.id)
    )
    total = count_result.scalar_one()

    stmt = (
        select(QueryLog)
        .where(QueryLog.user_id == current_user.id)
        .order_by(QueryLog.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    logs = result.scalars().all()

    return QueryLogListResponse(
        items=[QueryLogResponse.model_validate(log) for log in logs],
        total=total,
        skip=skip,
        limit=limit,
    )
