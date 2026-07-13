from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
from ..database import get_db
from ..models import ScamReport
from ..ml.scam_classifier import classify_scam
from ..utils.report_generator import generate_ncrb_report

router = APIRouter(prefix="/scam", tags=["scam"])

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "reports")

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

@router.post("/report/{report_id}")
def generate_scam_report(report_id: int, db: Session = Depends(get_db)):
    record = db.query(ScamReport).filter(ScamReport.id == report_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Report not found")
        
    evidence_data = {
        "record_id": record.id,
        "channel": record.channel,
        "input_text": record.input_text[:100] + "..." if len(record.input_text) > 100 else record.input_text,
        "risk_level": record.risk_level,
        "scam_probability": f"{record.scam_probability:.4f}",
        "explanation": record.explanation
    }
    
    filepath, ncrb_id = generate_ncrb_report("scam", evidence_data, STATIC_DIR)
    
    return FileResponse(filepath, media_type="application/pdf", filename=f"{ncrb_id}.pdf")