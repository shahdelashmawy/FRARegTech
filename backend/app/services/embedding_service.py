import logging
from typing import List, Optional
from functools import lru_cache

logger = logging.getLogger(__name__)

_model = None


def get_embedding_model():
    """Lazy-load the sentence transformer model."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
            logger.info("Loaded sentence-transformer model: paraphrase-multilingual-MiniLM-L12-v2")
        except Exception as e:
            logger.error(f"Failed to load sentence-transformer model: {e}")
            raise
    return _model


def generate_embedding(text: str) -> Optional[List[float]]:
    """
    Generate a 384-dimensional embedding for the given text.
    Works for both Arabic and English.
    """
    if not text or not text.strip():
        return None
    try:
        model = get_embedding_model()
        # Truncate to avoid memory issues with very long texts
        text = text[:8000]
        embedding = model.encode(text, normalize_embeddings=True)
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        return None


def generate_batch_embeddings(texts: List[str]) -> List[Optional[List[float]]]:
    """
    Generate embeddings for a batch of texts efficiently.
    """
    if not texts:
        return []
    try:
        model = get_embedding_model()
        # Truncate texts
        truncated = [t[:8000] if t else "" for t in texts]
        # Filter out empty texts and remember positions
        non_empty = [(i, t) for i, t in enumerate(truncated) if t.strip()]
        if not non_empty:
            return [None] * len(texts)

        indices, valid_texts = zip(*non_empty)
        embeddings_array = model.encode(list(valid_texts), normalize_embeddings=True, batch_size=32)

        result: List[Optional[List[float]]] = [None] * len(texts)
        for idx, emb in zip(indices, embeddings_array):
            result[idx] = emb.tolist()
        return result
    except Exception as e:
        logger.error(f"Error generating batch embeddings: {e}")
        return [None] * len(texts)


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    import math
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)
