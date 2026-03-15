from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class QueryRequest(BaseModel):
    question: str
    language: str = "en"  # "en" or "ar"
    regulation_types: Optional[List[str]] = None
    top_k: int = 5


class CitationSource(BaseModel):
    id: int
    title: str
    regulation_type: str
    source_url: Optional[str] = None
    published_date: Optional[str] = None
    relevance_score: Optional[float] = None


class QueryResponse(BaseModel):
    answer: str
    language: str
    sources: List[CitationSource] = []
    query_log_id: Optional[int] = None


class QueryLogResponse(BaseModel):
    id: int
    query_text: str
    response_text: Optional[str] = None
    relevant_regulations: List[Any] = []
    language: str
    created_at: datetime

    model_config = {"from_attributes": True}


class QueryLogListResponse(BaseModel):
    items: List[QueryLogResponse]
    total: int
    skip: int
    limit: int


class SemanticSearchRequest(BaseModel):
    query: str
    language: str = "en"
    regulation_types: Optional[List[str]] = None
    top_k: int = 10


class SearchResult(BaseModel):
    id: int
    title: str
    summary: Optional[str] = None
    regulation_type: str
    source_url: Optional[str] = None
    published_date: Optional[str] = None
    relevance_score: Optional[float] = None
    source: str = "regulation"  # "regulation" or "document"


class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int
    query: str
