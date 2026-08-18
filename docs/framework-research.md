# Framework-Specific Documentation Research

**Tech Stack:** FastAPI 0.110+ | SQLAlchemy 2.x | Pydantic 2.x | Alembic | SQLite | React 18.x | TypeScript 5.x | Vite 5.x | Axios 1.x | Docker Compose

---

## 1. FastAPI (0.110+)

### 1.1 Router Organization Pattern (APIRouter)

**Source:** https://fastapi.tiangolo.com/tutorial/bigger-applications/

Use `APIRouter` to split your application into multiple files with prefixed routes, shared tags, and dependencies.

```python
# app/routers/leads.py
from fastapi import APIRouter, Depends

router = APIRouter(
    prefix="/leads",
    tags=["leads"],
    dependencies=[Depends(get_token_header)],
    responses={404: {"description": "Not found"}},
)

@router.get("/")
async def read_leads():
    ...

@router.get("/{lead_id}")
async def read_lead(lead_id: int):
    ...
```

**Main app aggregation:**

```python
# app/main.py
from fastapi import FastAPI, Depends
from .routers import leads, users

app = FastAPI(
    dependencies=[Depends(get_query_token)],
    title="Case Técnico API",
    version="1.0.0",
)

app.include_router(leads.router)
app.include_router(users.router)

# Override prefix/tags/dependencies at include time for external routers
app.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_token_header)],
)
```

**Key rules:**
- Prefix must NOT include a trailing `/` (e.g., `"/items"` not `"/items/"`)
- Use submodule import (`from .routers import leads`) not individual router import to avoid name collisions
- Router dependencies execute before path-operation-specific dependencies
- FastAPI keeps the original `APIRouter` active after inclusion — no performance overhead

### 1.2 Dependency Injection for Auth (Cookie Reading)

**Source:** https://fastapi.tiangolo.com/tutorial/dependencies/ and https://fastapi.tiangolo.com/cookie-params/

```python
from typing import Annotated
from fastapi import Cookie, Depends, FastAPI, HTTPException

app = FastAPI()

async def get_current_user(
    session_token: Annotated[str | None, Cookie()] = None,
) -> User:
    if session_token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = decode_session(session_token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid session")
    return user

# Type alias for reuse across the codebase
CurrentUser = Annotated[User, Depends(get_current_user)]

@router.get("/users/me")
async def read_user_me(current_user: CurrentUser):
    return current_user
```

**Using `yield` dependencies for DB sessions:**

```python
from collections.abc import Generator

def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_db)]
```

### 1.3 CORSMiddleware Configuration

**Source:** https://fastapi.tiangolo.com/tutorial/cors/

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,      # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Critical constraints:**
- When `allow_credentials=True`, `allow_origins` CANNOT be `["*"]` — must list specific origins
- When `allow_credentials=True`, `allow_methods` and `allow_headers` CANNOT be `["*"]` — must be explicit lists
- For development, listing `["*"]` without credentials is simpler

### 1.4 Pydantic Model Integration

**Source:** https://fastapi.tiangolo.com/tutorial/sql-databases/

Use separate Pydantic models for Create, Read, Update, and internal DB representation:

```python
from pydantic import BaseModel, ConfigDict

# Base schema (shared fields)
class HeroBase(BaseModel):
    name: str
    age: int | None = None

# Schema for creating (no id)
class HeroCreate(HeroBase):
    secret_name: str

# Schema for updating (all optional)
class HeroUpdate(BaseModel):
    name: str | None = None
    age: int | None = None
    secret_name: str | None = None

# Schema for public response (includes id)
class HeroPublic(HeroBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
```

**SQLAlchemy ↔ Pydantic bridge:** Set `from_attributes=True` in `model_config` so Pydantic can read from ORM objects.

---

## 2. SQLAlchemy 2.x

### 2.1 Declarative Base (New Style)

**Source:** https://docs.sqlalchemy.org/en/20/orm/declarative_config.html

Use the modern `DeclarativeBase` class (NOT the legacy `declarative_base()` function):

```python
from typing import List, Optional
from sqlalchemy import ForeignKey, String, Table, Column, Integer
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

# Table with mapped columns
class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    addresses: Mapped[List["Address"]] = relationship(back_populates="user")

class Address(Base):
    __tablename__ = "address"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    email_address: Mapped[str]
    user: Mapped["User"] = relationship(back_populates="addresses")
```

**Key patterns:**
- `Mapped[int]` replaces `Column(Integer)` for type annotation
- `mapped_column()` replaces `Column()` directly
- `Optional[X]` means nullable; bare `X` means NOT NULL
- `String(50)` is explicit-length; omit for TEXT (SQLite treats both as TEXT)

### 2.2 Self-Referential Relationships (leader_lead pattern)

**Source:** https://docs.sqlalchemy.org/en/20/orm/self_referential.html

```python
class Node(Base):
    __tablename__ = "node"

    id: Mapped[int] = mapped_column(primary_key=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("node.id"))
    data: Mapped[str]

    # Many-to-one (parent)
    parent: Mapped[Optional["Node"]] = relationship(
        "Node",
        back_populates="children",
        remote_side=[id],
    )
    # One-to-many (children)
    children: Mapped[List["Node"]] = relationship(
        "Node",
        back_populates="parent",
    )
```

**Self-referential many-to-many (association table):**

```python
from typing import List
from sqlalchemy import Table, Column, Integer, ForeignKey

node_to_node = Table(
    "node_to_node",
    Base.metadata,
    Column("left_node_id", Integer, ForeignKey("node.id"), primary_key=True),
    Column("right_node_id", Integer, ForeignKey("node.id"), primary_key=True),
)

class Node(Base):
    __tablename__ = "node"

    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str]

    right_nodes: Mapped[List["Node"]] = relationship(
        "Node",
        secondary=node_to_node,
        primaryjoin=id == node_to_node.c.left_node_id,
        secondaryjoin=id == node_to_node.c.right_node_id,
        back_populates="left_nodes",
    )
    left_nodes: Mapped[List["Node"]] = relationship(
        "Node",
        secondary=node_to_node,
        primaryjoin=id == node_to_node.c.right_node_id,
        secondaryjoin=id == node_to_node.c.left_node_id,
        back_populates="right_nodes",
    )
```

### 2.3 Recursive CTE Query Syntax

**Source:** https://docs.sqlalchemy.org/en/20/core/connections.html

SQLAlchemy 2.x supports recursive CTEs via `cte.recursive` and union:

```python
from sqlalchemy import select, literal_column
from sqlalchemy.orm import Session

def get_subtree(session: Session, root_id: int) -> list[Node]:
    # Anchor member
    anchor = (
        select(Node)
        .where(Node.id == root_id)
        .cte(name="tree", recursive=True)
    )

    # Recursive member - join node to CTE
    tree = anchor.union_all(
        select(Node).where(Node.parent_id == anchor.c.id)
    )

    # Query the CTE
    stmt = select(Node).join(tree, Node.id == tree.c.id)
    return list(session.scalars(stmt))
```

### 2.4 Session Management with FastAPI

**Source:** https://docs.sqlalchemy.org/en/20/orm/session_basics.html and https://fastapi.tiangolo.com/tutorial/sql-databases/

```python
from collections.abc import Generator
from typing import Annotated

from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Engine (module-level, shared)
engine = create_engine(
    "sqlite:///./data.db",
    connect_args={"check_same_thread": False},  # Required for SQLite
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Type alias
SessionDep = Annotated[Session, Depends(get_db)]

# Usage in routes
@router.post("/leads/")
def create_lead(lead: LeadCreate, session: SessionDep) -> Lead:
    db_lead = Lead(**lead.model_dump())
    session.add(db_lead)
    session.commit()
    session.refresh(db_lead)
    return db_lead
```

**Key rules:**
- `check_same_thread=False` is **mandatory** for SQLite with FastAPI
- Session lifecycle: create → yield → close (in finally block)
- Use `session.commit()` to persist; `session.refresh(obj)` to read back generated values
- `session.close()` releases the connection back to the pool

---

## 3. Alembic

### 3.1 Initial Migration Setup

**Source:** https://alembic.sqlalchemy.org/en/latest/tutorial.html

```bash
cd backend
alembic init alembic
```

**Modify `alembic.ini`:**

```ini
[alembic]
script_location = %(here)s/alembic
sqlalchemy.url = sqlite:///./data.db
```

**Modify `env.py` to import your models:**

```python
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.models import Base  # Import your DeclarativeBase

config = context.config
target_metadata = Base.metadata

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()
```

### 3.2 Autogenerate from Models

```bash
# Create migration from model changes
alembic revision --autogenerate -m "create leads table"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1

# View current revision
alembic current
```

### 3.3 SQLite-Specific Considerations

**Source:** https://alembic.sqlalchemy.org/en/latest/batch.html

SQLite lacks full ALTER TABLE support. Use **batch mode** for schema changes:

```python
def upgrade() -> None:
    # Batch mode handles SQLite's limitations automatically
    with op.batch_alter_table("leads") as batch_op:
        batch_op.add_column(sa.Column("new_field", sa.String(100)))
        batch_op.alter_column("name", new_column_name="lead_name")
```

**Enable batch mode in `env.py` for autogenerate:**

```python
context.configure(
    connection=connection,
    target_metadata=target_metadata,
    render_as_batch=True,  # <-- Required for SQLite
)
```

**Important SQLite notes:**
- `render_as_batch=True` is **mandatory** for autogenerate with SQLite
- Batch mode creates a temporary table, copies data, drops original, renames temp — this is the "move and copy" pattern
- Disable `PRAGMA FOREIGN KEYS` during batch operations if referential integrity is enforced
- Use **naming conventions** for constraints so unnamed FKs can be reflected:

```python
# In env.py or model metadata
naming_convention = {
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
```

---

## 4. React 18 + TypeScript 5.x + Vite 5.x

### 4.1 Project Structure Conventions

```
frontend/
├── src/
│   ├── api/              # Axios instance, API functions
│   │   ├── client.ts
│   │   └── leads.ts
│   ├── components/       # Shared/reusable components
│   │   ├── ui/
│   │   └── layout/
│   ├── features/         # Feature modules (leads, users)
│   │   ├── leads/
│   │   │   ├── LeadList.tsx
│   │   │   ├── LeadDetail.tsx
│   │   │   └── types.ts
│   │   └── users/
│   ├── hooks/            # Custom hooks
│   ├── types/            # Shared TypeScript interfaces
│   │   └── api.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── routes.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 4.2 React Router v6+ Setup

**Source:** https://reactrouter.com/start/framework/installation

```tsx
// src/routes.tsx
import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./components/layout/RootLayout";
import LeadList from "./features/leads/LeadList";
import LeadDetail from "./features/leads/LeadDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <LeadList /> },
      { path: "leads", element: <LeadList /> },
      { path: "leads/:leadId", element: <LeadDetail /> },
    ],
  },
]);
```

```tsx
// src/main.tsx
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
```

### 4.3 Axios Instance Configuration with Interceptors

```typescript
// src/api/client.ts
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,  // Send cookies cross-origin
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if needed
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

```typescript
// src/api/leads.ts
import apiClient from "./client";
import type { Lead, LeadCreate, LeadUpdate } from "../types/api";

export const leadsApi = {
  list: (offset = 0, limit = 100) =>
    apiClient.get<Lead[]>("/leads", { params: { offset, limit } }),

  get: (id: number) =>
    apiClient.get<Lead>(`/leads/${id}`),

  create: (data: LeadCreate) =>
    apiClient.post<Lead>("/leads", data),

  update: (id: number, data: LeadUpdate) =>
    apiClient.patch<Lead>(`/leads/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/leads/${id}`),
};
```

### 4.4 TypeScript Interface Patterns for API Responses

```typescript
// src/types/api.ts

// Backend Pydantic model → TypeScript interface
// HeroBase → LeadBase
// HeroCreate → LeadCreate
// etc.

export interface LeadBase {
  name: string;
  age: number | null;
}

export interface LeadCreate extends LeadBase {
  secret_name: string;
}

export interface LeadUpdate {
  name?: string;
  age?: number | null;
  secret_name?: string;
}

export interface Lead extends LeadBase {
  id: number;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}
```

### 4.5 Custom Hook Pattern

```typescript
// src/hooks/useLeads.ts
import { useState, useEffect } from "react";
import { leadsApi } from "../api/leads";
import type { Lead } from "../types/api";

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    leadsApi.list()
      .then((res) => setLeads(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { leads, loading, error };
}
```

---

## 5. Docker Compose

### 5.1 Multi-Service Setup

**Source:** https://docs.docker.com/compose/compose-file/05-services/

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development  # Multi-stage build
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/src:/app/src  # Hot reload
    depends_on:
      backend:
        condition: service_healthy
    environment:
      - VITE_API_URL=http://backend:8000/api/v1

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    ports:
      - "8000:8000"
    volumes:
      - ./backend/app:/app/app  # Hot reload
      - ./backend/data.db:/app/data.db  # SQLite persistence
    environment:
      - DATABASE_URL=sqlite:////app/data.db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

### 5.2 Health Check Configuration

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

**Health check endpoint in FastAPI:**

```python
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### 5.3 Volume Mounts for SQLite + Hot Reload

```yaml
services:
  backend:
    volumes:
      # Source code for hot reload (bind mount)
      - ./backend/app:/app/app
      # SQLite database file (bind mount for persistence)
      - ./backend/data.db:/app/data.db
      # Or use a named volume for database
      # - db-data:/app/data.db

  frontend:
    volumes:
      # Source code for hot reload
      - ./frontend/src:/app/src
      # Vite config
      - ./frontend/vite.config.ts:/app/vite.config.ts

# Named volumes for persistent data
volumes:
  db-data:
```

**Dockerfile patterns (multi-stage):**

```dockerfile
# backend/Dockerfile
FROM python:3.10-slim AS base
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM base AS development
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM base AS production
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS development
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM base AS build
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
```

---

## Quick Reference Summary

| Framework | Key Version | Critical Pattern |
|-----------|-------------|------------------|
| FastAPI | 0.110+ | `APIRouter` with prefix/tags, `Depends` with `Annotated`, `CORSMiddleware` with explicit origins |
| SQLAlchemy | 2.x | `DeclarativeBase` + `Mapped` + `mapped_column`, not legacy `declarative_base()` |
| Pydantic | 2.x | `ConfigDict(from_attributes=True)`, `model_config`, `model_dump()` |
| Alembic | 1.x | `render_as_batch=True` for SQLite, `--autogenerate` with metadata |
| React Router | v6+ | `createBrowserRouter`, `RouterProvider`, nested routes |
| Axios | 1.x | `interceptors`, `withCredentials: true` for cookie auth |
| Docker Compose | v2+ | `depends_on` with `condition: service_healthy`, bind mounts for hot reload |

---

*Research compiled: August 17, 2026*
*Sources: Official FastAPI, SQLAlchemy, Alembic, React Router, and Docker documentation*
