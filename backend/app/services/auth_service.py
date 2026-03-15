import logging
from typing import Optional
from datetime import timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.core.security import verify_password, get_password_hash, create_access_token
from app.config import settings

logger = logging.getLogger(__name__)


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    email: str,
    password: str,
    full_name: Optional[str] = None,
    whatsapp_number: Optional[str] = None,
    preferred_language: str = "en",
    keywords: Optional[list] = None,
    notification_email: bool = True,
    notification_whatsapp: bool = False,
) -> User:
    password_hash = get_password_hash(password)
    user = User(
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        whatsapp_number=whatsapp_number,
        preferred_language=preferred_language,
        keywords=keywords or [],
        notification_email=notification_email,
        notification_whatsapp=notification_whatsapp,
        is_active=True,
        is_admin=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    logger.info(f"Created new user: {email}")
    return user


async def authenticate_user(
    db: AsyncSession, email: str, password: str
) -> Optional[User]:
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    if not user.is_active:
        return None
    return user


async def update_user(db: AsyncSession, user: User, **kwargs) -> User:
    for key, value in kwargs.items():
        if hasattr(user, key) and value is not None:
            setattr(user, key, value)
    await db.commit()
    await db.refresh(user)
    return user


async def change_password(
    db: AsyncSession, user: User, current_password: str, new_password: str
) -> bool:
    if not verify_password(current_password, user.password_hash):
        return False
    user.password_hash = get_password_hash(new_password)
    await db.commit()
    return True


def create_user_token(user: User) -> str:
    return create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
