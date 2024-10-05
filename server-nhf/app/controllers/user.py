from fastapi import HTTPException, Depends, status
from app.models.user import UserCreate, User, Token
from app.models.auth import EmailPasswordRequestForm
from app.utils.auth import create_access_token, get_current_user
from app.db import db
from datetime import timedelta
import bcrypt
# from app.utils.model import pipe
from dotenv import load_dotenv
import os

load_dotenv()

# CONSANT: Signifies the time in minutes after which the access token expires
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

"""Register a new user

Args:
    user (UserCreate): The user to register

Returns:
    dict: The registered user
"""
async def register(user: UserCreate):
    existing_user = await db.users.find_one({
        "email": user.email
        })
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail="Email already registered"
            )
    
    hashed_password = bcrypt.hashpw(
        user.password.encode(os.getenv("ENCODING_TYPE")),
        bcrypt.gensalt()
        )

    new_user = {
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email, 
        "hashed_password": hashed_password,
        }
    result = await db.users.insert_one(new_user)

    user = await db.users.find_one({
        "email": user.email
        })
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {
        "message": "User registered successfully",
        "access_token": access_token,
        "token_type": "bearer"
        }

"""Login a user

Args:
    form_data (OAuth2PasswordRequestForm): The form data to login a user

Returns:
    dict: The login user
"""
async def login(form_data: EmailPasswordRequestForm):
    user = await db.users.find_one({"email": form_data.email})
    if not user or not bcrypt.checkpw(form_data.password.encode('utf-8'), user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

"""Get the current user

Args:
    current_user (User): The current user

Returns:
    dict: The current user
"""
async def get_user(current_user: User = Depends(get_current_user)):
    return {
        "email": current_user.email
        }
