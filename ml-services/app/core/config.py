from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = Field("ml-services", description="Service name")
    version: str = Field("0.1.0", description="Service version")
    model_name: str = Field("all-MiniLM-L6-v2", description="SentenceTransformer model")
    api_prefix: str = Field("/api/v1", description="API prefix for versioned routes")

    class Config:
        env_file = ".env"
        extra = "ignore"
        protected_namespaces = ()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
