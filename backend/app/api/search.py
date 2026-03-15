from typing import Optional, List
from datetime import date

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, and_

from app.database import get_db
from app.models.regulation import Regulation
from app.models.document import Document
from app.models.user import User
from app.schemas.query import SearchResponse, SearchResult, SemanticSearchRequest
from app.api.deps import get_optional_current_user
from app.services.rag_service import semantic_search

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/", response_model=SearchResponse)
async def full_text_search(
    q: str = Query(..., min_length=1, description="Search query"),
    language: str = Query("en", regex="^(en|ar)$"),
    regulation_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Full-text search across regulations (and user's documents if authenticated).
    Searches titles, summaries, and content.
    """
    search_term = f"%{q}%"
    filters = [Regulation.is_active == True]

    if regulation_type:
        filters.append(Regulation.regulation_type == regulation_type)
    if date_from:
        filters.append(Regulation.published_date >= date_from)
    if date_to:
        filters.append(Regulation.published_date <= date_to)

    # Text search in title and summary fields
    text_filter = or_(
        Regulation.title_en.ilike(search_term),
        Regulation.title_ar.ilike(search_term),
        Regulation.summary_en.ilike(search_term),
        Regulation.summary_ar.ilike(search_term),
        Regulation.content_en.ilike(search_term),
        Regulation.content_ar.ilike(search_term),
    )
    filters.append(text_filter)

    stmt = (
        select(Regulation)
        .where(and_(*filters))
        .order_by(Regulation.published_date.desc().nullslast())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    regulations = result.scalars().all()

    results: List[SearchResult] = []
    for reg in regulations:
        title = reg.title_en or reg.title_ar or "Untitled"
        summary = reg.summary_en or ""
        if language == "ar":
            title = reg.title_ar or reg.title_en or "بدون عنوان"
            summary = reg.summary_ar or reg.summary_en or ""

        results.append(SearchResult(
            id=reg.id,
            title=title,
            summary=summary[:300] if summary else None,
            regulation_type=reg.regulation_type,
            source_url=reg.source_url,
            published_date=str(reg.published_date) if reg.published_date else None,
            relevance_score=None,
            source="regulation",
        ))

    # Also search user's documents if authenticated
    if current_user:
        doc_stmt = (
            select(Document)
            .where(
                Document.user_id == current_user.id,
                Document.processed == True,
                or_(
                    Document.title.ilike(search_term),
                    Document.content_text.ilike(search_term),
                    Document.content_ar.ilike(search_term),
                ),
            )
            .limit(10)
        )
        doc_result = await db.execute(doc_stmt)
        documents = doc_result.scalars().all()
        for doc in documents:
            results.append(SearchResult(
                id=doc.id,
                title=doc.title,
                summary=(doc.content_text or "")[:300] or None,
                regulation_type=doc.regulation_type or "document",
                source_url=doc.source_url,
                published_date=str(doc.published_date) if doc.published_date else None,
                relevance_score=None,
                source="document",
            ))

    return SearchResponse(
        results=results,
        total=len(results),
        query=q,
    )


@router.post("/semantic", response_model=SearchResponse)
async def semantic_search_endpoint(
    search_request: SemanticSearchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Semantic vector search across regulations using AI embeddings.
    Returns results ranked by semantic relevance.
    """
    user_id = current_user.id if current_user else None

    results = await semantic_search(
        db=db,
        query=search_request.query,
        language=search_request.language,
        regulation_types=search_request.regulation_types,
        top_k=search_request.top_k,
        user_id=user_id,
    )

    search_results = [
        SearchResult(
            id=r["id"],
            title=r["title"],
            summary=r.get("summary"),
            regulation_type=r["regulation_type"],
            source_url=r.get("source_url"),
            published_date=r.get("published_date"),
            relevance_score=r.get("relevance_score"),
            source=r.get("source", "regulation"),
        )
        for r in results
    ]

    return SearchResponse(
        results=search_results,
        total=len(search_results),
        query=search_request.query,
    )
