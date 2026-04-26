from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    name: str
    password: str = Field(min_length=6, max_length=72)


class UserLogin(UserBase):
    password: str


class UserOut(UserBase):
    name: str
    id: int

    class Config:
        from_attributes = True