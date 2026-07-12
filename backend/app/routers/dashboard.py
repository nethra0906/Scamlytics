from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ScamReport, CurrencyCheck, Transaction, FraudIncident

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_scam_checks = db.query(ScamReport).count()
    high_risk_scams = db.query(ScamReport).filter(ScamReport.risk_level == "HIGH").count()

    total_currency_checks = db.query(CurrencyCheck).count()
    counterfeit_flagged = db.query(CurrencyCheck).filter(CurrencyCheck.verdict == "counterfeit").count()

    total_transactions = db.query(Transaction).count()
    total_incidents = db.query(FraudIncident).count()

    recent_scams = db.query(ScamReport).order_by(ScamReport.id.desc()).limit(5).all()
    recent_currency = db.query(CurrencyCheck).order_by(CurrencyCheck.id.desc()).limit(5).all()

    return {
        "scam_module": {
            "total_checks": total_scam_checks,
            "high_risk_count": high_risk_scams,
        },
        "currency_module": {
            "total_checks": total_currency_checks,
            "counterfeit_count": counterfeit_flagged,
        },
        "graph_module": {
            "total_transactions_ingested": total_transactions,
        },
        "geo_module": {
            "total_incidents": total_incidents,
        },
        "recent_activity": {
            "scams": [
                {"id": r.id, "channel": r.channel, "risk_level": r.risk_level, "created_at": r.created_at}
                for r in recent_scams
            ],
            "currency": [
                {"id": r.id, "verdict": r.verdict, "confidence": r.confidence, "created_at": r.created_at}
                for r in recent_currency
            ],
        },
    }