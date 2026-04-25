from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base


class Hardware(Base):
    __tablename__ = "hardwares"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String)
    status = Column(String)
    notes = Column(Text)