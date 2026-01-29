from fastapi import FastAPI

from app.api.v1 import health
from app.api.v1.router import router as api_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name, version=settings.version)

# Unversioned utilities
app.include_router(health.router)

# Versioned API
app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "ml-services is running"}
