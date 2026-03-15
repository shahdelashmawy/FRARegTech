from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import UserCreate, UserUpdate, UserResponse, Token, LoginRequest, PasswordChange
from app.services.auth_service import (
    create_user,
    authenticate_user,
    get_user_by_email,
    update_user,
    change_password,
    create_user_token,
)
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    existing = await get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = await create_user(
        db=db,
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        whatsapp_number=user_data.whatsapp_number,
        preferred_language=user_data.preferred_language,
        keywords=user_data.keywords,
        notification_email=user_data.notification_email,
        notification_whatsapp=user_data.notification_whatsapp,
    )
    token = create_user_token(user)
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate and return a JWT token."""
    user = await authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_user_token(user)
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the current user's profile."""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile."""
    update_fields = update_data.model_dump(exclude_unset=True)
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )
    user = await update_user(db, current_user, **update_fields)
    return UserResponse.model_validate(user)


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_user_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change the current user's password."""
    success = await change_password(
        db,
        current_user,
        password_data.current_password,
        password_data.new_password,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    return {"message": "Password changed successfully"}
