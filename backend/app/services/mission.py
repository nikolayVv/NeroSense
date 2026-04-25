from sqlalchemy.orm import Session
from app.models.mission import Mission
from app.models.data_source import DataSource
from app.models.indicator import Indicator
from app.models.hardware import Hardware


def create_mission(db: Session, obj):
    mission = Mission(
        name=obj.name,
        water_source_name=obj.water_source_name,
        water_source_bbox=obj.water_source_bbox,
        date_from=obj.date_from,
        date_to=obj.date_to,
        notes=obj.notes,
        insights=obj.insights,
        strategy=obj.strategy,
    )

    mission.data_sources = db.query(DataSource).filter(
        DataSource.id.in_(obj.data_source_ids)
    ).all()

    mission.indicators = db.query(Indicator).filter(
        Indicator.id.in_(obj.indicator_ids)
    ).all()

    if obj.hardware_ids:
        mission.hardwares = db.query(Hardware).filter(
            Hardware.id.in_(obj.hardware_ids)
        ).all()

    db.add(mission)
    db.commit()
    db.refresh(mission)

    return mission