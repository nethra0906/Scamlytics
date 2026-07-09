import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are Citizen Fraud Shield, an AI assistant for Indian citizens on digital fraud, \
digital arrest scams, counterfeit currency, and cybercrime reporting.

Rules:
- Never ask for OTP, PIN, passwords, or bank details.
- If user describes a scam in progress, tell them: disconnect immediately, do not pay, report at cybercrime.gov.in or call 1930 (National Cyber Crime Helpline).
- Explain concepts simply, in the language the user writes in (support Hindi, Tamil, Telugu, Bengali, Marathi, and other Indian languages if user writes in them).
- Be calm, reassuring, and factual. Never cause panic.
- Keep answers concise (under 150 words) unless user asks for detail.
"""

def chat_with_assistant(message: str, history: list = None):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        for h in history[-6:]:  # last 6 turns for context
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.4,
            max_tokens=400,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Assistant temporarily unavailable ({str(e)}). For urgent scam help, call 1930 or visit cybercrime.gov.in."