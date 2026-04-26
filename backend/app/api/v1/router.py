from fastapi import APIRouter
from app.api.v1.endpoints import (
    health, 
    gee, 
    auth,
    data_source,
    indicator,
    hardware,
    mission,
    analysis
)

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(gee.router, prefix="/gee", tags=["GEE"])
api_router.include_router(data_source.router, prefix="/data-sources", tags=["data_sources"])
api_router.include_router(indicator.router, prefix="/indicators", tags=["indicators"])
api_router.include_router(hardware.router, prefix="/hardwares", tags=["hardwares"])
api_router.include_router(mission.router, prefix="/missions", tags=["missions"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
