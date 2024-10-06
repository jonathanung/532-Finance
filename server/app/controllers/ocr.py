import aiohttp
from fastapi import HTTPException
import os
from dotenv import load_dotenv
from app.utils.model import process_receipt_data

load_dotenv()

OCR_API_KEY = os.getenv("OCR_API_KEY")
OCR_API_URL = "https://api.ocr.space/parse/image"

async def process_ocr(file):
    try:
        async with aiohttp.ClientSession() as session:
            data = aiohttp.FormData()
            data.add_field('apikey', OCR_API_KEY)
            data.add_field('language', 'eng')
            data.add_field('isOverlayRequired', 'false')
            data.add_field('file', await file.read(), filename=file.filename, content_type=file.content_type)

            async with session.post(OCR_API_URL, data=data) as response:
                result = await response.json()

                if result.get("OCRExitCode") == 1:
                    extracted_text = result["ParsedResults"][0]["ParsedText"]
                    receipt_data = await process_receipt_data(extracted_text)
                    return receipt_data
                else:
                    raise HTTPException(status_code=500, detail=f"OCR API Error: {result.get('ErrorMessage', 'Unknown error')}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
