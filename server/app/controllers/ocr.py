from fastapi import UploadFile, HTTPException
from app.utils.model import process_receipt
from PIL import Image
import pytesseract
import io

"""Process the image

Args:
    image (UploadFile): The image to process

Returns:
    dict: The processed image
"""
async def process_image(image: UploadFile):
    if not image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File provided is not an image")
    try:
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))
        text = pytesseract.image_to_string(img)
        receipt_data = process_receipt(text)
        return receipt_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during OCR processing: {str(e)}")
