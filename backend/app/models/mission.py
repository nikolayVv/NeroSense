from sqlalchemy import Table, Column, Integer, ForeignKey, String, Text, DateTime
from sqlalchemy.orm import relationship

from app.core.database import Base

mission_data_sources = Table(
    "mission_data_sources",
    Base.metadata,
    Column("mission_id", Integer, ForeignKey("missions.id")),
    Column("data_source_id", Integer, ForeignKey("data_sources.id")),
)

mission_indicators = Table(
    "mission_indicators",
    Base.metadata,
    Column("mission_id", Integer, ForeignKey("missions.id")),
    Column("indicator_id", Integer, ForeignKey("indicators.id")),
)

mission_hardwares = Table(
    "mission_hardwares",
    Base.metadata,
    Column("mission_id", Integer, ForeignKey("missions.id")),
    Column("hardware_id", Integer, ForeignKey("hardwares.id")),
)

class Mission(Base):
    __tablename__ = "missions"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    water_source_name = Column(String)
    water_source_bbox = Column(String)  # store as JSON string for now

    date_from = Column(DateTime)
    date_to = Column(DateTime)

    notes = Column(Text)
    insights = Column(Text)
    strategy = Column(Text)

    data_sources = relationship(
        "DataSource", secondary=mission_data_sources
    )

    indicators = relationship(
        "Indicator", secondary=mission_indicators
    )

    hardwares = relationship(
        "Hardware", secondary=mission_hardwares
    )