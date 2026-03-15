from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AlertBase(BaseModel):
    name: str
    keywords: List[str] = []
    regulation_types: List[str] = []
    is_active: bool = True


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    name: Optional[str] = None
    keywords: Optional[List[str]] = None
    regulation_types: Optional[List[str]] = None
    is_active: Optional[bool] = None


class AlertResponse(AlertBase):
    id: int
    user_id: int
    last_triggered: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertListResponse(BaseModel):
    items: List[AlertResponse]
    total: int
