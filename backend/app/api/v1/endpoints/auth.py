from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.user import UserCreate, UserLogin, UserOut
from app.services.user import get_user_by_email, create_user
from app.core.security import verify_password
from app.core.jwt import create_access_token
from app.api.deps import get_db

router = APIRouter()

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = get_user_by_email(db, user.email)

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = create_user(db, user.email, user.name, user.password)
    return new_user


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, user.email)

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": db_user.email})

    return {"access_token": token, "token_type": "bearer"}