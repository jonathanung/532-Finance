from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.models.user import User, TokenData
from app.db import db
from datetime import datetime, timedelta
import jwt as pyjwt
import os

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

"""Create a JWT access token for a given user

Args:
    data (dict): The data to encode in the token
    expires_delta (timedelta, optional): The expiration time of the token. Defaults to None.

Returns:
    str: The JWT access token
"""
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = pyjwt.encode(to_encode, str(SECRET_KEY), algorithm=ALGORITHM)
    return encoded_jwt

"""Get the current user from the JWT access token

Args:
    token (str): The JWT access token

Returns:
    User: The current user
"""
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = pyjwt.decode(token, str(SECRET_KEY), algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except pyjwt.PyJWTError:
        raise credentials_exception
    user = await db.users.find_one({"email": token_data.email})
    if user is None:
        raise credentials_exception
    return User(
        first_name=user["first_name"],
        last_name=user["last_name"],
        email=user["email"]
    )
