from sqlalchemy.orm import Session
from app.models.indicator import Indicator


def create_indicator(db: Session, obj):
    ind = Indicator(**obj.dict())
    db.add(ind)
    db.commit()
    db.refresh(ind)
    return ind


def get_indicators(db: Session):
    return db.query(Indicator).all()