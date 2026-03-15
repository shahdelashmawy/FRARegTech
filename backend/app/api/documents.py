import os
import uuid
import aiofiles
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentResponse, DocumentListResponse
from app.api.deps import get_current_user
from app.config import settings

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md"}
MAX_FILE_SIZE = settings.MAX_FILE_SIZE_MB * 1024 * 1024  # bytes


def get_upload_dir() -> Path:
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    regulation_type: Optional[str] = Form(None),
    source_url: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a PDF, Word, or text document for processing."""
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file content to check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit",
        )

    # Save file to disk
    upload_dir = get_upload_dir()
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = upload_dir / unique_filename

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Create document record
    doc_title = title or Path(file.filename).stem
    document = Document(
        user_id=current_user.id,
        title=doc_title,
        filename=file.filename,
        file_path=str(file_path),
        regulation_type=regulation_type,
        source_url=source_url,
        tags=[],
        processed=False,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    # Trigger async processing via Celery
    try:
        from app.services.scheduler import process_document
        process_document.delay(document.id)
    except Exception as e:
        # Non-fatal: document saved, just not yet processed
        import logging
        logging.getLogger(__name__).warning(f"Could not queue document processing: {e}")

    return DocumentResponse.model_validate(document)


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all documents uploaded by the current user."""
    count_result = await db.execute(
        select(func.count()).select_from(Document).where(Document.user_id == current_user.id)
    )
    total = count_result.scalar_one()

    stmt = (
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.uploaded_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    documents = result.scalars().all()

    return DocumentListResponse(
        items=[DocumentResponse.model_validate(d) for d in documents],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get details of a specific document."""
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return DocumentResponse.model_validate(document)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a document and its file."""
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Remove file from disk
    if document.file_path and os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except OSError as e:
            import logging
            logging.getLogger(__name__).warning(f"Could not delete file {document.file_path}: {e}")

    await db.delete(document)
    await db.commit()
