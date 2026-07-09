from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from ..ml.chat_service import chat_with_assistant

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatInput(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

@router.post("/message")
def send_message(payload: ChatInput):
    history = [{"role": h.role, "content": h.content} for h in payload.history]
    reply = chat_with_assistant(payload.message, history)
    return {"reply": reply}