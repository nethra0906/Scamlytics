"""
currency.py — Currency analysis router.

Improvements:
  - File validation: MIME type (image/jpeg, image/png, image/webp only)
  - Size limit: 10 MB max
  - Dashboard cache invalidated after new record
  - Old PDFs cleaned up before generation
"""
import logging
import os
import time

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import CurrencyCheck
from ..ml.currency_model import analyze_currency
from ..utils.report_generator import generate_ncrb_report
from ..cache import invalidate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/currency", tags=["currency"])

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "reports")
os.makedirs(STATIC_DIR, exist_ok=True)

# ── Constants ─────────────────────────────────────────────────────────────────

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def _cleanup_old_reports(directory: str, max_age_seconds: int = 3600):
    now = time.time()
    try:
        for fname in os.listdir(directory):
            if fname.endswith(".pdf"):
                fpath = os.path.join(directory, fname)
                if os.path.isfile(fpath) and (now - os.path.getmtime(fpath)) > max_age_seconds:
                    os.remove(fpath)
                    logger.debug("Deleted stale report: %s", fname)
    except Exception as exc:
        logger.warning("Report cleanup error: %s", exc)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Analyze a currency image for counterfeit indicators.

    Accepted types: JPEG, PNG, WebP — max 10 MB.
    """
    # MIME type validation
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{file.content_type}'. Accepted: {sorted(ALLOWED_MIME_TYPES)}",
        )

    # Read and size-check
    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large ({len(image_bytes) // 1024} KB). Maximum allowed: {MAX_FILE_SIZE_BYTES // (1024*1024)} MB.",
        )

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

    # Bust dashboard cache
    invalidate("dashboard_stats")
    logger.info("Currency analysis saved: id=%d verdict=%s", record.id, record.verdict)

    return {**result, "id": record.id}


@router.get("/history")
def history(db: Session = Depends(get_db)):
    records = db.query(CurrencyCheck).order_by(CurrencyCheck.id.desc()).limit(50).all()
    return [
        {"id": r.id, "filename": r.filename, "verdict": r.verdict,
         "confidence": r.confidence, "created_at": str(r.created_at)}
        for r in records
    ]


@router.post("/report/{report_id}")
def generate_currency_report(report_id: int, db: Session = Depends(get_db)):
    record = db.query(CurrencyCheck).filter(CurrencyCheck.id == report_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Report not found")

    _cleanup_old_reports(STATIC_DIR)

    evidence_data = {
        "record_id": record.id,
        "filename": record.filename,
        "verdict": record.verdict.upper(),
        "confidence_score": f"{record.confidence:.4f}",
        "suspicious_regions_detected": str(len(record.suspicious_regions)) if record.suspicious_regions else "0",
        "analysis_type": "Computer Vision Heuristics + CNN Ensemble",
    }

    filepath, ncrb_id = generate_ncrb_report("currency", evidence_data, STATIC_DIR)
    logger.info("Generated NCRB currency report: %s", ncrb_id)

    return FileResponse(filepath, media_type="application/pdf", filename=f"{ncrb_id}.pdf")