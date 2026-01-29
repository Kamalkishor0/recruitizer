# ML Services (FastAPI)

CPU-only FastAPI service for embeddings and job recommendations using `sentence-transformers` (`all-MiniLM-L6-v2`).

## Endpoints
- `GET /health` — service heartbeat.
- `GET /version` — build info.
- `POST /api/v1/resume/embed` — accept resume (PDF upload or raw text) and return an embedding.
- `POST /api/v1/job/embed` — accept job fields and return an embedding.
- `POST /api/v1/recommend` — accept a resume (text or embedding) plus jobs (text or embeddings) and return top matches.

## Quickstart
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Environment
- `MODEL_NAME` (optional): defaults to `all-MiniLM-L6-v2`.
- `API_PREFIX` (optional): defaults to `/api/v1`.

## Notes
- No auth enabled yet. Add shared secret or JWT later if exposed publicly.
- PyMuPDF is used for PDF text extraction; unsupported files should send raw text instead.
