from fastapi import FastAPI, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware as CORS
import os
from dotenv import load_dotenv

from app.models.auth import EmailPasswordRequestForm
from app.controllers import user as user_controller
from app.controllers import ocr as ocr_controller
from app.models.user import UserCreate, Token, User
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

@app.update("/update")
async def update_user(current_user: User = Depends(get_current_user)):
    return await user_controller.update_user(current_user)
# OCR ROUTE
@app.post("/ocr")
async def ocr_endpoint(image: UploadFile = File(...)):
    return await ocr_controller.process_image(image)
