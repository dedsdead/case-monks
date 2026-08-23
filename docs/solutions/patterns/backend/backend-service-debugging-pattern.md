---
title: "Backend Service Debugging Pattern — Project Pattern"
problem_type: pattern
category: backend
components:
  - backend
tags:
  - patterns
  - debugging
  - health-check
  - fastapi
  - systematic-debugging
module: backend
date: 2026-08-19
established_in: "Implemented during backend server debugging and 'em implementação...' placeholder issue fix"
---

# Pattern: Backend Service Debugging Pattern

## Problem / When to Use This

When developing or debugging FastAPI applications, you need a systematic approach to verify backend health, identify issues, and ensure all services are running correctly. This pattern is essential for troubleshooting API failures, database connectivity issues, and service startup problems.

## Source of Truth Files

- `repos/backend/app/routers/health.py` - Health check endpoints
- `repos/backend/app/main.py` - Application lifespan and startup logic
- `repos/backend/requirements.txt` - Dependencies for debugging tools

## Current Implementation Snapshot

- Health check endpoint at `/api/health` returns basic service status
- Cookie testing endpoint at `/api/test-cookies` shows what cookies are being sent
- Application lifespan includes database setup verification
- Structured logging for database operations and seeding
- Manual database setup script for avoiding migration hang issues

## Planned / Optional Extensions (If Applicable)

- Add database connectivity checks to health endpoint
- Include environment validation in health checks
- Add performance metrics endpoint
- Include dependency status checks

## Pattern Overview

A systematic approach to debugging FastAPI backend services using dedicated health check endpoints, structured logging, and manual database setup to avoid common pitfalls like migration hangs and cookie authentication issues.

## Implementation Steps

### Step 1: Create Health Check Router

[File to create or modify: `repos/backend/app/routers/health.py`]

```python
"""Health check router."""

from fastapi import APIRouter, Request

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health_check():
    """Basic health check endpoint."""
    return {"status": "ok"}


@router.get("/api/test-cookies")
def test_cookies(request: Request):
    """Test endpoint to see what cookies are being sent."""
    cookies = request.cookies
    return {"cookies": cookies, "headers": dict(request.headers)}
```

Key points:
- Always include basic health check for service availability
- Add debugging endpoints for specific issues (cookies, headers, etc.)
- Use descriptive tags for better API documentation

### Step 2: Configure Application Lifespan

[File to create or modify: `repos/backend/app/main.py`]

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: setup database manually, then seed database."""
    os.makedirs("data", exist_ok=True)
    try:
        # Import and run manual database setup
        from manual_setup import setup_database
        setup_database()
        logger.info("Database setup completed successfully")
    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        raise

    session = SessionLocal()
    try:
        seed_database(session)
        logger.info("Database seeding completed successfully")
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        raise
    finally:
        session.close()

    yield
```

Key points:
- Handle database setup in lifespan context to ensure proper initialization
- Include error handling and logging for setup failures
- Use proper resource cleanup with try/finally blocks

### Step 3: Include Health Router

[File to create or modify: `repos/backend/app/main.py`]

```python
app.include_router(health.router)
```

Key points:
- Include health router early in application setup
- Keep health checks simple and fast
- Avoid dependencies that might fail in health checks

## Complete Example

```python
# main.py
from fastapi import FastAPI
from app.routers import health

app = FastAPI(
    title="CaseTecnico - Avaliação de Liderados",
    version="0.1.0",
    debug=settings.DEBUG,
)

app.include_router(health.router)

# health.py
from fastapi import APIRouter, Request

router = APIRouter(tags=["health"])

@router.get("/api/health")
def health_check():
    return {"status": "ok"}

@router.get("/api/test-cookies")
def test_cookies(request: Request):
    cookies = request.cookies
    return {"cookies": cookies, "headers": dict(request.headers)}
```

## Project-Specific Constraints

- [ ] Health checks must be fast and not depend on external services
- [ ] Use structured logging with appropriate log levels
- [ ] Database setup must be idempotent and handle partial failures
- [ ] Include CORS middleware for local development

## Anti-Patterns (What NOT to Do)

- ❌ Don't make health checks depend on database connectivity (can cause cascading failures)
- ❌ Don't include complex business logic in health endpoints
- ❌ Don't forget to handle exceptions in lifespan context
- ❌ Don't use synchronous database operations in async lifespan

## Related Patterns / Docs

- [Cookie Configuration Pattern](./cookie-configuration-pattern.md)
- [Database Seeding Pattern](./database-seeding-pattern.md)
- [Authentication Debugging Pattern](./authentication-debugging-pattern.md)
- [Recursive CTE Error Handling Pattern](./recursive-cte-error-handling-pattern.md)
- [Evaluation Platform Error Handling Guide](../evaluation-platform-error-handling-guide.md)

## Safe Change Checklist for Future AI Work

1. Update health endpoints to include new service dependencies
2. Add new debugging routes as needed for specific issues
3. Update lifespan context for new database requirements
4. Test health endpoints after any backend changes
5. Verify CORS configuration matches new endpoints