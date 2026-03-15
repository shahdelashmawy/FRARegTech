from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    title: str
    filename: str
    source_url: Optional[str] = None
    regulation_type: Optional[str] = None
    published_date: Optional[date] = None
    tags: List[str] = []
    uploaded_at: datetime
    processed: bool
    processing_error: Optional[str] = None

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    items: List[DocumentResponse]
    total: int
    skip: int
    limit: int


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    source_url: Optional[str] = None
    regulation_type: Optional[str] = None
    published_date: Optional[date] = None
    tags: Optional[List[str]] = None
