from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    whatsapp_number: Optional[str] = None
    preferred_language: str = "en"
    keywords: List[str] = []
    notification_email: bool = True
    notification_whatsapp: bool = False


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("preferred_language")
    @classmethod
    def language_valid(cls, v: str) -> str:
        if v not in ("en", "ar"):
            raise ValueError("preferred_language must be 'en' or 'ar'")
        return v


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    whatsapp_number: Optional[str] = None
    preferred_language: Optional[str] = None
    keywords: Optional[List[str]] = None
    notification_email: Optional[bool] = None
    notification_whatsapp: Optional[bool] = None

    @field_validator("preferred_language")
    @classmethod
    def language_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("en", "ar"):
            raise ValueError("preferred_language must be 'en' or 'ar'")
        return v


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
