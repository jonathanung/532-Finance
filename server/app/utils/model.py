from transformers import pipeline
from dotenv import load_dotenv
import os

load_dotenv()

device = os.getenv("DEVICE")

text_generation_model_name = os.getenv("TEXT_GENERATION_MODEL_NAME")
pipe = pipeline(
    "text-generation",
    model=text_generation_model_name, 
    device=device
    )