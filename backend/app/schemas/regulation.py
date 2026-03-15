from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class RegulationBase(BaseModel):
    title_en: Optional[str] = None
    title_ar: Optional[str] = None
    content_en: Optional[str] = None
    content_ar: Optional[str] = None
    summary_en: Optional[str] = None
    summary_ar: Optional[str] = None
    regulation_type: str
    source_url: Optional[str] = None
    published_date: Optional[date] = None
    tags: List[str] = []


class RegulationCreate(RegulationBase):
    pass


class RegulationUpdate(BaseModel):
    title_en: Optional[str] = None
    title_ar: Optional[str] = None
    content_en: Optional[str] = None
    content_ar: Optional[str] = None
    summary_en: Optional[str] = None
    summary_ar: Optional[str] = None
    regulation_type: Optional[str] = None
    source_url: Optional[str] = None
    published_date: Optional[date] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class RegulationResponse(RegulationBase):
    id: int
    is_active: bool
    scraped_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class RegulationListResponse(BaseModel):
    items: List[RegulationResponse]
    total: int
    skip: int
    limit: int
