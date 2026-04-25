from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.mission import MissionCreate, MissionOut
from app.services import mission as service
from app.api.deps import get_db

router = APIRouter()

@router.post("/", response_model=MissionOut)
def create(obj: MissionCreate, db: Session = Depends(get_db)):
    return service.create_mission(db, obj)

@router.get("/", response_model=list[MissionOut])
def get_all(db: Session = Depends(get_db)):
    return service.get_missions(db)

@router.get("/{id}", response_model=MissionOut)
def get_one(id: int, db: Session = Depends(get_db)):
    mission = service.get_mission(db, id)
    if not mission:
        raise HTTPException(404, "Not found")
    return mission

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db)):
    return service.delete_mission(db, id)