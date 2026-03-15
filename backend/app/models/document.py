from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

try:
    from pgvector.sqlalchemy import Vector
    PGVECTOR_AVAILABLE = True
except ImportError:
    PGVECTOR_AVAILABLE = False


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    content_text = Column(Text, nullable=True)  # Extracted English text
    content_ar = Column(Text, nullable=True)    # Extracted/translated Arabic text
    source_url = Column(String, nullable=True)
    regulation_type = Column(String, nullable=True)
    published_date = Column(Date, nullable=True)
    tags = Column(JSON, default=list)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    processed = Column(Boolean, default=False)
    processing_error = Column(Text, nullable=True)

    if PGVECTOR_AVAILABLE:
        from app.config import settings
        embedding = Column(Vector(settings.VECTOR_DIMENSION), nullable=True)
    else:
        embedding = Column(JSON, nullable=True)

    # Relationships
    user = relationship("User", back_populates="documents")
