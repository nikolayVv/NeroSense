from pydantic import BaseModel


class DataSourceBase(BaseModel):
    name: str
    provider: str
    description: str | None = None


class DataSourceCreate(DataSourceBase):
    pass


class DataSourceOut(DataSourceBase):
    id: int

    class Config:
        from_attributes = True