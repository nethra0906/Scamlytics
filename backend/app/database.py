from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# NOTE: get_db references the module-level SessionLocal via globals() so that
# test fixtures can replace `SessionLocal` at the module level and have the
# change reflected here — avoiding the need for any monkey-patching.
import sys as _sys

def get_db():
    _this = _sys.modules[__name__]
    db = _this.SessionLocal()
    try:
        yield db
    finally:
        db.close()