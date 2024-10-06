# from transformers import pipeline
from dotenv import load_dotenv
import os
import json
from datetime import datetime
import aiohttp
import re
import logging
import ast
import difflib

load_dotenv()

# device = os.getenv("DEVICE")
# text_generation_model_name = os.getenv("TEXT_GENERATION_MODEL_NAME")

LLM_HOST = os.getenv("LLM_HOST")
LLM_PORT = os.getenv("LLM_PORT")

# LLM Prompt Context
RECEIPT_CONTEXT = """
You are an AI assistant that processes noisy receipt data extracted by OCR. 
Analyze the following receipt data and return ONLY a JSON object containing:
- expense-type (choose ONLY one from: \"needs\" [ie. food, groceries, household essentials, etc], \"wants\" [ie. restaurants, entertainment, luxury items, etc], \"savings\" [ie. gas, bills, utilities, etc])
- date (if no valid date is found, use today's date; if a date is found, use the date from the receipt, even if partially formatted). return in YYYY-MM-DD format.
- total (extract the total amount from the receipt, choosing the last or most logical total in case multiple totals are found)
- expense-name (generate a brief name based on the contents of the receipt, focusing on the most expensive or relevant items)

Guidelines:
- Ignore any unreadable or irrelevant characters (like repeated letters, garbled text, or invalid time formats) caused by OCR errors.
- Focus on identifying dates, totals, and main items mentioned in the receipt.
- If any data is unclear due to OCR issues, use reasonable defaults (e.g., today’s date for missing dates).

Return only the JSON object, no other text or characters.

Receipt data:
"""

EXPENSE_TYPES = ["needs", "wants", "savings"]

"""Process the receipt data

Args:
    receipt_data (dict): The receipt data to process
    **kwargs: Additional keyword arguments

Returns:
    str: The processed receipt data
"""
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def parse_json_like_string(json_like_string):
    # Remove any leading/trailing whitespace and the surrounding curly braces
    json_like_string = json_like_string.strip()[1:-1]
    
    # Split the string into key-value pairs
    pairs = re.findall(r'\s*"?([^"]+)"?\s*:\s*"?([^",}]+)"?', json_like_string)
    
    # Create a dictionary from the pairs
    result = {}
    for key, value in pairs:
        key = key.strip().replace('"', '')
        value = value.strip().replace('"', '')
        result[key] = value
    
    return result

async def process_receipt(receipt_data, **kwargs):
    logger.debug(f"Received receipt_data: {receipt_data}")
    
    if isinstance(receipt_data, dict) and 'text' in receipt_data:
        receipt_text = receipt_data['text']
    else:
        receipt_text = receipt_data

    logger.debug(f"Extracted receipt_text: {receipt_text}")

    full_prompt = RECEIPT_CONTEXT + receipt_text
    logger.debug(f"Full prompt: {full_prompt}")

    max_new_tokens = 400
    temperature = 0.3
    repetition_penalty = 1.3
    top_k = 50
    top_p = 0.95

    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"http://{LLM_HOST}:{LLM_PORT}/prompt",
            json={
                "prompt": full_prompt,
                "return_full_text": False,
                "max_new_tokens": max_new_tokens,
                "temperature": temperature,
                "repetition_penalty": repetition_penalty,
                "top_k": top_k,
                "top_p": top_p,
                **kwargs
            }
        ) as res:
            response_data = await res.json()
            generated_text = response_data[0]["generated_text"]
    
    logger.debug(f"LLM Generated Text: {generated_text}")
    
    try:
        # First, try to find a JSON-like structure
        json_match = re.search(r'\{.*\}', generated_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            logger.debug(f"Extracted JSON-like string: {json_str}")
            
            # Use our custom parser
            receipt_json = parse_json_like_string(json_str)
            logger.debug(f"Parsed receipt_json: {receipt_json}")
        else:
            raise ValueError("No JSON object found in the generated text")
        
        if receipt_json.get("expense-type") not in EXPENSE_TYPES:
            closest_match = difflib.get_close_matches(receipt_json.get("expense-type", ""), EXPENSE_TYPES, n=1, cutoff=0.6)
            if closest_match:
                receipt_json["expense-type"] = closest_match[0]
            else:
                receipt_json["expense-type"] = "needs"  # Default to "needs" if no close match is found
            logger.debug(f"Corrected expense-type to: {receipt_json['expense-type']}")

        cleaned_json = {
            "expense-type": receipt_json.get("expense-type", "needs"),
            "date": receipt_json.get("date", datetime.now().strftime("%Y-%m-%d")),
            "total": receipt_json.get("total", "0.00"),
            "expense-name": receipt_json.get("expense-name", "Unknown Expense")
        }
        
        logger.debug(f"Final cleaned_json: {cleaned_json}")
        return cleaned_json
    except Exception as e:
        logger.error(f"Error parsing JSON-like string: {e}")
        logger.error(f"Problematic string: {json_str if 'json_str' in locals() else 'Not available'}")
        default_json = {
            "expense-type": "needs",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "total": "0.00",
            "expense-name": "Unknown Expense"
        }
        logger.debug(f"Returning default_json: {default_json}")
        return default_json

process_receipt_data = process_receipt