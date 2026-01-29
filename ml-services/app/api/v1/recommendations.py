from datetime import datetime, timezone
from typing import List, Optional, Sequence

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, validator

from app.services.embedding import embedding_service

router = APIRouter(tags=["recommendations"])


class JobItem(BaseModel):
    job_id: str = Field(..., alias="jobId")
    text: Optional[str] = None
    embedding: Optional[List[float]] = None
    expires_at: Optional[datetime] = Field(None, alias="expiresAt")

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }


class RecommendationRequest(BaseModel):
    resume_text: Optional[str] = Field(None, alias="resumeText")
    resume_embedding: Optional[List[float]] = Field(None, alias="resumeEmbedding")
    jobs: List[JobItem]
    top_k: int = Field(20, alias="topK", ge=1, le=200)

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }

    @validator("resume_embedding", always=True)
    def validate_resume(cls, value, values):  # noqa: N805
        text = values.get("resume_text")
        if value is None and (text is None or not text.strip()):
            raise ValueError("Provide resumeText or resumeEmbedding")
        return value


@router.post("/recommend")
async def recommend_jobs(payload: RecommendationRequest) -> dict:
    # Prepare resume embedding
    resume_embedding = payload.resume_embedding
    if resume_embedding is None:
        resume_embedding = embedding_service.embed_texts([payload.resume_text.strip()])[0]

    # Prepare job embeddings
    job_embeddings: List[Sequence[float]] = []
    job_ids: List[str] = []
    eligible_jobs = []

    for job in payload.jobs:
        if job.expires_at:
            expiry = job.expires_at
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)
            if expiry <= datetime.now(timezone.utc):
                continue
        eligible_jobs.append(job)

    for job in eligible_jobs:
        if job.embedding is not None:
            emb = job.embedding
        else:
            if not job.text:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Job {job.job_id} missing text and embedding",
                )
            emb = embedding_service.embed_texts([job.text.strip()])[0]
        job_ids.append(job.job_id)
        job_embeddings.append(emb)

    if not job_embeddings:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No eligible (non-expired) jobs provided")

    scores = embedding_service.similarity_scores(resume_embedding, job_embeddings)
    scored_jobs = list(zip(job_ids, scores))
    scored_jobs.sort(key=lambda x: x[1], reverse=True)

    top_k = min(payload.top_k, len(scored_jobs))
    top_matches = [{"jobId": job_id, "score": score} for job_id, score in scored_jobs[:top_k]]

    return {"results": top_matches, "count": top_k}
