from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import os
from ..database import get_db
from ..models import Transaction
from ..ml.graph_engine import get_graph_repo

router = APIRouter(prefix="/graph", tags=["graph"])

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")
os.makedirs(STATIC_DIR, exist_ok=True)

class TxInput(BaseModel):
    phone_number: str
    device_id: str
    account_id: str
    amount: float

class TxBatch(BaseModel):
    transactions: List[TxInput]

class GraphQuery(BaseModel):
    query: str

@router.post("/ingest")
def ingest_transactions(payload: TxBatch, db: Session = Depends(get_db)):
    for tx in payload.transactions:
        db.add(Transaction(
            phone_number=tx.phone_number,
            device_id=tx.device_id,
            account_id=tx.account_id,
            amount=tx.amount,
        ))
    db.commit()
    return {"ingested": len(payload.transactions)}

@router.get("/analyze")
def analyze_graph(db: Session = Depends(get_db)):
    records = db.query(Transaction).all()
    if not records:
        return {"clusters": [], "message": "No transactions ingested yet"}

    tx_list = [
        {"phone_number": r.phone_number, "device_id": r.device_id,
         "account_id": r.account_id, "amount": r.amount}
        for r in records
    ]

    repo = get_graph_repo()
    G, clusters = repo.build_fraud_graph(tx_list)
    html_path = os.path.join(STATIC_DIR, "fraud_graph.html")
    repo.graph_to_html(html_path)

    return {
        "total_nodes": G.number_of_nodes(),
        "total_edges": G.number_of_edges(),
        "clusters": clusters,
        "graph_url": "/graph/view"
    }

@router.get("/view")
def view_graph():
    html_path = os.path.join(STATIC_DIR, "fraud_graph.html")
    if not os.path.exists(html_path):
        return {"error": "Graph not generated yet. Call /graph/analyze first."}
    return FileResponse(html_path, media_type="text/html")

@router.post("/query")
def query_graph(payload: GraphQuery):
    repo = get_graph_repo()
    return repo.query(payload.query)