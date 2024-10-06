from fastapi import FastAPI, Depends, UploadFile, File, Path, HTTPException
from fastapi.middleware.cors import CORSMiddleware as CORS
import os
from dotenv import load_dotenv

from app.models.auth import EmailPasswordRequestForm
from app.controllers import user as user_controller
from app.controllers import ocr as ocr_controller
from app.models.user import UserCreate, Token, User, ExpenseCreate, Expense, ChangePasswordRequest, BudgetUpdate
from app.utils.auth import get_current_user

load_dotenv()

app = FastAPI()

# CORS
origins = os.getenv("CORS_ORIGINS", "").split(",")
app.add_middleware(
    CORS,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# USER ROUTES

@app.post("/register", status_code=201)
async def register(user: UserCreate):
    return await user_controller.register(user)

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: EmailPasswordRequestForm = Depends()):
    return await user_controller.login(form_data)

@app.get("/user")
async def get_user(current_user: User = Depends(get_current_user)):
    return await user_controller.get_user(current_user)

@app.delete("/delete")
async def delete_user(current_user: User = Depends(get_current_user)):
    return await user_controller.delete_user(current_user)

@app.put("/update")
async def update_user(updated_user: UserCreate, current_user: User = Depends(get_current_user)):
    return await user_controller.update_user(updated_user, current_user)

@app.put("/change_password")
async def change_password(request: ChangePasswordRequest, current_user: User = Depends(get_current_user)):
    return await user_controller.change_password(current_user, request.current_password, request.new_password)

# OCR ROUTE

@app.post("/ocr")
async def ocr_endpoint(image: UploadFile = File(...)):
    return await ocr_controller.process_ocr(image)

# Insights Route

@app.get("/insights")
async def get_insights(current_user: User = Depends(get_current_user)):
    return await user_controller.get_insights(current_user)

# EXPENSE ROUTES

@app.post("/expenses")
async def create_expense(expense: ExpenseCreate, current_user: User = Depends(get_current_user)):
    return await user_controller.create_expense(current_user, expense)

@app.get("/expenses")
async def get_expenses(current_user: User = Depends(get_current_user)):
    return await user_controller.get_expenses(current_user)

@app.get("/expenses/{expense_id}")
async def get_expense(expense_id: str = Path(...), current_user: User = Depends(get_current_user)):
    return await user_controller.get_expense(current_user, expense_id)

@app.put("/expenses/{expense_id}")
async def update_expense(expense: ExpenseCreate, expense_id: str = Path(...), current_user: User = Depends(get_current_user)):
    return await user_controller.update_expense(current_user, expense_id, expense)

@app.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str = Path(...), current_user: User = Depends(get_current_user)):
    return await user_controller.delete_expense(current_user, expense_id)

# LEVEL ROUTES

@app.get("/level")
async def get_level(current_user: User = Depends(get_current_user)):
    return await user_controller.get_level(current_user)

@app.put("/level")
async def update_level(level: int, current_user: User = Depends(get_current_user)):
    return await user_controller.update_level(current_user, level)

@app.get("/level_up")
async def level_up(current_user: User = Depends(get_current_user)):
    return await user_controller.level_up(current_user)

# BUDGET ROUTES

@app.get("/budget")
async def get_budget(current_user: User = Depends(get_current_user)):
    return await user_controller.get_budget(current_user)

@app.put("/budget")
async def update_budget(budget_update: BudgetUpdate, current_user: User = Depends(get_current_user)):
    return await user_controller.update_budget(current_user, budget_update.budget)

# COINS ROUTES

@app.get("/coins")
async def get_coins(current_user: User = Depends(get_current_user)):
    return await user_controller.get_coins(current_user)

@app.put("/coins")
async def update_coins(coins: int, current_user: User = Depends(get_current_user)):
    return await user_controller.update_coins(current_user, coins)

@app.get("/add_coin")
async def add_coin(current_user: User = Depends(get_current_user)):
    return await user_controller.add_coin(current_user)

@app.post("/use_coins")
async def use_coins(coins: int, current_user: User = Depends(get_current_user)):
    return await user_controller.use_coins(current_user, coins)

@app.get("/set_user_default")
async def set_user_default(current_user: User = Depends(get_current_user)):
    return await user_controller.set_user_default(current_user)