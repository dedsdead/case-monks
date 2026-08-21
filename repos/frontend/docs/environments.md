# Environment Matrix

## Development Environment

### Frontend
- **Host**: localhost:3000
- **Dev Server**: Vite with hot reload
- **API Proxy**: `/api` → `http://localhost:8000`
- **Build Tool**: Vite with TypeScript
- **Testing**: Vitest with React Testing Library

### Backend
- **Host**: localhost:8000
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL (local Docker container)
- **Port**: 8000
- **CORS**: Enabled for localhost:3000

### Database
- **Host**: localhost (via Docker)
- **Port**: 5432
- **Database**: `evaluations`
- **User**: `postgres`
- **Password**: `postgres`

## Production Environment

### Frontend
- **Container**: nginx:alpine
- **Port**: 80
- **Build**: Vite production build
- **Static Files**: Served from `/dist`
- **API Proxy**: `/api` → backend service

### Backend
- **Container**: Node.js with NestJS
- **Port**: 8000
- **Database**: Production PostgreSQL
- **Environment Variables**: Database credentials, JWT secrets
- **Health Check**: `/health` endpoint

### Database
- **Service**: Managed PostgreSQL (AWS RDS or similar)
- **Connection**: Environment variables
- **Backups**: Automated daily backups
- **Monitoring**: Performance metrics and alerts

## Configuration and Secrets Boundaries

### Frontend Configuration
```typescript
// Vite config
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: process.env.API_URL || 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

### Backend Configuration
```typescript
// Environment variables required
DATABASE_URL=postgresql://user:pass@host:port/database
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
```

## Deployment Differences

### Development vs Production
- **CORS**: Development allows all origins, production restricts to specific domains
- **Error Handling**: Development shows detailed errors, production shows generic messages
- **Logging**: Development logs detailed information, production logs errors only
- **Performance**: Production has minified assets, caching, and CDN

### Build Process
- **Development**: Fast builds with source maps
- **Production**: Optimized builds with minification and tree shaking
- **Docker**: Multi-stage builds for smaller production images

## Operational Access

### Development Access
- **Code Access**: Direct file system access
- **Database Access**: Direct Docker container access
- **Monitoring**: Console logs and browser dev tools
- **Debugging**: Full stack traces and detailed error messages

### Production Access
- **Code Access**: Git repository with CI/CD pipeline
- **Database Access**: Restricted via connection pooling and read replicas
- **Monitoring**: Application logs, metrics, and health checks
- **Debugging**: Error aggregation and performance monitoring tools