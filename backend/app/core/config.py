from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "TradeAI Pro"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://tradeai:tradeai_secret@postgres:5432/tradeai"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # Security
    SECRET_KEY: str = "change-me-in-production-use-32-chars-minimum"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # Market data exchange (via ccxt)
    EXCHANGE: str = "binance"
    API_KEY: Optional[str] = None
    API_SECRET: Optional[str] = None

    # Signal engine
    SIGNAL_INTERVAL_SECONDS: int = 60

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://frontend:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
