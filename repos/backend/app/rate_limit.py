"""Simple in-memory fixed-window rate limiting for FastAPI endpoints.

Suited for the single-process SQLite deployment of this application.
For multi-worker deployments, replace with a shared backend (e.g. Redis).
"""

import time
from collections import defaultdict
from typing import Callable

from fastapi import Cookie, HTTPException, Request, status


class RateLimiter:
    """Fixed-window counter per key, safe for single-process usage."""

    def __init__(self, times: int, seconds: int):
        self.times = times
        self.seconds = seconds
        self._hits: dict[tuple[str, float], int] = defaultdict(int)
        _limiters.append(self)

    def hit(self, key: str) -> tuple[bool, int]:
        """Register a hit for the key.

        Returns (allowed, retry_after_seconds).
        """
        now = time.time()
        window = int(now // self.seconds)
        bucket = (key, window)
        self._hits[bucket] += 1

        # Prune expired windows to keep memory bounded.
        expired = [wk for wk in self._hits if wk[1] < window]
        for wk in expired:
            del self._hits[wk]

        allowed = self._hits[bucket] <= self.times
        retry_after = max(1, int((window + 1) * self.seconds - now))
        return allowed, retry_after

    def reset(self) -> None:
        """Clear all counters."""
        self._hits.clear()


_limiters: list[RateLimiter] = []


def reset_all_limiters() -> None:
    """Reset every registered limiter (used by tests and admin tooling)."""
    for limiter in _limiters:
        limiter.reset()


def rate_limit(times: int, seconds: int) -> Callable:
    """Dependency factory limiting requests per identity within a window.

    Keys on the employee_id cookie when present, falling back to the
    client host. Responds with 429 and a Retry-After header once the
    threshold is exceeded.
    """
    limiter = RateLimiter(times=times, seconds=seconds)

    def dependency(
        request: Request,
        employee_id: str | None = Cookie(default=None),
    ) -> None:
        key = employee_id or (
            request.client.host if request.client else "anonymous"
        )
        allowed, retry_after = limiter.hit(key)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
                headers={"Retry-After": str(retry_after)},
            )

    return dependency
