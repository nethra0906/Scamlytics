# backend/api/index.py
# Vercel serverless entry point — re-exports the FastAPI app
import sys
import os

# Make sure the backend root is on the path so `app` package imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: F401 — Vercel picks up `app` automatically