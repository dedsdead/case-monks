"""Health check router."""

from fastapi import APIRouter, HTTPException, Request

from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health_check():
    return {"status": "ok"}


@router.get("/api/test-cookies")
def test_cookies(request: Request):
    """Test endpoint to see what cookies are being sent.

    Debug-only: disabled (404) unless DEBUG=true, because it echoes
    cookies and headers back to the caller.
    """
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Not Found")
    cookies = request.cookies
    return {"cookies": cookies, "headers": dict(request.headers)}
