import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text as sa_text
import anthropic

from app.config import settings
from app.models.regulation import Regulation
from app.models.document import Document
from app.models.query_log import QueryLog
from app.services.embedding_service import generate_embedding

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert regulatory compliance advisor specializing in Egyptian financial regulations 
issued by the Financial Regulatory Authority (FRA - هيئة الرقابة المالية). 

Your role is to:
1. Answer questions about FRA regulations accurately based on provided context
2. Cite specific regulations, decrees, and circulars when relevant
3. Explain regulatory requirements clearly for fintech professionals
4. Note when information may be incomplete or when professional legal advice is recommended
5. Respond in the same language as the user's question (Arabic or English)

When referencing regulations, always mention the regulation type (law, decree, circular), 
its number/title, and publication date when available.

If the provided context does not contain sufficient information to answer the question, 
clearly state this and suggest the user consult the FRA directly at www.fra.gov.eg."""


def get_anthropic_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


async def retrieve_relevant_regulations(
    db: AsyncSession,
    query_embedding: List[float],
    regulation_types: Optional[List[str]] = None,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Retrieve the most relevant regulations using vector similarity search.
    Falls back to keyword search if pgvector is not available.
    """
    results = []

    try:
        # Try pgvector cosine similarity search
        type_filter = ""
        params: Dict[str, Any] = {
            "embedding": str(query_embedding),
            "top_k": top_k,
        }

        if regulation_types:
            type_filter = "AND regulation_type = ANY(:reg_types)"
            params["reg_types"] = regulation_types

        query_sql = sa_text(f"""
            SELECT id, title_en, title_ar, summary_en, summary_ar,
                   regulation_type, source_url, published_date,
                   1 - (embedding <=> :embedding::vector) AS similarity
            FROM regulations
            WHERE is_active = true
              AND embedding IS NOT NULL
              {type_filter}
            ORDER BY embedding <=> :embedding::vector
            LIMIT :top_k
        """)
        rows = await db.execute(query_sql, params)
        for row in rows.mappings():
            results.append(dict(row))
    except Exception as e:
        logger.warning(f"Vector search failed, falling back to full-text search: {e}")
        # Fallback: return most recent regulations
        stmt = select(Regulation).where(Regulation.is_active == True).order_by(
            Regulation.published_date.desc()
        ).limit(top_k)
        if regulation_types:
            stmt = stmt.where(Regulation.regulation_type.in_(regulation_types))
        rows = await db.execute(stmt)
        for reg in rows.scalars().all():
            results.append({
                "id": reg.id,
                "title_en": reg.title_en,
                "title_ar": reg.title_ar,
                "summary_en": reg.summary_en,
                "summary_ar": reg.summary_ar,
                "regulation_type": reg.regulation_type,
                "source_url": reg.source_url,
                "published_date": str(reg.published_date) if reg.published_date else None,
                "similarity": None,
            })

    return results


async def retrieve_relevant_documents(
    db: AsyncSession,
    user_id: int,
    query_embedding: List[float],
    top_k: int = 3,
) -> List[Dict[str, Any]]:
    """Retrieve relevant user-uploaded documents using vector similarity."""
    results = []
    try:
        query_sql = sa_text("""
            SELECT id, title, filename, content_text,
                   regulation_type, source_url, published_date,
                   1 - (embedding <=> :embedding::vector) AS similarity
            FROM documents
            WHERE user_id = :user_id
              AND processed = true
              AND embedding IS NOT NULL
            ORDER BY embedding <=> :embedding::vector
            LIMIT :top_k
        """)
        rows = await db.execute(query_sql, {
            "embedding": str(query_embedding),
            "user_id": user_id,
            "top_k": top_k,
        })
        for row in rows.mappings():
            results.append(dict(row))
    except Exception as e:
        logger.warning(f"Document vector search failed: {e}")
    return results


def build_context_prompt(
    question: str,
    regulations: List[Dict[str, Any]],
    documents: List[Dict[str, Any]],
    language: str = "en",
) -> str:
    """Build the prompt with retrieved context for Claude."""
    context_parts = []

    if regulations:
        context_parts.append("=== RELEVANT FRA REGULATIONS ===\n")
        for i, reg in enumerate(regulations, 1):
            title = reg.get("title_en") or reg.get("title_ar") or "Untitled"
            if language == "ar":
                title = reg.get("title_ar") or reg.get("title_en") or "بدون عنوان"
            summary = reg.get("summary_en") or ""
            if language == "ar":
                summary = reg.get("summary_ar") or reg.get("summary_en") or ""

            context_parts.append(
                f"[Regulation {i}]\n"
                f"Title: {title}\n"
                f"Type: {reg.get('regulation_type', 'unknown')}\n"
                f"Published: {reg.get('published_date', 'unknown')}\n"
                f"Source: {reg.get('source_url', 'FRA Website')}\n"
                f"Summary: {summary}\n"
            )

    if documents:
        context_parts.append("\n=== UPLOADED DOCUMENTS ===\n")
        for i, doc in enumerate(documents, 1):
            context_parts.append(
                f"[Document {i}]\n"
                f"Title: {doc.get('title', 'Untitled')}\n"
                f"Type: {doc.get('regulation_type', 'unknown')}\n"
                f"Excerpt: {(doc.get('content_text') or '')[:500]}...\n"
            )

    context_text = "\n".join(context_parts) if context_parts else "No relevant regulations found in database."

    lang_instruction = (
        "Please respond in English."
        if language == "en"
        else "يرجى الإجابة باللغة العربية."
    )

    return (
        f"Based on the following FRA regulatory context, please answer the question.\n\n"
        f"{context_text}\n\n"
        f"QUESTION: {question}\n\n"
        f"{lang_instruction}"
    )


async def answer_query(
    db: AsyncSession,
    question: str,
    user_id: Optional[int] = None,
    language: str = "en",
    regulation_types: Optional[List[str]] = None,
    top_k: int = 5,
) -> Dict[str, Any]:
    """
    Main RAG pipeline: embed query -> retrieve context -> generate answer with Claude.
    """
    if not settings.ANTHROPIC_API_KEY:
        return {
            "answer": "AI query service is not configured. Please set ANTHROPIC_API_KEY.",
            "language": language,
            "sources": [],
            "query_log_id": None,
        }

    # Step 1: Embed the query
    query_embedding = generate_embedding(question)

    # Step 2: Retrieve relevant regulations
    relevant_regs = []
    relevant_docs = []

    if query_embedding:
        relevant_regs = await retrieve_relevant_regulations(
            db, query_embedding, regulation_types, top_k
        )
        if user_id:
            relevant_docs = await retrieve_relevant_documents(
                db, user_id, query_embedding, top_k=3
            )

    # Step 3: Build context-enriched prompt
    prompt = build_context_prompt(question, relevant_regs, relevant_docs, language)

    # Step 4: Query Claude
    answer = ""
    try:
        client = get_anthropic_client()
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        answer = response.content[0].text.strip()
    except Exception as e:
        logger.error(f"Claude API error: {e}")
        answer = f"Error generating response: {str(e)}"

    # Step 5: Log the query
    reg_ids = [r["id"] for r in relevant_regs if "id" in r]
    log_entry = QueryLog(
        user_id=user_id,
        query_text=question,
        response_text=answer,
        relevant_regulations=reg_ids,
        language=language,
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)

    # Build source citations
    sources = []
    for reg in relevant_regs:
        title = reg.get("title_en") or reg.get("title_ar") or "Untitled"
        if language == "ar":
            title = reg.get("title_ar") or reg.get("title_en") or "بدون عنوان"
        sources.append({
            "id": reg.get("id"),
            "title": title,
            "regulation_type": reg.get("regulation_type", "unknown"),
            "source_url": reg.get("source_url"),
            "published_date": str(reg.get("published_date", "")) if reg.get("published_date") else None,
            "relevance_score": float(reg.get("similarity") or 0),
        })

    return {
        "answer": answer,
        "language": language,
        "sources": sources,
        "query_log_id": log_entry.id,
    }


async def semantic_search(
    db: AsyncSession,
    query: str,
    language: str = "en",
    regulation_types: Optional[List[str]] = None,
    top_k: int = 10,
    user_id: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Semantic vector search across regulations and optionally user documents."""
    query_embedding = generate_embedding(query)
    if not query_embedding:
        return []

    regulations = await retrieve_relevant_regulations(
        db, query_embedding, regulation_types, top_k
    )

    results = []
    for reg in regulations:
        title = reg.get("title_en") or reg.get("title_ar") or "Untitled"
        summary = reg.get("summary_en") or ""
        if language == "ar":
            title = reg.get("title_ar") or reg.get("title_en") or "بدون عنوان"
            summary = reg.get("summary_ar") or reg.get("summary_en") or ""
        results.append({
            "id": reg["id"],
            "title": title,
            "summary": summary,
            "regulation_type": reg.get("regulation_type", "unknown"),
            "source_url": reg.get("source_url"),
            "published_date": str(reg.get("published_date")) if reg.get("published_date") else None,
            "relevance_score": float(reg.get("similarity") or 0),
            "source": "regulation",
        })

    if user_id:
        docs = await retrieve_relevant_documents(db, user_id, query_embedding, top_k=5)
        for doc in docs:
            results.append({
                "id": doc["id"],
                "title": doc.get("title", "Untitled"),
                "summary": (doc.get("content_text") or "")[:200],
                "regulation_type": doc.get("regulation_type", "document"),
                "source_url": doc.get("source_url"),
                "published_date": str(doc.get("published_date")) if doc.get("published_date") else None,
                "relevance_score": float(doc.get("similarity") or 0),
                "source": "document",
            })

    # Sort by relevance score descending
    results.sort(key=lambda x: x.get("relevance_score") or 0, reverse=True)
    return results[:top_k]
