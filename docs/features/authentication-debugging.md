# Authentication Debugging Feature

## Purpose
Debug and resolve authentication issues between frontend and backend, particularly cookie-related problems that cause "em implementação..." placeholders.

## User Story
As a developer, I need to debug authentication issues quickly so that I can resolve frontend-backend communication problems and ensure users see actual content instead of placeholders.

## Acceptance Criteria
- [ ] Health check endpoint returns service status
- [ ] Cookie debugging endpoint shows transmitted cookies
- [ ] Authentication flow can be verified step by step
- [ ] Common issues have documented resolution steps
- [ ] Rollback procedures are available for failed debugging attempts

## Implementation Notes

### Endpoints Added

#### Health Check (`/api/health`)
```python
@router.get("/api/health")
def health_check():
    return {"status": "ok"}
```

#### Cookie Debug (`/api/test-cookies`)
```python
@router.get("/api/test-cookies")
def test_cookies(request: Request):
    """Debug-only: disabled (404) unless settings.DEBUG=true."""
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Not Found")
    cookies = request.cookies
    return {"cookies": cookies, "headers": dict(request.headers)}
```

### Frontend Cookie Configuration
**Fixed:** Removed `domain=backend` parameter from cookie setting, added proper validation, and environment-aware `secure` flag
```typescript
// Before (causing issues)
document.cookie = `employee_id=${employeeId}; path=/; domain=backend; max-age=86400; samesite=Lax; secure`;

// After (correct for local development, environment-aware)
const isProduction = import.meta.env.PROD;
document.cookie = `employee_id=${id}; path=/; max-age=86400; samesite=Lax; secure=${isProduction}`;

// Enhanced validation and error handling
const setEmployeeId = (id: number) => {
  if (typeof id !== 'number' || id <= 0) {
    setError("Invalid employee ID");
    return;
  }
  
  try {
    localStorage.setItem("employee_id", String(id));
    const isProduction = import.meta.env.PROD;
    document.cookie = `employee_id=${id}; path=/; max-age=86400; samesite=Lax; secure=${isProduction}`;
    setEmployeeIdState(id);
    setError(null);
  } catch (error) {
    console.error("Error writing authentication data:", error);
    setError("Failed to save authentication data");
  }
};
```

### Edge Cases
1. **Browser Privacy Settings:** Some browsers block third-party cookies
2. **Domain Mismatch:** Frontend and backend must be on compatible domains
3. **Cookie Expiration:** Cookies may expire unexpectedly during development

### Related Features
- **Seed Service:** Database seeding required for authentication testing
- **Error Handling:** Robust error messages for authentication failures
- **Health Monitoring:** Service health checks for operational awareness

## Debugging Workflow

1. **Check Service Health**
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **Verify Cookie Transmission**
   ```bash
   # Requires DEBUG=true in backend .env — returns 404 when disabled
   curl -b cookies.txt -c cookies.txt http://localhost:8000/api/test-cookies
   ```

3. **Browser Inspection**
   - DevTools > Application > Storage > Cookies
   - Verify `employee_id` cookie exists

4. **End-to-End Testing**
   - Select leader in frontend
   - Verify cookie is set
   - Navigate to evaluation/history pages
   - Confirm actual content displays

## Monitoring and Maintenance

### Success Metrics
- Authentication issues resolved within 5 minutes
- Debug endpoint usage tracked
- "em implementação..." errors eliminated

### Maintenance Tasks
- Monitor debug endpoint usage in logs
- Update cookie configuration for production deployment
- Keep troubleshooting documentation current

### Known Limitations
- `/api/test-cookies` only available when `DEBUG=true` (returns 404 otherwise)
- Cookie behavior varies by browser and privacy settings
- Database seeding required for full testing