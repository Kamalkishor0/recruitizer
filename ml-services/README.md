---
title: ML Services
emoji: 🤖
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

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

## Deploy to Hugging Face Spaces

1. Create a new Space on [Hugging Face Spaces](https://huggingface.co/spaces) with **Docker** SDK.

2. Push the `ml-services` folder to your Space repository:
   ```bash
   cd ml-services
   git init
   git remote add origin https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

3. The Space will automatically build and deploy. The API will be available at:
   - `https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space/`

4. Test the deployment:
   ```bash
   curl https://YOUR_USERNAME-YOUR_SPACE_NAME.hf.space/health
   ```

## Notes
- No auth enabled yet. Add shared secret or JWT later if exposed publicly.
- PyMuPDF is used for PDF text extraction; unsupported files should send raw text instead.
- Hugging Face Spaces uses port 7860 by default (configured in Dockerfile).
