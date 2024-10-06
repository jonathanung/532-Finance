from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.models.user import User, TokenData, Expense
from app.db import db
from datetime import datetime, timedelta
import jwt as pyjwt
import os
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

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
    try:
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
        except pyjwt.PyJWTError as e:
            logger.error(f"JWT decode error: {str(e)}")
            raise credentials_exception

        user = await db.users.find_one({"email": token_data.email})
        if user is None:
            logger.error(f"User not found for email: {token_data.email}")
            raise credentials_exception
        
        # Convert the expenses to the correct format
        expenses = []
        for expense in user.get("expenses", []):
            try:
                expense_date = datetime.fromisoformat(expense.get('expenseDate')).date()
                expense_amount = float(expense.get('expenseAmount', 0))
                expenses.append(Expense(
                    expense_type=expense.get('expense-type', ''),
                    date=expense_date,
                    total=expense_amount,
                    expense_name=expense.get('expenseName', '')
                ))
            except Exception as e:
                logger.warning(f"Error processing expense: {str(e)}")
                logger.warning(f"Problematic expense data: {expense}")
                continue
        
        logger.info(f"Processed {len(expenses)} valid expenses for user {email}")
        
        return User(
            first_name=user.get("first_name", ""),
            last_name=user.get("last_name", ""),
            email=user["email"],
            expenses=expenses,
            level=user.get("level", 1),
            coins=user.get("coins", 0),
            budget=user.get("budget", 0.0)
        )
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")