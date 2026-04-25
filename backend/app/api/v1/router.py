from fastapi import APIRouter
from app.api.v1.endpoints import health, gee, auth

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(gee.router, prefix="/gee", tags=["GEE"])

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])