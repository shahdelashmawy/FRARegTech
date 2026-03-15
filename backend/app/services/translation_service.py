import logging
from typing import Optional
import anthropic
from app.config import settings

logger = logging.getLogger(__name__)


def get_anthropic_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


async def translate_to_english(arabic_text: str) -> Optional[str]:
    """Translate Arabic regulatory text to English using Claude."""
    if not arabic_text or not arabic_text.strip():
        return None
    if not settings.ANTHROPIC_API_KEY:
        logger.warning("ANTHROPIC_API_KEY not set; skipping translation")
        return None
    try:
        client = get_anthropic_client()
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=4096,
            system=(
                "You are a professional translator specializing in Egyptian financial and legal documents. "
                "Translate the provided Arabic text to clear, accurate English. "
                "Preserve all regulatory terminology, article numbers, and legal references. "
                "Output only the translated text, no explanations."
            ),
            messages=[
                {
                    "role": "user",
                    "content": f"Translate the following Arabic regulatory text to English:\n\n{arabic_text}",
                }
            ],
        )
        return response.content[0].text.strip()
    except Exception as e:
        logger.error(f"Translation to English failed: {e}")
        return None


async def translate_to_arabic(english_text: str) -> Optional[str]:
    """Translate English regulatory text to Arabic using Claude."""
    if not english_text or not english_text.strip():
        return None
    if not settings.ANTHROPIC_API_KEY:
        logger.warning("ANTHROPIC_API_KEY not set; skipping translation")
        return None
    try:
        client = get_anthropic_client()
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=4096,
            system=(
                "You are a professional translator specializing in Egyptian financial and legal documents. "
                "Translate the provided English text to clear, accurate Modern Standard Arabic (فصحى). "
                "Preserve all regulatory terminology, article numbers, and legal references. "
                "Output only the translated Arabic text, no explanations."
            ),
            messages=[
                {
                    "role": "user",
                    "content": f"Translate the following English regulatory text to Arabic:\n\n{english_text}",
                }
            ],
        )
        return response.content[0].text.strip()
    except Exception as e:
        logger.error(f"Translation to Arabic failed: {e}")
        return None


async def summarize_regulation(text: str, language: str = "en") -> Optional[str]:
    """Generate a concise summary of a regulation in the specified language."""
    if not text or not text.strip():
        return None
    if not settings.ANTHROPIC_API_KEY:
        logger.warning("ANTHROPIC_API_KEY not set; skipping summarization")
        return None
    try:
        client = get_anthropic_client()
        lang_instruction = (
            "Respond in English." if language == "en" else "أجب باللغة العربية."
        )
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=512,
            system=(
                "You are an expert on Egyptian financial regulations issued by the Financial Regulatory Authority (FRA). "
                f"Summarize regulatory documents concisely (2-4 sentences) highlighting key requirements and obligations. "
                f"{lang_instruction}"
            ),
            messages=[
                {
                    "role": "user",
                    "content": f"Please summarize this regulation:\n\n{text[:6000]}",
                }
            ],
        )
        return response.content[0].text.strip()
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        return None
