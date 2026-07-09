from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import CurrencyCheck
from ..ml.currency_model import analyze_currency

router = APIRouter(prefix="/currency", tags=["currency"])

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