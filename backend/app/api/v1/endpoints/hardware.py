from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.hardware import HardwareCreate, HardwareOut
from app.services import hardware as service
from app.api.deps import get_db

router = APIRouter()

@router.post("/", response_model=HardwareOut)
def create(obj: HardwareCreate, db: Session = Depends(get_db)):
    return service.create_hardware(db, obj)

@router.get("/", response_model=list[HardwareOut])
def get_all(db: Session = Depends(get_db)):
    return service.get_hardwares(db)

@router.get("/{id}", response_model=HardwareOut)
def get_one(id: int, db: Session = Depends(get_db)):
    ds = service.get_hardware(db, id)
    if not ds:
        raise HTTPException(404, "Not found")
    return ds

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db)):
    return service.delete_hardware(db, id)

