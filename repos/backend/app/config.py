"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # Database
    DATABASE_URL: str = "sqlite:///./data/casetecnico.db"

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # Debug
    DEBUG: bool = False

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]


settings = Settings()
