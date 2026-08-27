"""
Auth utilities for CinePilot.
JWT creation/verification, password hashing, current user dependency.
"""

import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Cookie, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from database import get_user_by_id

import bcrypt

SECRET_KEY = os.environ.get("SECRET_KEY", "change-this-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7
COOKIE_NAME = "cinepilot_token"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_user(cinepilot_token: str = Cookie(default=None)):
    if not cinepilot_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = jwt.decode(cinepilot_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user
