from __future__ import annotations

from typing import Iterable, List, Sequence

import numpy as np
import torch
from sentence_transformers import SentenceTransformer

from app.core.config import get_settings


class EmbeddingService:
    def __init__(self) -> None:
        settings = get_settings()
        self.model = SentenceTransformer(settings.model_name, device="cpu")

    def embed_texts(self, texts: Sequence[str]) -> List[List[float]]:
        # Normalize embeddings so dot product == cosine similarity.
        embeddings = self.model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return embeddings.tolist()

    def similarity_scores(
        self, query_embedding: Sequence[float], corpus_embeddings: Iterable[Sequence[float]]
    ) -> List[float]:
        query = np.array(query_embedding, dtype=np.float32)
        corpus = np.array(list(corpus_embeddings), dtype=np.float32)

        if query.ndim != 1:
            raise ValueError("query_embedding must be a 1D vector")
        if corpus.ndim != 2:
            raise ValueError("corpus_embeddings must be a 2D array")
        if corpus.shape[0] == 0:
            return []
        if corpus.shape[1] != query.shape[0]:
            raise ValueError("Embedding dimensions do not match")

        scores = corpus @ query  # cosine similarity because vectors are normalized
        return scores.tolist()


embedding_service = EmbeddingService()
