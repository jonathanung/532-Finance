from fastapi import HTTPException, Depends, status, Query
from app.models.user import UserCreate, User, Token, Expense, ExpenseCreate, ChangePasswordRequest
from app.models.auth import EmailPasswordRequestForm
from app.utils.auth import create_access_token, get_current_user
from app.db import db
from datetime import timedelta, datetime
import bcrypt
from dotenv import load_dotenv
import os
from bson import ObjectId
from app.utils.model import get_insights_data
from datetime import datetime, timedelta

one_month_ago = datetime.now() - timedelta(days=30)

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
        "expenses": [],
        "coins": 0,
        "level": 1,
        "budget": 0
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
    return current_user


"""Delete the current user

@app.delete("/delete")
async def delete_user(current_user: User = Depends(get_current_user)):
    return await user_controller.delete_user(current_user)
"""
async def delete_user(current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(
            status_code=400, 
            detail="Email wasn't registered"
            )
    await db.users.delete_one({"email": current_user.email})
    return {
        "message": "User deleted successfully"
        }

"""Update the current user
@app.update("/update")
async def update_user(current_user: User = Depends(get_current_user)):
    return await user_controller.update_user(current_user)
"""

async def update_user (updated_user: UserCreate, current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(
            status_code=404, 
            detail="User not found"
        )
    
    update_data = updated_user.dict(exclude_unset=True)
    
    if "password" in update_data:
        hashed_password = bcrypt.hashpw(
            update_data["password"].encode(os.getenv("ENCODING_TYPE", "utf-8")),
            bcrypt.gensalt()
        )
        update_data["password"] = hashed_password
    
    result = await db.users.update_one(
        {"email": current_user.email},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="User update failed")
    
    return {
        "message": "User updated successfully"
    }

"""Create an expense for the current user

Args:
    current_user (User): The current user
    expense (ExpenseCreate): The expense to create

Returns:
    dict: The created expense
"""
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
        {"$push": {"expenses": expense_dict}},
    )
    
    if result.modified_count == 1:
        await add_coin(current_user)
        return {"message": "Expense created successfully", "expense_id": expense_dict['_id']}
    else:
        raise HTTPException(status_code=400, detail="Failed to create expense")

"""Get the expenses for the current user

Args:
    current_user (User): The current user

Returns:
    list: The expenses for the current user
"""
async def get_expenses(current_user: User):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user.get("expenses", [])

"""Get an expense for the current user

Args:
    current_user (User): The current user
    expense_id (str): The ID of the expense to get

Returns:
    dict: The expense with the given ID
"""
async def get_expense(current_user: User, expense_id: str):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    expense = next((exp for exp in user.get("expenses", []) if exp['_id'] == expense_id), None)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return expense

"""Update an expense for the current user

Args:
    current_user (User): The current user
    expense_id (str): The ID of the expense to update
    updated_expense (Expense): The updated expense

"""
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

"""Delete an expense for the current user

Args:
    current_user (User): The current user
    expense_id (str): The ID of the expense to delete

Returns:  
    dict: The deleted expense
"""
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


"""Get the level for the current user

Args:
    current_user (User): The current user

Returns:
    int: The level for the current user
"""
async def get_level(current_user: User):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user.get("level", 1)

"""Update the level for the current user

Args:
    current_user (User): The current user
    level (int): The level to update

Returns:
    dict: The updated level
"""
async def update_level(current_user: User, level: int):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.users.update_one(
        {"email": current_user.email},
        {"$set": {"level": level}}
    )

    if result.modified_count == 1:
        return {"message": "Level updated successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to update level")

"""Level up the current user

Args:
    current_user (User): The current user

Returns:
    dict: The leveled up user
"""
async def level_up(current_user: User):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    level = user.get("level", 1)
    if level >= 10:
        return {"message": "User has reached the maximum level"}
    
    new_level = level + 1
    await update_level(current_user, new_level)
    return {"message": "User leveled up successfully"}

"""Get the coins for the current user

Args:
    current_user (User): The current user

Returns:
    int: The coins for the current user
"""
async def get_coins(current_user: User):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user.get("coins", 0)


"""Update the coins for the current user

Args:
    current_user (User): The current user
    coins (int): The coins to update

Returns:
    dict: The updated coins
"""
async def update_coins(current_user: User, coins: int):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.users.update_one(
        {"email": current_user.email},
        {"$set": {"coins": coins}}
    )

    if result.modified_count == 1:
        return {"message": "Coins updated successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to update coins")



"""Add 1 coin to the current user

Args:
    current_user (User): The current user

Returns:
    dict: The updated coins
"""
async def add_coin(current_user: User):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.users.update_one(
        {"email": current_user.email},
        {"$inc": {"coins": 1}}
    )

    if result.modified_count == 1:
        return {"message": "Coin added successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to add coin")

"""Get the budget for the current user

Args:
    current_user (User): The current user

Returns:
    float: The budget for the current user
"""
async def get_budget(current_user: User):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user.get("budget", 0)

"""Update the budget for the current user

Args:
    current_user (User): The current user
    budget (float): The budget to update

Returns:
    dict: The updated budget
"""
async def update_budget(current_user: User, budget: float):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if budget < 0:
        raise HTTPException(status_code=400, detail="Budget cannot be negative")
    
    try:
        result = await db.users.update_one(
            {"email": current_user.email},
            {"$set": {"budget": budget}}
        )

        if result.modified_count == 1:
            return {"message": "Budget updated successfully", "budget": budget}
        else:
            return {"message": "No changes made to budget", "budget": budget}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update budget: {str(e)}")

"""Use coins for the current user

Args:
    current_user (User): The current user
    coins (int): The coins to use

Returns:
    dict: The updated coins
"""
async def use_coins(current_user: User, coins: int = Query(..., description="Number of coins to use")):
    print(f"Attempting to use {coins} coins for user {current_user.email}")
    
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    print(f"User's current coins: {user['coins']}")
    
    if user['coins'] < coins:
        print(f"Not enough coins. User has {user['coins']}, trying to use {coins}")
        raise HTTPException(status_code=400, detail="Not enough coins")
    
    result = await db.users.update_one(
        {"email": current_user.email, "coins": {"$gte": coins}},
        {"$inc": {"coins": -coins}}
    )

    if result.modified_count == 1:
        updated_user = await db.users.find_one({"email": current_user.email})
        print(f"Updated user's coins to {updated_user['coins']}")
        return {"message": "Coins used successfully", "remaining_coins": updated_user['coins']}
    else:
        raise HTTPException(status_code=400, detail="Failed to use coins")


"""Set the default values for the current user

Args:
    current_user (User): The current user

Returns:
    dict: The updated user
"""
async def set_user_default(current_user: User):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await db.users.update_one(
        {"email": current_user.email},
        {"$set": {"level": 1, "coins": 0, "budget": 0}}
    )

    if result.modified_count == 1:
        return {"message": "User default values set successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to set user default values")    
    
"""Get the insights for the current user

Args:
    current_user (User): The current user

Returns:
    dict: The insights for the current user
"""
async def get_insights(current_user: User):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    data = {
        "expenses": list(filter(lambda expense: datetime.fromisoformat(expense['expenseDate']) >= one_month_ago, user.get("expenses", []))),
        "budget": user.get("budget", 0),
    }

    insights = await get_insights_data(data)

    return insights

"""Change the password for the current user

Args:
    current_user (User): The current user
    current_password (str): The current password
    new_password (str): The new password

Returns:
    dict: The updated user
"""
async def change_password(current_user: User, current_password: str, new_password: str):
    user = await db.users.find_one({"email": current_user.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not bcrypt.checkpw(current_password.encode('utf-8'), user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
    
    result = await db.users.update_one(
        {"email": current_user.email},
        {"$set": {"hashed_password": hashed_password}}
    )
    
    if result.modified_count == 1:
        return {"message": "Password changed successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to change password")