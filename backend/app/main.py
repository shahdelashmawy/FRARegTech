import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.api import auth, regulations, documents, alerts, search, ai_query, scraper, stats

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    import asyncio

    # Startup
    logger.info(f"Starting {settings.APP_NAME}...")
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")

    yield

    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Egyptian Financial Regulatory Authority (FRA) RegTech Platform. "
        "Track FRA regulations, search knowledge base, and get AI-powered compliance answers."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS — allow all origins (JWT auth via Authorization header, no cookies needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router, prefix="/api")
app.include_router(regulations.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(ai_query.router, prefix="/api")
app.include_router(scraper.router, prefix="/api")
app.include_router(stats.router, prefix="/api")


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - health check."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/api/docs",
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint — returns immediately so Railway healthchecks pass."""
    return {"status": "ok", "app": settings.APP_NAME}
