from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "NeroSense API"
    DEBUG: bool = True
    API_VERSION: str = "v1"
    DATABASE_USER: str = "postgres"
    DATABASE_PASSWORD: str = "postgres"
    DATABASE_PORT: int = 5432
    DATABASE_NAME: str = "nerosense"
    GEE_SERVICE_ACCOUNT: str
    GEE_KEY_PATH: str

    # future use
    DATA_PATH: str = "./data"

    class Config:
        env_file = ".env"


settings = Settings()