from sqlalchemy.orm import Session
from app.models.hardware import Hardware


def create_hardware(db: Session, obj):
    hw = Hardware(**obj.dict())
    db.add(hw)
    db.commit()
    db.refresh(hw)
    return hw


def get_hardwares(db: Session):
    return db.query(Hardware).all()