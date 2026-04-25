from sqlalchemy.orm import Session
from app.models.data_source import DataSource


def create_data_source(db: Session, obj):
    ds = DataSource(**obj.dict())
    db.add(ds)
    db.commit()
    db.refresh(ds)
    return ds


def get_data_sources(db: Session):
    return db.query(DataSource).all()