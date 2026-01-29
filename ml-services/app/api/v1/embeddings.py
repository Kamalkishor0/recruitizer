from typing import Optional

import fitz
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.services.embedding import embedding_service

router = APIRouter(tags=["embeddings"])


def _extract_pdf_text(file_bytes: bytes) -> str:
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            pages = [page.get_text() for page in doc]
        text = "\n".join(pages).strip()
        return text
    except Exception as exc:  # pragma: no cover - passthrough for user-facing error
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid PDF uploaded") from exc


@router.post("/resume/embed")
async def embed_resume(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
) -> dict:
    if not file and not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide a PDF file or text")

    content = ""
    if file:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")
        content = _extract_pdf_text(file_bytes)
    elif text:
        content = text.strip()

    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No text extracted from resume")

    embedding = embedding_service.embed_texts([content])[0]
    return {"embedding": embedding}


@router.post("/job/embed")
async def embed_job(payload: dict) -> dict:
    title = payload.get("title", "") or ""
    description = payload.get("description", "") or ""
    requirements = payload.get("requirements", "") or ""
    skills = payload.get("skills", []) or []

    # Join available fields into one text blob for embedding.
    fields = [title.strip(), description.strip(), requirements.strip(), " ".join(skills).strip()]
    text = "\n".join([field for field in fields if field])

    if not text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No job text provided")

    embedding = embedding_service.embed_texts([text])[0]
    job_id = payload.get("jobId") or payload.get("id")
    return {"embedding": embedding, "jobId": job_id}
