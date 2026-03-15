import logging
import re
from datetime import date, datetime
from typing import List, Dict, Optional, Any
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.regulation import Regulation
from app.services.embedding_service import generate_embedding
from app.services.translation_service import translate_to_english, translate_to_arabic, summarize_regulation

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ar,en;q=0.9",
}

# FRA website URL patterns for different regulation types
FRA_PAGES = [
    {
        "url": "https://www.fra.gov.eg/fra_new/",
        "type": "announcement",
        "section": "News",
    },
    {
        "url": "https://www.fra.gov.eg/fra_new/regulations/",
        "type": "circular",
        "section": "Regulations",
    },
]

# Regex patterns for parsing dates
DATE_PATTERNS = [
    r"(\d{1,2})[/-](\d{1,2})[/-](\d{4})",
    r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})",
]


def clean_text(text: str) -> str:
    """Clean extracted text - remove extra whitespace, normalize."""
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    text = text.strip()
    return text


def detect_language(text: str) -> str:
    """Simple heuristic: if majority of chars are Arabic, classify as Arabic."""
    arabic_chars = sum(1 for c in text if "\u0600" <= c <= "\u06FF")
    total_alpha = sum(1 for c in text if c.isalpha())
    if total_alpha == 0:
        return "en"
    ratio = arabic_chars / total_alpha
    return "ar" if ratio > 0.4 else "en"


def parse_date(text: str) -> Optional[date]:
    """Try to parse a date from text."""
    for pattern in DATE_PATTERNS:
        match = re.search(pattern, text)
        if match:
            groups = match.groups()
            try:
                if len(groups[0]) == 4:
                    return date(int(groups[0]), int(groups[1]), int(groups[2]))
                else:
                    return date(int(groups[2]), int(groups[1]), int(groups[0]))
            except ValueError:
                continue
    return None


def classify_regulation_type(title: str, content: str) -> str:
    """Classify regulation type from title/content keywords."""
    text = (title + " " + content).lower()
    if any(k in text for k in ["قانون", "law no", "law number"]):
        return "law"
    if any(k in text for k in ["decree", "قرار", "مرسوم"]):
        return "decree"
    if any(k in text for k in ["circular", "تعميم", "منشور"]):
        return "circular"
    return "announcement"


async def fetch_page(client: httpx.AsyncClient, url: str) -> Optional[str]:
    """Fetch a web page with error handling."""
    try:
        response = await client.get(url, headers=HEADERS, follow_redirects=True, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        logger.warning(f"Failed to fetch {url}: {e}")
        return None


async def extract_regulation_links(html: str, base_url: str) -> List[str]:
    """Extract regulation/document links from a page."""
    if not html:
        return []
    soup = BeautifulSoup(html, "lxml")
    links = []

    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"]
        if not href or href.startswith("#") or href.startswith("javascript"):
            continue
        full_url = urljoin(base_url, href)
        # Only follow links on the same domain
        if urlparse(full_url).netloc == urlparse(base_url).netloc:
            links.append(full_url)

    return list(set(links))


async def scrape_regulation_page(
    client: httpx.AsyncClient, url: str, default_type: str
) -> Optional[Dict[str, Any]]:
    """Scrape a single regulation page and return structured data."""
    html = await fetch_page(client, url)
    if not html:
        return None

    soup = BeautifulSoup(html, "lxml")

    # Try to extract title (look for h1, h2, or article title tags)
    title_tag = (
        soup.find("h1")
        or soup.find("h2")
        or soup.find("title")
    )
    title_text = clean_text(title_tag.get_text()) if title_tag else ""

    # Extract main content area
    content_tag = (
        soup.find("article")
        or soup.find("main")
        or soup.find("div", class_=re.compile(r"content|article|body|post", re.I))
        or soup.find("div", id=re.compile(r"content|main|article", re.I))
        or soup.body
    )
    content_text = clean_text(content_tag.get_text()) if content_tag else ""

    if not title_text and not content_text:
        return None

    # Remove navigation text and common boilerplate
    content_text = re.sub(
        r"(Home|About|Contact|Search|Menu|Navigation|Copyright|All Rights Reserved)[^\n]*",
        "",
        content_text,
        flags=re.I,
    )
    content_text = clean_text(content_text)

    if len(content_text) < 50:
        return None

    # Detect language and assign title/content to correct fields
    lang = detect_language(title_text + " " + content_text)
    reg_type = classify_regulation_type(title_text, content_text)

    # Try to extract publication date
    date_text = ""
    date_tag = soup.find(class_=re.compile(r"date|time|published", re.I))
    if date_tag:
        date_text = date_tag.get_text()
    pub_date = parse_date(date_text) or parse_date(content_text[:200])

    data: Dict[str, Any] = {
        "title_ar": title_text if lang == "ar" else None,
        "title_en": title_text if lang == "en" else None,
        "content_ar": content_text if lang == "ar" else None,
        "content_en": content_text if lang == "en" else None,
        "regulation_type": reg_type or default_type,
        "source_url": url,
        "published_date": pub_date,
        "tags": [],
    }
    return data


async def save_regulation(
    db: AsyncSession, data: Dict[str, Any]
) -> Optional[Regulation]:
    """Save or update a regulation in the database."""
    # Check for duplicate by source_url
    existing = await db.execute(
        select(Regulation).where(Regulation.source_url == data["source_url"])
    )
    existing_reg = existing.scalar_one_or_none()

    if existing_reg:
        logger.debug(f"Regulation already exists: {data['source_url']}")
        return existing_reg

    # Generate translations and summaries if API key is set
    if settings.ANTHROPIC_API_KEY:
        if data.get("content_ar") and not data.get("content_en"):
            data["content_en"] = await translate_to_english(data["content_ar"])
            data["title_en"] = await translate_to_english(data.get("title_ar", ""))
        elif data.get("content_en") and not data.get("content_ar"):
            data["content_ar"] = await translate_to_arabic(data["content_en"])
            data["title_ar"] = await translate_to_arabic(data.get("title_en", ""))

        # Generate summaries
        source_text = data.get("content_en") or data.get("content_ar") or ""
        if source_text:
            data["summary_en"] = await summarize_regulation(source_text, "en")
            data["summary_ar"] = await summarize_regulation(source_text, "ar")

    # Generate embedding from combined text
    combined_text = " ".join(filter(None, [
        data.get("title_en"),
        data.get("title_ar"),
        data.get("content_en"),
        data.get("content_ar"),
    ]))
    embedding = generate_embedding(combined_text) if combined_text else None

    regulation = Regulation(
        title_en=data.get("title_en"),
        title_ar=data.get("title_ar"),
        content_en=data.get("content_en"),
        content_ar=data.get("content_ar"),
        summary_en=data.get("summary_en"),
        summary_ar=data.get("summary_ar"),
        regulation_type=data.get("regulation_type", "announcement"),
        source_url=data.get("source_url"),
        published_date=data.get("published_date"),
        tags=data.get("tags", []),
        embedding=embedding,
        is_active=True,
    )
    db.add(regulation)
    await db.commit()
    await db.refresh(regulation)
    logger.info(f"Saved new regulation: {regulation.title_en or regulation.title_ar}")
    return regulation


async def run_scraper(db: AsyncSession) -> Dict[str, Any]:
    """
    Main scraper function. Scrapes FRA website for new regulations.
    Returns a summary of the scraping run.
    """
    scraped_count = 0
    new_count = 0
    errors: List[str] = []

    async with httpx.AsyncClient(
        headers=HEADERS, follow_redirects=True, timeout=30.0
    ) as client:
        for page_config in FRA_PAGES:
            url = page_config["url"]
            default_type = page_config["type"]

            logger.info(f"Scraping {url}")
            html = await fetch_page(client, url)
            if not html:
                errors.append(f"Failed to fetch {url}")
                continue

            # Get links to individual regulation pages
            links = await extract_regulation_links(html, url)
            logger.info(f"Found {len(links)} links on {url}")

            # Also try to scrape the listing page itself
            page_data = await scrape_regulation_page(client, url, default_type)
            if page_data:
                scraped_count += 1
                reg = await save_regulation(db, page_data)
                if reg:
                    new_count += 1

            # Limit to first 20 links to avoid overloading
            for link in links[:20]:
                try:
                    data = await scrape_regulation_page(client, link, default_type)
                    if data:
                        scraped_count += 1
                        existing = await db.execute(
                            select(Regulation).where(Regulation.source_url == link)
                        )
                        if not existing.scalar_one_or_none():
                            reg = await save_regulation(db, data)
                            if reg:
                                new_count += 1
                except Exception as e:
                    logger.error(f"Error scraping {link}: {e}")
                    errors.append(f"Error scraping {link}: {str(e)}")

    return {
        "scraped_count": scraped_count,
        "new_regulations": new_count,
        "errors": errors,
        "timestamp": datetime.utcnow().isoformat(),
    }
