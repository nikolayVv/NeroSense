from pydantic import BaseModel
from datetime import datetime
from typing import List


class MissionBase(BaseModel):
    name: str
    water_source_name: str | None = None
    water_source_bbox: str | None = None

    date_from: datetime | None = None
    date_to: datetime | None = None

    notes: str | None = None
    insights: str | None = None
    strategy: str | None = None


class MissionCreate(MissionBase):
    data_source_ids: List[int]
    indicator_ids: List[int]
    hardware_ids: List[int] = []


class MissionOut(MissionBase):
    id: int

    class Config:
        from_attributes = True