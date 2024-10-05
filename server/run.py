import uvicorn
import sys
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir))

host = os.getenv("HOST")
port = int(os.getenv("PORT"))

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
