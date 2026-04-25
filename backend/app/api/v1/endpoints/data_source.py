from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.data_source import DataSourceCreate, DataSourceOut
from app.services import data_source as service
from app.api.deps import get_db

router = APIRouter()

@router.post("/", response_model=DataSourceOut)
def create(obj: DataSourceCreate, db: Session = Depends(get_db)):
    return service.create_data_source(db, obj)

@router.get("/", response_model=list[DataSourceOut])
def get_all(db: Session = Depends(get_db)):
    return service.get_data_sources(db)

@router.get("/{id}", response_model=DataSourceOut)
def get_one(id: int, db: Session = Depends(get_db)):
    ds = service.get_data_source(db, id)
    if not ds:
        raise HTTPException(404, "Not found")
    return ds

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db)):
    return service.delete_data_source(db, id)

