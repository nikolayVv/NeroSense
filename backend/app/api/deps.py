from fastapi import Depends, HTTPException
from app.core.database import SessionLocal
from jose import jwt, JWTError

from app.core.jwt import SECRET_KEY, ALGORITHM
from app.services.user import get_user_by_email


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



def get_current_user(token: str, db):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = get_user_by_email(db, email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user