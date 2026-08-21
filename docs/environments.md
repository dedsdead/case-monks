# Environments

## Environment Matrix

| Environment | Purpose | URL | Branch | Database |
|-------------|---------|-----|--------|----------|
| Local | Development | http://localhost:3000 | feature/* | SQLite (./data/casetecnico.db) |
| Docker | Integrated | http://localhost:3000 | any | SQLite (volume) |

## Configuration and Secrets Boundaries

### Configuration Sources

| Config Type | Local | Docker |
|-------------|-------|--------|
| Environment Variables | `.env` | `.env` |
| Database URL | `DATABASE_URL` | `DATABASE_URL` |
| API URL | `VITE_API_URL` | `VITE_API_URL` |

### Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL=sqlite:///./data/casetecnico.db

# API
API_HOST=0.0.0.0
API_PORT=8000

# Debug
DEBUG=true
```

#### Frontend (.env)
```bash
# API URL
VITE_API_URL=http://localhost:8000

# App
VITE_APP_TITLE=CaseTecnico - Avaliação de Liderados
```

### Secrets Management

- **No secrets required** — Demo application
- **Cookie:** `employee_id` stored in browser (not sensitive)
- **Database:** SQLite file (no credentials)

## Deployment Differences

### Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Frontend tests
cd frontend
npm test              # Run all tests (watch mode)
npm run test:run      # Run all tests (single run, CI mode)
```

### Docker Compose

```bash
# Build and run all services
docker-compose up --build

# Access
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Key Differences

| Aspect | Local | Docker |
|--------|-------|--------|
| Hot reload | Yes (both) | Yes (volume mounts) |
| Database | Host filesystem | Volume |
| Network | localhost | Docker network |
| Ports | Explicit mapping | Explicit mapping |

### Debug Endpoints

#### Local Development
- **Health Check:** `http://localhost:8000/api/health`
- **Cookie Debug:** `http://localhost:8000/api/test-cookies`

#### Docker
- **Health Check:** `http://localhost:8000/api/health`
- **Cookie Debug:** `http://localhost:8000/api/test-cookies`

### Common Development Issues

#### Cookie Authentication
- **Issue:** Frontend shows "em implementação..." instead of content
- **Fix:** Ensure no `domain=backend` parameter in cookie (local development)
- **Debug:** Use `/api/test-cookies` endpoint to verify cookie transmission

#### Database Seeding
- **Issue:** No data in database, backend errors
- **Fix:** Restart backend service to trigger automatic seeding
- **Verify:** Check `repos/backend/data/casetecnico.db` exists

#### Service Dependencies
- **Issue:** Frontend works but backend endpoints fail
- **Fix:** Ensure backend is running before starting frontend
- **Order:** Backend → Database seeding → Frontend

## Operational Access

### Local

- **Access:** Direct (localhost)
- **Prerequisites:** Node.js 18+, Python 3.10+
- **Setup:** `npm install` + `pip install -r requirements.txt`

### Docker

- **Access:** Docker network
- **Prerequisites:** Docker, Docker Compose
- **Setup:** `docker-compose up --build`

### Monitoring

| Environment | Logs | Metrics | Traces |
|-------------|------|---------|--------|
| Local | Console (stdout) | None | None |
| Docker | `docker-compose logs` | None | None |

### Debugging

| Environment | Tool | Command |
|-------------|------|---------|
| Local | VS Code | Launch configs |
| Docker | docker exec | `docker exec -it <container> bash` |

## Database Management

### SQLite Location

- **Local:** `./backend/data/casetecnico.db`
- **Docker:** Volume mount to same path

### Migrations

```bash
# Generate migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Seed Data

Seed data is loaded automatically via the Python seed service on backend startup.

```python
# app/services/seed.py
def seed_database(db: Session) -> None:
    # Idempotent: checks if data exists before inserting
    # Inserts 20 employees, 19 leader_lead relationships, 6 evaluation questions
    pass
```

The seed function runs during FastAPI lifespan startup and is idempotent (skips if data already exists).
