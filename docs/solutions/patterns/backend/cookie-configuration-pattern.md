---
title: "Cookie Configuration Pattern — Project Pattern"
problem_type: pattern
category: backend
components:
  - backend
  - frontend
  - infrastructure
tags:
  - patterns
  - cookies
  - authentication
  - cors
  - nginx
module: auth
date: 2026-08-20
established_in: "Implemented during cookie authentication debugging and nginx proxy configuration"
---

# Pattern: Cookie Configuration Pattern

## Problem / When to Use This

When developing web applications with cookie-based authentication, you need proper configuration for cookie handling across frontend, backend, and proxy layers. This pattern ensures cookies are correctly set, sent, and validated across different environments and prevents common authentication failures.

## Source of Truth Files

- `repos/backend/app/config.py` - Backend CORS and security configuration
- `repos/backend/app/main.py` - CORS middleware setup
- `repos/frontend/src/services/api.ts` - Frontend API configuration
- `repos/frontend/.env` - Frontend environment configuration
- `repos/backend/.env` - Backend environment configuration

## Current Implementation Snapshot

- Backend CORS configured with explicit origins (no wildcard with credentials)
- Frontend API uses axios with automatic cookie handling
- Nginx proxy configured to forward cookies
- Cookie domain properly configured for local development
- Debug endpoint for cookie inspection

## Planned / Optional Extensions (If Applicable)

- Add cookie domain configuration for different environments
- Implement cookie security settings (HttpOnly, Secure, SameSite)
- Add cookie validation middleware
- Include cookie expiration handling

## Pattern Overview

A comprehensive approach to cookie configuration that ensures proper authentication flow across frontend, backend, and proxy layers, with debugging capabilities and environment-specific settings.

## Implementation Steps

### Step 1: Configure Backend CORS

[File to create or modify: `repos/backend/app/config.py`]

```python
"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # Database
    DATABASE_URL: str = "sqlite:///./data/casetecnico.db"

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # Debug
    DEBUG: bool = False

    # CORS - Explicit origins only, never "*" when credentials are allowed
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]
    
    # Security
    MAX_REQUEST_SIZE: int = 10 * 1024 * 1024  # 10MB
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds


settings = Settings()
```

Key points:
- Never use "*" for CORS origins when credentials are allowed
- List all frontend origins explicitly
- Include both development ports (3000, 5173)

### Step 2: Setup CORS Middleware

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
- Use explicit origins from settings

### Step 3: Configure Frontend API

[File to create or modify: `repos/frontend/src/services/api.ts`]

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Store interceptor ID for cleanup
let interceptorId: number | null = null;

// Add authentication interceptor (cookies are handled automatically by browser)
const addAuthInterceptor = () => {
  if (interceptorId !== null) return; // Already added
  
  interceptorId = api.interceptors.request.use((config) => {
    // Browser automatically handles cookies, no need to manually set headers
    return config;
  });
};

// Remove authentication interceptor
const removeAuthInterceptor = () => {
  if (interceptorId !== null) {
    api.interceptors.request.eject(interceptorId);
    interceptorId = null;
  }
};

// Initialize interceptor when module loads
addAuthInterceptor();
```

Key points:
- Let browser handle cookies automatically
- Use axios interceptors for consistent authentication
- Include cleanup functions for proper resource management

### Step 4: Configure Frontend Environment

[File to create or modify: `repos/frontend/.env`]

```env
VITE_API_URL=http://localhost:8000
VITE_APP_TITLE=CaseTecnico - Avaliação de Liderados
```

Key points:
- Use relative URL for API calls to leverage cookie forwarding
- Include application title for branding

### Step 5: Configure Nginx Proxy (if applicable)

[File to create or modify: `repos/backend/nginx.conf` or similar]

```nginx
location / {
    proxy_pass http://backend:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Forward cookies
    proxy_cookie_path / /;
}
```

Key points:
- Forward cookies from proxy to backend
- Include necessary headers for proper routing
- Handle cookie path correctly

## Complete Example

```python
# Backend config.py
CORS_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://localhost:5173",
]

# Backend main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Cookie"],
)

# Frontend api.ts
const api = axios.create({
  baseURL: "/api",  // Use relative URL for cookie forwarding
});

// Frontend .env
VITE_API_URL=http://localhost:8000
```

## Project-Specific Constraints

- [ ] Never use "*" for CORS origins when credentials are allowed
- [ ] Always include "Cookie" in CORS allowed headers
- [ ] Use relative URLs for frontend API calls to enable cookie forwarding
- [ ] Configure CORS origins for all development ports used

## Anti-Patterns (What NOT to Do)

- ❌ Don't use wildcard CORS origins with credentials
- ❌ Don't use `domain=backend` in cookies for local development
- ❌ Don't hardcode the `secure` flag — use environment detection (`import.meta.env.PROD`)
- ❌ Don't forget to include "Cookie" in CORS allowed headers
- ❌ Don't use absolute URLs for frontend API calls when using cookies

## Related Patterns / Docs

- [Backend Service Debugging Pattern](./backend-service-debugging-pattern.md)
- [Authentication Debugging Pattern](./authentication-debugging-pattern.md)
- [Error Handling Pattern](../evaluation-platform-error-handling-guide.md)

## Safe Change Checklist for Future AI Work

1. Update CORS origins when adding new frontend ports
2. Test cookie forwarding after any proxy configuration changes
3. Verify API base URLs are correct for new environments
4. Check that authentication still works after frontend changes
5. Update cookie debug endpoint if authentication flow changes