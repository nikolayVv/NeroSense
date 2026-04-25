from sqlalchemy.orm import Session
from app.models.hardware import Hardware


def get_hardware(db: Session, id: int):
    return db.query(Hardware).filter(Hardware.id == id).first()


def get_hardwares(db: Session):
    return db.query(Hardware).all()


def create_hardware(db: Session, obj):
    hw = Hardware(**obj.dict())
    db.add(hw)
    db.commit()
    db.refresh(hw)
    return hw


def delete_hardware(db: Session, id: int):
    hw = get_hardware(db, id)
    if hw:
        db.delete(hw)
        db.commit()
    return hw