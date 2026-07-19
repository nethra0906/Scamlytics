"""
conftest.py — pytest fixtures for Scamlytics backend.

Key fix: use StaticPool so all SQLAlchemy connections share the SAME
in-memory SQLite database. Without StaticPool, each connection gets its
own isolated :memory: database, so tables created in one connection are
invisible to others.
"""
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# ── 1. Single shared in-memory engine (StaticPool = one connection shared) ────

test_engine = create_engine(
    "sqlite://",                      # :memory: shorthand
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,             # <<< critical: all code hits the same DB
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# ── 2. Patch app.database BEFORE importing the FastAPI app ────────────────────

import app.database as _db           # noqa: E402
_db.engine = test_engine
_db.SessionLocal = TestingSessionLocal

# ── 3. Import models then create all tables ───────────────────────────────────

import app.models                     # noqa: E402  — registers all table metadata
from app.database import Base         # noqa: E402
Base.metadata.create_all(bind=test_engine)

# ── 4. Import app (lifespan create_all will be a no-op; tables already exist) ─

from app.main import app              # noqa: E402
from app.database import get_db       # noqa: E402
from fastapi.testclient import TestClient   # noqa: E402


# ── 5. Dependency override ────────────────────────────────────────────────────

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── 6. TestClient fixture ─────────────────────────────────────────────────────

@pytest.fixture()
def client():
    """TestClient backed by a shared in-memory SQLite (StaticPool)."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
