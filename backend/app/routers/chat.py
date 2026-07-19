"""
chat.py — Citizen assistant chat endpoint.

Improvements:
  - Per-IP sliding window rate limiter (10 req / 60 s)
    Prevents exhausting Groq API credits from a single client.
"""
import logging
import time
import threading
from collections import deque
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel

from ..ml.chat_service import chat_with_assistant

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])

# ── Rate limiter ─────────────────────────────────────────────────────────────

RATE_LIMIT_REQUESTS = int(10)   # max requests
RATE_LIMIT_WINDOW   = int(60)   # per N seconds

_rate_store: dict[str, deque] = {}
_rate_lock  = threading.Lock()


def _is_rate_limited(ip: str) -> bool:
    now = time.time()
    with _rate_lock:
        if ip not in _rate_store:
            _rate_store[ip] = deque()
        window = _rate_store[ip]
        # Remove timestamps outside the window
        while window and window[0] < now - RATE_LIMIT_WINDOW:
            window.popleft()
        if len(window) >= RATE_LIMIT_REQUESTS:
            return True
        window.append(now)
        return False


# ── Schema ────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatInput(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/message")
def send_message(payload: ChatInput, request: Request):
    """
    Send a message to the AI citizen assistant.

    Rate-limited to {RATE_LIMIT_REQUESTS} requests per {RATE_LIMIT_WINDOW}s per IP.
    """
    client_ip = request.client.host if request.client else "unknown"
    if _is_rate_limited(client_ip):
        logger.warning("Rate limit hit for IP: %s", client_ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: max {RATE_LIMIT_REQUESTS} requests per {RATE_LIMIT_WINDOW} seconds.",
            headers={"Retry-After": str(RATE_LIMIT_WINDOW)},
        )

    history = [{"role": h.role, "content": h.content} for h in payload.history]
    reply = chat_with_assistant(payload.message, history)
    return {"reply": reply}