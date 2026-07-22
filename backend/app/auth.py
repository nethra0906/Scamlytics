"""
auth.py — JWT authentication + role-based access control.

Roles: police | bank | citizen
Token lifetime: 8 hours (configurable via JWT_EXPIRE_HOURS env var)

Usage in routers:
    from ..auth import get_current_user, require_role, TokenData
    
    # Any authenticated user:
    @router.get("/protected")
    def protected(user: TokenData = Depends(get_current_user)):
        ...
    
    # Specific role:
    @router.get("/police-only")
    def police_only(user: TokenData = Depends(require_role("police"))):
        ...
"""
import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# ── Config ──────────────────────────────────────────────────────────────────

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "scamlytics-hackathon-secret-change-in-prod-2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "8"))

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

# ── Models ──────────────────────────────────────────────────────────────────

VALID_ROLES = {"police", "bank", "citizen"}

class TokenData(BaseModel):
    sub: str           # username / user id
    role: str          # police | bank | citizen
    exp: Optional[int] = None


class LoginRequest(BaseModel):
    username: str
    password: str
    # Optional + ignored: the authoritative role comes from the user store,
    # not from what the client claims. Kept for backward-compatible payloads.
    role: Optional[str] = None


# ── Demo user store (replaces a real DB for hackathon purposes) ─────────────
# In production: query users table with hashed passwords.

_DEMO_USERS = {
    "police":  {"password_hash": pwd_context.hash("police123"),  "role": "police"},
    "bank":    {"password_hash": pwd_context.hash("bank123"),    "role": "bank"},
    "citizen": {"password_hash": pwd_context.hash("citizen123"), "role": "citizen"},
}


# ── Token helpers ───────────────────────────────────────────────────────────

def create_access_token(sub: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": sub, "role": role, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        role = payload.get("role")
        if sub is None or role not in VALID_ROLES:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        return TokenData(sub=sub, role=role, exp=payload.get("exp"))
    except JWTError as exc:
        logger.debug("JWT validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── FastAPI dependencies ────────────────────────────────────────────────────

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> TokenData:
    """
    Dependency: extracts and validates JWT from Authorization: Bearer header.
    Returns TokenData with sub + role.
    
    NOTE: For the hackathon demo, a missing/invalid token defaults to the
    'citizen' guest role instead of returning 401, so the frontend works
    without login. Set REQUIRE_AUTH=true env var to enforce strict auth.
    """
    require_auth = os.getenv("REQUIRE_AUTH", "false").lower() == "true"

    if credentials is None:
        if require_auth:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        return TokenData(sub="guest", role="citizen")

    return verify_token(credentials.credentials)


def require_role(*roles: str):
    """Dependency factory: only allows users with one of the specified roles."""
    def _check(user: TokenData = Depends(get_current_user)) -> TokenData:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' is not authorised for this resource. Required: {list(roles)}"
            )
        return user
    return _check


def authenticate_user(username: str, password: str) -> Optional[dict]:
    user = _DEMO_USERS.get(username)
    if user and pwd_context.verify(password, user["password_hash"]):
        return user
    return None
