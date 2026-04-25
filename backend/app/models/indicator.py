from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base


class Indicator(Base):
    __tablename__ = "indicators"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    unit = Column(String)