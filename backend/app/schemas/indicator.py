from pydantic import BaseModel


class IndicatorBase(BaseModel):
    name: str
    description: str | None = None
    unit: str | None = None


class IndicatorCreate(IndicatorBase):
    pass


class IndicatorOut(IndicatorBase):
    id: int

    class Config:
        from_attributes = True