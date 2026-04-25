from pydantic import BaseModel


class HardwareBase(BaseModel):
    name: str
    type: str | None = None
    status: str | None = None
    notes: str | None = None


class HardwareCreate(HardwareBase):
    pass


class HardwareOut(HardwareBase):
    id: int

    class Config:
        from_attributes = True