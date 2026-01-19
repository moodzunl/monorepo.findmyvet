"""
Application configuration using Pydantic Settings.
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App
    app_name: str = "FindMyVet API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/findmyvet"

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalize_database_url(cls, v: str) -> str:
        """
        Ensure we use the async driver by default.

        If a user sets DATABASE_URL like `postgresql://...`, SQLAlchemy will try to use
        the psycopg2 dialect, which requires `psycopg2`. Our backend is async and uses
        `asyncpg`, so we rewrite it to `postgresql+asyncpg://...`.
        """
        if not isinstance(v, str):
            return v
        value = v.strip()
        if value.startswith("postgres://"):
            # Common alias -> normalize to postgresql
            value = "postgresql://" + value[len("postgres://") :]
        if value.startswith("postgresql://") and "+asyncpg" not in value:
            return "postgresql+asyncpg://" + value[len("postgresql://") :]
        return value
    
    # Auth
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Clerk Auth (JWT verification via JWKS)
    # Use these if you want your backend to accept Clerk-issued JWTs (recommended for the mobile app).
    clerk_jwks_url: str | None = None
    clerk_issuer: str | None = None
    clerk_audience: str | None = None

    # Dev safety valve:
    # If True (or if DEBUG=true), allow an existing DB user row found by email to be re-linked
    # to a new Clerk user id. This avoids 409 loops during local development when Clerk users
    # get recreated/reset. Keep this False in production.
    allow_clerk_email_relink: bool = False
    
    # Admin / backoffice
    # Used to protect reviewer endpoints (approve/reject applications) until a proper admin UI + roles exist.
    # Set PROVIDER_REVIEW_API_KEY in backend/.env.
    provider_review_api_key: str | None = None
    
    # The email address that has full admin access
    admin_email: str = "ferarersunl@hotmail.com"
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    # In some environments (like sandboxed CI runners) reading `.env` can be disallowed.
    # Fall back to environment-only settings in that case.
    try:
        return Settings()
    except (PermissionError, OSError):
        return Settings(_env_file=None)
