from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    whatsapp_number = Column(String, nullable=True)
    preferred_language = Column(String, default="en")  # "en" or "ar"
    keywords = Column(JSON, default=list)  # List of keyword strings to track
    notification_email = Column(Boolean, default=True)
    notification_whatsapp = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    documents = relationship("Document", back_populates="user", lazy="select")
    alerts = relationship("Alert", back_populates="user", lazy="select")
    query_logs = relationship("QueryLog", back_populates="user", lazy="select")
