# Infrastructure

## Infrastructure Overview

Plataforma de avaliação de liderados — projeto greenfield containerizado localmente.

- **Provider Model:** Local (Docker Compose)
- **IaC Tool:** Docker Compose
- **Container Runtime:** Docker

## Environments

| Environment | Purpose | URL | Database |
|-------------|---------|-----|----------|
| Local | Development | http://localhost:3000 (frontend) / http://localhost:8000 (backend) | SQLite |
| Docker | Integrated | http://localhost:3000 | SQLite (volume) |

## Core Services and Dependencies

| Service | Runtime | Port | Purpose | Dependencies |
|---------|---------|------|---------|--------------|
| Frontend | Node.js 18+ / Vite | 3000 | Interface do usuário | Backend API |
| Backend | Python 3.10+ / FastAPI | 8000 | API REST | SQLite |
| Database | SQLite | - | Armazenamento de dados | - |

### Service Architecture

```
[Browser] --> [Frontend :3000] --> [Backend :8000] --> [SQLite DB]
                    |                      |
                    +-- HMR (dev)          +-- OpenAPI docs (:8000/docs)
```

## Deployment and Operations

- **Deployment Strategy:** Manual (docker-compose up)
- **CI/CD Pipeline:** Nenhum (projeto de demonstração)
- **Secrets Management:** Variáveis de ambiente (.env)

### Docker Compose Structure

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
  
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=sqlite:///./data/casetecnico.db
  
  # SQLite is file-based, no separate container needed
```

### Volumes

| Volume | Purpose | Persistence |
|--------|---------|-------------|
| `./data` | SQLite database file | Host filesystem |

## Known Constraints and Risks

### Constraints
- **SQLite:**single-writer, suitable for demo but not production
- **No authentication:** Apenas cookie com employee_id (conforme requisito)
- **No HTTPS:** Apenas HTTP local (para demonstração)

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| SQLite concurrent writes | Baixo (demo) | WAL mode + connection pooling |
| No backup strategy | Baixo (demo) | Volume persistente no host |
| No monitoring | Baixo (demo) | Logs no console |

## Source of Truth References

- **Docker Compose:** `docker-compose.yml` (raiz do projeto)
- **Backend Config:** `.env` (variáveis de ambiente)
- **Frontend Config:** `vite.config.ts`
- **Database Schema:** `backend/alembic/versions/` (migrations)
