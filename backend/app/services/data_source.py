from sqlalchemy.orm import Session
from app.models.data_source import DataSource


def get_data_source(db: Session, id: int):
    return db.query(DataSource).filter(DataSource.id == id).first()


def get_data_sources(db: Session):
    return db.query(DataSource).all()


def create_data_source(db: Session, obj):
    ds = DataSource(**obj.dict())
    db.add(ds)
    db.commit()
    db.refresh(ds)
    return ds


def delete_data_source(db: Session, id: int):
    ds = get_data_source(db, id)
    if ds:
        db.delete(ds)
        db.commit()
    return ds