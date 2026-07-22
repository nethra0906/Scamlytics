from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from ..database import get_db
from ..models import FraudIncident
from ..utils.geo_utils import simple_grid_clustering, district_risk_scoring
from ..auth import require_role, TokenData

router = APIRouter(prefix="/geo", tags=["geo"])

# Geospatial crime intelligence is restricted to law enforcement.
require_geo_access = require_role("police")

class IncidentInput(BaseModel):
    latitude: float
    longitude: float
    incident_type: str
    district: Optional[str] = "Unknown"

class IncidentBatch(BaseModel):
    incidents: List[IncidentInput]

@router.post("/ingest")
def ingest_incidents(
    payload: IncidentBatch,
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_geo_access),
):
    for inc in payload.incidents:
        db.add(FraudIncident(
            latitude=inc.latitude,
            longitude=inc.longitude,
            incident_type=inc.incident_type,
            district=inc.district,
        ))
    db.commit()
    return {"ingested": len(payload.incidents)}

@router.get("/heatmap")
def get_heatmap_points(
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_geo_access),
):
    records = db.query(FraudIncident).all()
    return [
        {"lat": r.latitude, "lng": r.longitude, "type": r.incident_type, "district": r.district}
        for r in records
    ]

@router.get("/hotspots")
def get_hotspots(
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_geo_access),
):
    records = db.query(FraudIncident).all()
    incidents = [
        {"latitude": r.latitude, "longitude": r.longitude,
         "incident_type": r.incident_type, "district": r.district}
        for r in records
    ]
    return simple_grid_clustering(incidents)

@router.get("/district-risk")
def get_district_risk(
    db: Session = Depends(get_db),
    user: TokenData = Depends(require_geo_access),
):
    records = db.query(FraudIncident).all()
    incidents = [
        {"latitude": r.latitude, "longitude": r.longitude,
         "incident_type": r.incident_type, "district": r.district}
        for r in records
    ]
    return district_risk_scoring(incidents)