from sqlalchemy.orm import Session
from app.models.measurement import Measurement


def save_measurements(db: Session, data):
    objects = []

    for d in data:
        obj = Measurement(
            lat=d["lat"],
            lon=d["lon"],
            turbidity=d["turbidity"],
            temperature=d["temperature"]
        )
        objects.append(obj)

    db.add_all(objects)
    db.commit()