from fastapi import APIRouter

from app.api.v1 import embeddings, recommendations

router = APIRouter()
router.include_router(embeddings.router)
router.include_router(recommendations.router)
