---
title: "Authentication Debugging Pattern — Project Pattern"
problem_type: pattern
category: backend
components:
  - backend
  - frontend
  - auth
tags:
  - patterns
  - debugging
  - authentication
  - cookies
  - systematic-debugging
module: auth
date: 2026-08-20
established_in: "Implemented during cookie authentication failure troubleshooting"
---

# Pattern: Authentication Debugging Pattern

## Problem / When to Use This

When cookie-based authentication fails or behaves unexpectedly, you need a systematic approach to diagnose and resolve authentication issues. This pattern provides a structured methodology for troubleshooting authentication problems across frontend, backend, and proxy layers.

## Source of Truth Files

- `repos/backend/app/routers/health.py` - Authentication debugging endpoints
- `repos/backend/app/main.py` - CORS and middleware configuration
- `repos/frontend/src/services/api.ts` - Frontend authentication setup
- `repos/backend/app/config.py` - Backend security configuration

## Current Implementation Snapshot

- Dedicated cookie testing endpoint at `/api/test-cookies` (debug-gated: 404 unless `settings.DEBUG=true`, since it echoes cookies/headers back)
- Systematic approach to verifying authentication flow
- CORS configuration for cookie forwarding
- Frontend API with automatic cookie handling
- Structured logging for authentication operations

## Planned / Optional Extensions (If Applicable)

- Add authentication timing and performance metrics
- Include token validation debugging
- Add session state inspection endpoints
- Implement authentication flow visualization

## Pattern Overview

A systematic approach to debugging cookie-based authentication issues using dedicated endpoints, proper configuration validation, and step-by-step troubleshooting methodology to identify and resolve authentication failures.

## Implementation Steps

### Step 1: Create Authentication Debugging Endpoints

[File to create or modify: `repos/backend/app/routers/health.py`]

```python
"""Health check router."""

from fastapi import APIRouter, HTTPException, Request

from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health_check():
    """Basic health check endpoint."""
    return {"status": "ok"}


@router.get("/api/test-cookies")
def test_cookies(request: Request):
    """Debug-only: disabled (404) unless settings.DEBUG=true."""
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Not Found")
    cookies = request.cookies
    headers = dict(request.headers)
    
    return {
        "cookies": cookies,
        "headers": headers,
        "authentication_status": "present" if any("session" in key.lower() for key in cookies.keys()) else "missing",
        "cors_info": {
            "origin": headers.get("origin", "unknown"),
            "referer": headers.get("referer", "unknown"),
        }
    }
```

Key points:
- Return comprehensive cookie and header information
- Include authentication status analysis
- Provide CORS-related debugging information
- Keep endpoint fast and non-blocking
- **Always gate cookie/header-echoing endpoints behind a DEBUG check** (2026-08-22) — they leak credentials when exposed in non-dev environments

### Step 2: Verify Backend Authentication Configuration

[File to create or modify: `repos/backend/app/main.py`]

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Cookie"],
)
```

Key points:
- Enable credentials for cookie-based authentication
- Include "Cookie" in allowed headers
- Use explicit origins (no wildcard with credentials)

### Step 3: Configure Frontend Authentication

[File to create or modify: `repos/frontend/src/services/api.ts`]

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Add authentication interceptor — reads employee_id from localStorage
// and sends it as Cookie header (simulated auth, no server-side sessions)
api.interceptors.request.use((config) => {
  const employeeId = localStorage.getItem("employee_id");
  if (employeeId) {
    config.headers.Cookie = `employee_id=${employeeId}`;
  }
  return config;
});
```

Key points:
- Read `employee_id` from localStorage and set as Cookie header
- This is a simulated auth system — no server-side sessions, so manual cookie injection is required
- Use axios interceptors for consistent authentication across all requests
- Provide cleanup functions for proper resource management

### Step 4: Create Systematic Debugging Workflow

Create a debugging script or workflow that follows these steps:

```python
# debugging_workflow.py
def debug_authentication_flow():
    """Systematic authentication debugging workflow."""
    
    print("=== Authentication Debugging Workflow ===")
    
    # Step 1: Check backend health
    print("1. Checking backend health...")
    try:
        response = requests.get("http://localhost:8000/api/health")
        print(f"Backend status: {response.status_code}")
    except Exception as e:
        print(f"Backend health check failed: {e}")
        return
    
    # Step 2: Check cookie endpoint
    print("2. Checking cookie configuration...")
    try:
        response = requests.get("http://localhost:8000/api/test-cookies")
        print(f"Cookies received: {response.json().get('cookies', {})}")
    except Exception as e:
        print(f"Cookie test failed: {e}")
    
    # Step 3: Verify CORS configuration
    print("3. Verifying CORS configuration...")
    # Check backend CORS settings
    # Test frontend requests
    
    # Step 4: Test authentication flow
    print("4. Testing authentication flow...")
    # Test login, session creation, and protected endpoints
    
    print("=== Debugging Complete ===")
```

Key points:
- Follow a systematic step-by-step approach
- Check each layer of the authentication stack
- Log detailed information for analysis
- Provide clear next steps for resolution

## Complete Example

```python
# Backend health.py
@router.get("/api/test-cookies")
def test_cookies(request: Request):
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Not Found")
    cookies = request.cookies
    headers = dict(request.headers)
    
    return {
        "cookies": cookies,
        "headers": headers,
        "authentication_status": "present" if any("session" in key.lower() for key in cookies.keys()) else "missing",
        "cors_info": {
            "origin": headers.get("origin", "unknown"),
            "referer": headers.get("referer", "unknown"),
        }
    }

# Frontend api.ts
export const checkAuthState = async () => {
  try {
    const response = await api.get("/api/test-cookies");
    return response.data;
  } catch (error) {
    console.error("Authentication check failed:", error);
    return null;
  }
};

# Debugging workflow
def debug_authentication_flow():
    print("=== Authentication Debugging Workflow ===")
    
    # Step 1: Check backend health
    print("1. Checking backend health...")
    try:
        response = requests.get("http://localhost:8000/api/health")
        print(f"Backend status: {response.status_code}")
    except Exception as e:
        print(f"Backend health check failed: {e}")
        return
    
    # Step 2: Check cookie endpoint
    print("2. Checking cookie configuration...")
    try:
        response = requests.get("http://localhost:8000/api/test-cookies")
        print(f"Cookies received: {response.json().get('cookies', {})}")
    except Exception as e:
        print(f"Cookie test failed: {e}")
    
    print("=== Debugging Complete ===")
```

## Project-Specific Constraints

- [ ] Always include "Cookie" in CORS allowed headers
- [ ] Use explicit CORS origins (no wildcard with credentials)
- [ ] Keep debugging endpoints fast and non-blocking
- [ ] Include comprehensive logging for authentication operations

## Anti-Patterns (What NOT to Do)

- ❌ Don't use wildcard CORS origins with credentials
- ❌ Don't use `domain=backend` in cookies for local development
- ❌ Don't forget to test authentication after configuration changes
- ❌ Don't skip systematic debugging - follow the workflow
- ❌ Don't make debugging endpoints depend on authentication
- ❌ Don't hardcode `secure` flag — use environment detection (`import.meta.env.PROD`)

## Related Patterns / Docs

- [Backend Service Debugging Pattern](./backend-service-debugging-pattern.md)
- [Cookie Configuration Pattern](./cookie-configuration-pattern.md)
- [Error Handling Pattern](../evaluation-platform-error-handling-guide.md)

## Safe Change Checklist for Future AI Work

1. Test authentication endpoints after any backend changes
2. Verify CORS configuration matches new endpoints
3. Check that cookie forwarding works after proxy changes
4. Update debugging workflow if authentication flow changes
5. Test frontend authentication after any API changes