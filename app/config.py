from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./aporia.db"
    api_version: str = "1.0.0"
    scoring_mode: str = "stub"
    gemini_api_key: str | None = None
    gemini_model_id: str = "gemini-2.0-flash"
    cors_origins: str = "*"


settings = Settings()
