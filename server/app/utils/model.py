from transformers import pipeline
from dotenv import load_dotenv
import os
import json
from datetime import datetime

load_dotenv()

device = os.getenv("DEVICE")
text_generation_model_name = os.getenv("TEXT_GENERATION_MODEL_NAME")

# LLM Prompt Context
RECEIPT_CONTEXT = """You are an AI assistant that processes receipt data extracted by OCR. 
Analyze the following receipt data and return ONLY a JSON object containing:
- expense-type (choose from: "needs", "wants", "savings")
- date (if no date found, use today's date)
- total (extract the total amount from the receipt. there may be multiple totals with different names, choose the one that makes the most sense which is most likely the last total on the receipt)
- expense-name (generate a brief name based on the receipt contents)

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
def process_receipt(receipt_data, **kwargs):
    if isinstance(receipt_data, dict) and 'text' in receipt_data:
        receipt_text = receipt_data['text']
    else:
        receipt_text = receipt_data

    full_prompt = RECEIPT_CONTEXT + receipt_text

    max_new_tokens = 200
    temperature = 0.7
    repetition_penalty = 1.0

    response = pipe(full_prompt,
                    return_full_text=False, 
                    max_new_tokens=max_new_tokens,
                    temperature=temperature,
                    repetition_penalty=repetition_penalty,
                    **kwargs
                    )[0]['generated_text']
    
    try:
        receipt_json = json.loads(response)
        
        if receipt_json.get("total") == "0.00":
            total_line = [line for line in receipt_text.split('\n') if 'Total' in line]
            if total_line:
                total = total_line[-1].split()[-1].replace(',', '.')
                receipt_json["total"] = total

        if receipt_json.get("expense-name") == "Unknown Expense":
            items = [line.strip() for line in receipt_text.split('\n') if line.strip() and not any(word in line.lower() for word in ['total', 'tax', 'change', 'saved', 'credit', 'payment'])]
            if items:
                receipt_json["expense-name"] = f"Grocery shopping at {items[0]}"

        cleaned_json = {
            "expense-type": receipt_json.get("expense-type", "needs") if receipt_json.get("expense-type") in EXPENSE_TYPES else "needs",
            "date": receipt_json.get("date", datetime.now().strftime("%Y-%m-%d")),
            "total": receipt_json.get("total", "0.00"),
            "expense-name": receipt_json.get("expense-name", "Unknown Expense")
        }
        
        return json.dumps(cleaned_json, indent=2)
    except json.JSONDecodeError:
        total_line = [line for line in receipt_text.split('\n') if 'Total' in line]
        total = total_line[-1].split()[-1].replace(',', '.') if total_line else "0.00"
        items = [line.strip() for line in receipt_text.split('\n') if line.strip() and not any(word in line.lower() for word in ['total', 'tax', 'change', 'saved', 'credit', 'payment'])]
        expense_name = f"Grocery shopping at {items[0]}" if items else "Unknown Expense"
        
        default_json = {
            "expense-type": "needs",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "total": total,
            "expense-name": expense_name
        }
        return json.dumps(default_json, indent=2)


pipe = pipeline(
    "text-generation",
    model=text_generation_model_name,
    device=device
)

process_receipt_data = process_receipt