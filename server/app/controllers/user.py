from fastapi import HTTPException, Depends, status
from app.models.user import UserCreate, User, Token, Expense, ExpenseCreate
from app.models.auth import EmailPasswordRequestForm
from app.utils.auth import create_access_token, get_current_user
from app.db import db
from datetime import timedelta, datetime
import bcrypt
from dotenv import load_dotenv
import os
from bson import ObjectId

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
        "expenses": []
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

async def create_expense(current_user: User, expense: ExpenseCreate):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    expense_dict = expense.dict(by_alias=True)
    expense_dict['_id'] = str(ObjectId())
    
    # Ensure the expenseDate is stored as a string in ISO format
    expense_dict['expenseDate'] = expense_dict['expenseDate']
    
    result = await db.users.update_one(
        {"email": current_user.email},
        {"$push": {"expenses": expense_dict}}
    )
    
    if result.modified_count == 1:
        return {"message": "Expense created successfully", "expense_id": expense_dict['_id']}
    else:
        raise HTTPException(status_code=400, detail="Failed to create expense")

async def get_expenses(current_user: User):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user.get("expenses", [])

async def get_expense(current_user: User, expense_id: str):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    expense = next((exp for exp in user.get("expenses", []) if exp['_id'] == expense_id), None)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return expense

async def update_expense(current_user: User, expense_id: str, updated_expense: Expense):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.users.update_one(
        {"email": current_user.email, "expenses._id": expense_id},
        {"$set": {
            "expenses.$.expense_type": updated_expense.expense_type,
            "expenses.$.date": updated_expense.date,
            "expenses.$.total": updated_expense.total,
            "expenses.$.expense_name": updated_expense.expense_name
        }}
    )
    
    if result.modified_count == 1:
        return {"message": "Expense updated successfully"}
    else:
        raise HTTPException(status_code=404, detail="Expense not found or not updated")

async def delete_expense(current_user: User, expense_id: str):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.users.update_one(
        {"email": current_user.email},
        {"$pull": {"expenses": {"_id": expense_id}}}
    )
    
    if result.modified_count == 1:
        return {"message": "Expense deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Expense not found or not deleted")
