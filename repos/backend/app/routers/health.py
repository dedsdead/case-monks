"""Health check router."""

from fastapi import APIRouter, Request

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health_check():
    return {"status": "ok"}


@router.get("/api/test-cookies")
def test_cookies(request: Request):
    """Test endpoint to see what cookies are being sent."""
    cookies = request.cookies
    return {"cookies": cookies, "headers": dict(request.headers)}
