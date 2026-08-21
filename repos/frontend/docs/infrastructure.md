# Infrastructure Overview

This project is a full-stack evaluation system with frontend (React) and backend (NestJS) components.

## Environments

- **Development**: Frontend runs on localhost:3000, Backend runs on localhost:8000
- **Production**: Docker containers with nginx reverse proxy

## Core Services and Dependencies

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Axios** for API calls
- **Custom CSS** with CSS variables for theming

### Backend
- **NestJS** with TypeScript
- **TypeORM** for database operations
- **PostgreSQL** database
- **JWT** authentication
- **Docker** for containerization

### Shared
- **Internationalization** (i18n) with Portuguese and English support

## Deployment and Operations

- **Frontend**: Built with Vite, served by nginx in production
- **Backend**: REST API with Docker containers
- **Database**: PostgreSQL with migrations
- **Authentication**: JWT tokens with cookie-based auth

## Known Constraints and Risks

- Database schema changes require manual migrations
- API responses must match frontend TypeScript interfaces
- Authentication state is managed via cookies
- Docker networking requires proper proxy configuration