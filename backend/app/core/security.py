import hashlib
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    sha = hashlib.sha256(password_bytes).hexdigest()

    print("ORIGINAL LENGTH:", len(password))
    print("SHA LENGTH:", len(sha))

    return pwd_context.hash(sha)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")
    sha = hashlib.sha256(password_bytes).hexdigest()
    return pwd_context.verify(sha, hashed_password)