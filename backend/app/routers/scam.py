"""
scam.py — Scam analysis router.

Improvements:
  - classify_scam() runs in thread pool via run_in_executor (non-blocking)
  - Dashboard cache invalidated after each new record
  - PDF report cleanup: auto-delete reports older than 1 hour on generation
"""
import asyncio
import logging
import os
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import ScamReport
from ..ml.scam_classifier import classify_scam
from ..utils.report_generator import generate_ncrb_report, cleanup_old_reports
from ..cache import invalidate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/scam", tags=["scam"])

# /tmp is the only writable directory on serverless platforms (Vercel, AWS Lambda)
STATIC_DIR = os.path.join("/tmp", "scamlytics", "reports")

# Thread pool for CPU-bound ML inference
_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="scam-ml")


class ScamInput(BaseModel):
    text: str
    channel: str = "unknown"   # call / whatsapp / sms / email


@router.post("/analyze")
async def analyze_scam(payload: ScamInput, db: Session = Depends(get_db)):
    """
    Analyze text/transcript for scam indicators.
    ML inference runs in a thread pool to avoid blocking the async event loop.
    """
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        _executor,
        classify_scam,
        payload.text,
        payload.channel,
    )

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

    # Bust the dashboard stats cache so next load shows fresh counts
    invalidate("dashboard_stats")
    logger.info("Scam analysis saved: id=%d risk=%s prob=%.3f", record.id, record.risk_level, record.scam_probability)

    return {**result, "id": record.id}


@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    records = db.query(ScamReport).order_by(ScamReport.id.desc()).limit(50).all()
    return [
        {
            "id": r.id, "channel": r.channel, "risk_level": r.risk_level,
            "scam_probability": r.scam_probability, "created_at": str(r.created_at)
        }
        for r in records
    ]


@router.post("/report/{report_id}")
def generate_scam_report(report_id: int, db: Session = Depends(get_db)):
    record = db.query(ScamReport).filter(ScamReport.id == report_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Report not found")

    # Ensure the tmp reports directory exists (deferred from module level for serverless compat)
    os.makedirs(STATIC_DIR, exist_ok=True)
    # Clean up old PDFs before generating a new one
    cleanup_old_reports(STATIC_DIR)

    evidence_data = {
        "record_id": record.id,
        "channel": record.channel,
        "input_text": record.input_text[:100] + "..." if len(record.input_text) > 100 else record.input_text,
        "risk_level": record.risk_level,
        "scam_probability": f"{record.scam_probability:.4f}",
        "explanation": record.explanation,
    }

    filepath, ncrb_id = generate_ncrb_report("scam", evidence_data, STATIC_DIR)
    logger.info("Generated NCRB report: %s", ncrb_id)

    return FileResponse(filepath, media_type="application/pdf", filename=f"{ncrb_id}.pdf")