from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://fraregtech:password@localhost:5432/fraregtech"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Claude AI
    ANTHROPIC_API_KEY: str = ""

    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""

    # Twilio (WhatsApp)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"

    # App
    APP_NAME: str = "FRA RegTech"
    FRONTEND_URL: str = "http://localhost:3000"

    # Scraping
    FRA_BASE_URL: str = "https://www.fra.gov.eg"
    SCRAPE_INTERVAL_HOURS: int = 24

    # File uploads
    UPLOAD_DIR: str = "/app/uploads"
    MAX_FILE_SIZE_MB: int = 50

    # Vector search
    VECTOR_DIMENSION: int = 384  # paraphrase-multilingual-MiniLM-L12-v2 output dim
    TOP_K_RESULTS: int = 5

    class Config:
        env_file = ".env"


settings = Settings()
