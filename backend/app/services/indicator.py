from sqlalchemy.orm import Session
from app.models.indicator import Indicator


def get_indicator(db: Session, id: int):
    return db.query(Indicator).filter(Indicator.id == id).first()


def get_indicators(db: Session):
    return db.query(Indicator).all()


def create_indicator(db: Session, obj):
    ind = Indicator(**obj.dict())
    db.add(ind)
    db.commit()
    db.refresh(ind)
    return ind


def delete_indicator(db: Session, id: int):
    ind = get_indicator(db, id)
    if ind:
        db.delete(ind)
        db.commit()
    return ind