# Authentication Debugging Runbook

## Purpose
Debug and resolve authentication issues between frontend and backend, particularly cookie-related problems that cause "em implementação..." placeholders.

## Prerequisites
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:3000`
- Browser DevTools access
- `curl` command available

## Steps

### 1. Verify Backend Health
```bash
# Check backend is running and responding
curl http://localhost:8000/api/health

# Expected response: {"status": "ok"}
```

### 2. Check Database Status
```bash
# Verify database file exists
ls -la repos/backend/data/casetecnico.db

# If missing, restart backend to trigger seeding
cd repos/backend
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Test Cookie Transmission
```bash
# Test cookies endpoint to see what's being sent
# Requires DEBUG=true in backend .env — returns 404 when disabled
curl -b cookies.txt -c cookies.txt http://localhost:8000/api/test-cookies

# Expected response: {"cookies": {}, "headers": {...}}
```

### 4. Frontend Cookie Check
1. Open browser DevTools (F12)
2. Go to Application > Storage > Cookies
3. Select `http://localhost:3000`
4. Verify `employee_id` cookie exists with correct value

### 5. Test Authentication Flow
1. Open frontend: `http://localhost:3000`
2. Select a leader from dropdown
3. Check browser console for errors
4. Verify cookie is set (no `domain=backend` parameter)
5. Test identity change: select different leader and verify proper redirection
6. Test error handling: clear cookies and verify error messages

### 6. Test Error Handling and Redirection
1. Open browser DevTools and clear all cookies
2. Refresh frontend page
3. Verify error message appears: "Invalid employee ID in local storage"
4. Select a leader from dropdown
5. Verify automatic redirection to home page
6. Test with invalid employee IDs in localStorage

### 6. Cross-Origin Verification
```bash
# Test API directly with curl (should work without cookies)
curl http://localhost:8000/api/employees

# Should return employee list or 401 if auth required
```

## Verification
- [ ] Backend health check returns 200
- [ ] Database file exists
- [ ] `/api/test-cookies` endpoint accessible (with `DEBUG=true`; 404 when the flag is off)
- [ ] Frontend sets `employee_id` cookie without domain parameter
- [ ] Employee selection persists across page refreshes
- [ ] Evaluation and history pages display actual content

## Rollback
If changes cause issues:
1. Clear browser cookies: DevTools > Application > Storage > Clear cookies
2. Restart both frontend and backend services
3. Re-test authentication flow

## Escalation
- **Backend issues:** Check backend logs for errors
- **Frontend issues:** Check browser console for JavaScript errors
- **Database issues:** Verify database file permissions and seeding
- **Persistent issues:** Check for port conflicts or service dependencies