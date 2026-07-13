from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from ..database import get_db
from ..models import CurrencyCheck
from ..ml.currency_model import analyze_currency
from ..utils.report_generator import generate_ncrb_report

router = APIRouter(prefix="/currency", tags=["currency"])

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "reports")

@router.post("/analyze")
async def analyze(file: UploadFile = File(...), db: Session = Depends(get_db)):
    image_bytes = await file.read()
    result = analyze_currency(image_bytes)

    if "error" in result:
        return result

    record = CurrencyCheck(
        filename=file.filename,
        verdict=result["verdict"],
        confidence=result["confidence"],
        suspicious_regions=result["suspicious_regions"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {**result, "id": record.id}

@router.get("/history")
def history(db: Session = Depends(get_db)):
    records = db.query(CurrencyCheck).order_by(CurrencyCheck.id.desc()).limit(50).all()
    return [
        {"id": r.id, "filename": r.filename, "verdict": r.verdict,
         "confidence": r.confidence, "created_at": r.created_at} for r in records
    ]

@router.post("/report/{report_id}")
def generate_currency_report(report_id: int, db: Session = Depends(get_db)):
    record = db.query(CurrencyCheck).filter(CurrencyCheck.id == report_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Report not found")
        
    evidence_data = {
        "record_id": record.id,
        "filename": record.filename,
        "verdict": record.verdict.upper(),
        "confidence_score": f"{record.confidence:.4f}",
        "suspicious_regions_detected": str(len(record.suspicious_regions)) if record.suspicious_regions else "0",
        "analysis_type": "Computer Vision Heuristics + CNN Ensemble"
    }
    
    filepath, ncrb_id = generate_ncrb_report("currency", evidence_data, STATIC_DIR)
    
    return FileResponse(filepath, media_type="application/pdf", filename=f"{ncrb_id}.pdf")