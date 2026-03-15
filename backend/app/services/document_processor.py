import logging
import os
from typing import Optional
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.services.embedding_service import generate_embedding
from app.services.translation_service import translate_to_english, translate_to_arabic

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> Optional[str]:
    """Extract text from a PDF file using PyPDF2."""
    try:
        import PyPDF2
        text_parts = []
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n".join(text_parts)
    except Exception as e:
        logger.error(f"PDF extraction failed for {file_path}: {e}")
        return None


def extract_text_from_docx(file_path: str) -> Optional[str]:
    """Extract text from a Word document."""
    try:
        from docx import Document as DocxDocument
        doc = DocxDocument(file_path)
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        return "\n".join(paragraphs)
    except Exception as e:
        logger.error(f"DOCX extraction failed for {file_path}: {e}")
        return None


def extract_text_from_txt(file_path: str) -> Optional[str]:
    """Extract text from a plain text file."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except Exception as e:
        logger.error(f"TXT extraction failed for {file_path}: {e}")
        return None


def extract_text(file_path: str) -> Optional[str]:
    """Extract text from a document based on its file extension."""
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return extract_text_from_docx(file_path)
    elif ext in (".txt", ".md"):
        return extract_text_from_txt(file_path)
    else:
        logger.warning(f"Unsupported file type: {ext}")
        return None


def detect_language(text: str) -> str:
    """Detect if text is primarily Arabic or English."""
    arabic_chars = sum(1 for c in text if "\u0600" <= c <= "\u06FF")
    total_alpha = sum(1 for c in text if c.isalpha())
    if total_alpha == 0:
        return "en"
    return "ar" if (arabic_chars / total_alpha) > 0.4 else "en"


async def process_document_file(db: AsyncSession, document: Document) -> None:
    """
    Full document processing pipeline:
    1. Extract text from file
    2. Detect language
    3. Translate to other language (if API key available)
    4. Generate embedding
    5. Update document record
    """
    if not os.path.exists(document.file_path):
        raise FileNotFoundError(f"File not found: {document.file_path}")

    # Extract text
    extracted_text = extract_text(document.file_path)
    if not extracted_text:
        raise ValueError("Could not extract text from document")

    extracted_text = extracted_text.strip()
    lang = detect_language(extracted_text)

    from app.config import settings

    if lang == "ar":
        document.content_ar = extracted_text
        if settings.ANTHROPIC_API_KEY:
            document.content_text = await translate_to_english(extracted_text)
    else:
        document.content_text = extracted_text
        if settings.ANTHROPIC_API_KEY:
            document.content_ar = await translate_to_arabic(extracted_text)

    # Generate embedding from combined text
    combined = " ".join(filter(None, [document.content_text, document.content_ar]))
    if combined:
        document.embedding = generate_embedding(combined[:8000])

    document.processed = True
    document.processing_error = None
    await db.commit()
    logger.info(f"Document {document.id} processed successfully")
