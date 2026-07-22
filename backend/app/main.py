"""
main.py — FastAPI application entry point.

  - Structured logging (console + file)
  - RequestIDMiddleware for request traceability
  - CORS tightened to specific methods/headers
  - JWT /auth/login + /auth/me endpoints
  - Lifespan: auto-rebuild fraud graph from DB on startup
"""
import logging
import os
from contextlib import asynccontextmanager
from logging.handlers import RotatingFileHandler

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, get_db
from . import database as _database
from .middleware import RequestIDMiddleware
from .routers import scam, currency, graph, geo, chat, dashboard, audio
from .auth import LoginRequest, authenticate_user, create_access_token, TokenData, get_current_user

# ── Logging ───────────────────────────────────────────────────────────────────

LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s - %(message)s"
logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    handlers=[
        logging.StreamHandler(),
        # Rotating file handler so the log can't grow unbounded on disk
        # (5 MB per file, keep 3 backups).
        RotatingFileHandler(
            "scamlytics.log",
            maxBytes=5 * 1024 * 1024,
            backupCount=3,
            encoding="utf-8",
        ),
    ],
)
logger = logging.getLogger("scamlytics")

# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables + auto-rebuild fraud graph from persisted transactions on startup."""
    logger.info("Scamlytics starting up…")
    # Create all DB tables using the current engine (patched in tests)
    Base.metadata.create_all(bind=_database.engine)
    db = _database.SessionLocal()
    try:
        from .models import Transaction
        from .ml.graph_engine import get_graph_repo
        records = db.query(Transaction).all()
        if records:
            tx_list = [
                {"phone_number": r.phone_number, "device_id": r.device_id,
                 "account_id": r.account_id, "amount": r.amount}
                for r in records
            ]
            repo = get_graph_repo()
            # rebuild_from_transactions logs node/edge/cluster counts at INFO
            repo.rebuild_from_transactions(tx_list)
        else:
            logger.info("No transactions in DB - fraud graph starts empty")
    except Exception as exc:
        logger.error("Startup graph rebuild failed: %s", exc)
    finally:
        db.close()
    yield
    logger.info("Scamlytics shutting down…")

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Scamlytics - Digital Public Safety AI",
    description=(
        "Multi-agency fraud detection platform: scam analysis, "
        "counterfeit currency detection, fraud graph intelligence, "
        "and geospatial threat mapping."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Middleware ─────────────────────────────────────────────────────────────────

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID", "Accept"],
)

app.add_middleware(RequestIDMiddleware)

# ── DB tables ─────────────────────────────────────────────────────────────────

# (Tables are now created inside lifespan so the test engine is used during tests)

# ── Auth endpoints ────────────────────────────────────────────────────────────

@app.post("/auth/login", tags=["auth"])
def login(payload: LoginRequest):
    """
    Exchange username/password for a JWT access token.

    Demo credentials:
    - police  / police123
    - bank    / bank123
    - citizen / citizen123
    """
    user = authenticate_user(payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(sub=payload.username, role=user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "expires_in_hours": int(os.getenv("JWT_EXPIRE_HOURS", "8")),
    }


@app.get("/auth/me", tags=["auth"])
def get_me(user: TokenData = Depends(get_current_user)):
    """Return current token payload."""
    return {"sub": user.sub, "role": user.role}

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(scam.router)
app.include_router(currency.router)
app.include_router(graph.router)
app.include_router(geo.router)
app.include_router(chat.router)
app.include_router(dashboard.router)
app.include_router(audio.router)

# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["health"])
def root():
    return {
        "status": "ok",
        "service": "scamlytics-digital-public-safety-ai",
        "version": "2.0.0",
    }

# ── Local runner ──────────────────────────────────────────────────────────────
# Preferred launch (from the backend/ dir):  uvicorn app.main:app --reload
# This block only enables `python -m app.main`. Note that `python app/main.py`
# will NOT work — the package-relative imports above require the `app` package
# context, which only exists when launched as a module.
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)