"""
middleware.py — Request ID injection + structured logging middleware.

Adds:
  - X-Request-ID header (UUID4) to every request and response
  - Structured per-request log line: method, path, status, latency
"""
import time
import uuid
import logging

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger("scamlytics.access")


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Injects a unique X-Request-ID into each request/response."""

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        # Store on request.state so routers can access it
        request.state.request_id = request_id

        start = time.perf_counter()
        response: Response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000

        response.headers["X-Request-ID"] = request_id

        logger.info(
            "%s %s %s %.1fms [%s]",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
            request_id,
        )

        return response
