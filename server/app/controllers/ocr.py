from ..utils.model import process_receipt_data
from fastapi import HTTPException
import pytesseract
from PIL import Image
import io

"""Process the image

Args:
    image (UploadFile): The image to process

Returns:
    dict: The processed image
"""
async def process_ocr(file):
    try:
        image = Image.open(io.BytesIO(await file.read()))
        extracted_text = pytesseract.image_to_string(image)
        receipt_data = await process_receipt_data(extracted_text)
        return receipt_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
