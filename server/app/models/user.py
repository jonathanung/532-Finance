from pydantic import BaseModel, EmailStr, Field
from typing import List
from datetime import date
from bson import ObjectId

class ExpenseCreate(BaseModel):
    expenseType: str = Field(..., alias="expense-type")
    expenseDate: str  # Keep this as a string
    expenseTotal: float
    expenseName: str = Field(..., alias="expense-name")

    class Config:
        populate_by_name = True

class Expense(ExpenseCreate):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: lambda v: str(v)
        }

class Expense(BaseModel):
    expense_type: str = Field(..., alias="expense-type")
    date: date
    total: float
    expense_name: str = Field(..., alias="expense-name")

    class Config:
        populate_by_name = True

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

class User(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    expenses: List[Expense] = []

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None
