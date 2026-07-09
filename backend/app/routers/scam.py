from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import ScamReport
from ..ml.scam_classifier import classify_scam

router = APIRouter(prefix="/scam", tags=["scam"])

class ScamInput(BaseModel):
    text: str
    channel: str = "unknown"   # call/whatsapp/sms/email

@router.post("/analyze")
def analyze_scam(payload: ScamInput, db: Session = Depends(get_db)):
    result = classify_scam(payload.text, payload.channel)

    record = ScamReport(
        input_text=payload.text,
        channel=payload.channel,
        scam_probability=result["scam_probability"],
        risk_level=result["risk_level"],
        explanation=result["explanation"],
        recommended_action=result["recommended_action"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {**result, "id": record.id}

@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    records = db.query(ScamReport).order_by(ScamReport.id.desc()).limit(50).all()
    return [
        {
            "id": r.id, "channel": r.channel, "risk_level": r.risk_level,
            "scam_probability": r.scam_probability, "created_at": r.created_at
        } for r in records
    ]