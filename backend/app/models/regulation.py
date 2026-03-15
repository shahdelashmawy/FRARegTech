from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, Date
from sqlalchemy.sql import func
from app.database import Base

try:
    from pgvector.sqlalchemy import Vector
    PGVECTOR_AVAILABLE = True
except ImportError:
    PGVECTOR_AVAILABLE = False


class Regulation(Base):
    __tablename__ = "regulations"

    id = Column(Integer, primary_key=True, index=True)
    title_en = Column(String, nullable=True)
    title_ar = Column(String, nullable=True)
    content_en = Column(Text, nullable=True)
    content_ar = Column(Text, nullable=True)
    summary_en = Column(Text, nullable=True)
    summary_ar = Column(Text, nullable=True)
    regulation_type = Column(
        String, nullable=False, index=True
    )  # law, decree, circular, announcement
    source_url = Column(String, unique=True, nullable=True, index=True)
    published_date = Column(Date, nullable=True)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    tags = Column(JSON, default=list)  # List of tag strings
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    if PGVECTOR_AVAILABLE:
        from app.config import settings
        embedding = Column(Vector(settings.VECTOR_DIMENSION), nullable=True)
    else:
        embedding = Column(JSON, nullable=True)  # Fallback: store as JSON array
