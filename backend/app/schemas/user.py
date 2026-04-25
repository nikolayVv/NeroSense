from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=72)


class UserLogin(UserBase):
    password: str


class UserOut(UserBase):
    id: int

    class Config:
        from_attributes = True