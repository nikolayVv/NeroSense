from fastapi import FastAPI
from app.core.database import SessionLocal
from app.core.seed import seed_data
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.database import Base, engine
from app.core.gee import initialize_gee

# import models so SQLAlchemy sees them
from app.models import data_source, hardware, indicator, mission, user


def create_app() -> FastAPI:
    setup_logging()

    app = FastAPI(
        title=settings.APP_NAME,
        debug=settings.DEBUG,
        root_path=f"/api/{settings.API_VERSION}",
    )

    app.include_router(api_router)

    @app.on_event("startup")
    def on_startup():
        Base.metadata.create_all(bind=engine)
        initialize_gee()
        db = SessionLocal()
        try:
            seed_data(db)
        finally:
            db.close()

    return app


app = create_app()