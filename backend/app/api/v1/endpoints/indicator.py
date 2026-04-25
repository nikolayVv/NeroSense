from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.indicator import IndicatorCreate, IndicatorOut
from app.services import indicator as service
from app.api.deps import get_db

router = APIRouter()

@router.post("/", response_model=IndicatorOut)
def create(obj: IndicatorCreate, db: Session = Depends(get_db)):
    return service.create_indicator(db, obj)

@router.get("/", response_model=list[IndicatorOut])
def get_all(db: Session = Depends(get_db)):
    return service.get_indicators(db)

@router.get("/{id}", response_model=IndicatorOut)
def get_one(id: int, db: Session = Depends(get_db)):
    ds = service.get_indicator(db, id)
    if not ds:
        raise HTTPException(404, "Not found")
    return ds

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db)):
    return service.delete_indicator(db, id)

