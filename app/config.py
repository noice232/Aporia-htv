from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./aporia.db"
    api_version: str = "1.0.0"


settings = Settings()
