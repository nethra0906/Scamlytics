# backend/api/index.py
# Vercel serverless entry point
import sys
import os

# Make the backend root importable so `app` package imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Vercel's Python runtime looks for a module-level variable named `app`
from app.main import app  # noqa: F401, E402

# Re-export explicitly so Vercel can find it
__all__ = ["app"]