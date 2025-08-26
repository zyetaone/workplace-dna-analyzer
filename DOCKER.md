# Docker Deployment Guide

This document describes the Docker configuration for the PPT App, including solutions for Alpine Linux compatibility and native module issues.

## Key Features

- **Multi-stage build** for optimized production images
- **Alpine Linux compatibility** with native module support
- **Automatic fallback** from libsql to better-sqlite3 for Docker environments
- **Security hardening** with non-root user and minimal dependencies
- **Health checks** for container monitoring
- **Signal handling** with dumb-init

## Quick Start

```bash
# Build the image
docker build -t ppt-app .

# Run the container
docker run -d \
  --name ppt-app \
  -p 3000:3000 \
  -v ppt-data:/app/data \
  ppt-app

# Check health
curl http://localhost:3000/health
```

## Docker Configuration

### Build Stages

1. **deps**: Installs build dependencies and compiles native modules
2. **builder**: Builds the SvelteKit application
3. **production**: Minimal runtime with only necessary dependencies

### Native Module Handling

The Dockerfile addresses the "Could not dynamically require @libsql/linux-x64-musl" error by:

1. **Installing build tools** for native compilation (python3, make, g++, gcc)
2. **Adding better-sqlite3** as a runtime fallback dependency
3. **Rebuilding native modules** for Alpine Linux (musl) compatibility
4. **Platform-specific compilation** with proper target settings

### Environment Variables

- `USE_BETTER_SQLITE3=true`: Forces use of better-sqlite3 in Alpine
- `DOCKER_ENV=true`: Enables Docker-specific optimizations
- `DATABASE_URL`: SQLite database file path (default: `/app/data/local.db`)

### Database Fallback Logic

The application automatically detects the environment and chooses the best database client:

1. **Alpine Linux/Docker**: Prioritizes better-sqlite3 for compatibility
2. **Native module error**: Automatically falls back to better-sqlite3
3. **Remote databases**: Uses libsql for Turso/remote SQLite connections

## Production Deployment

### Using Docker Compose

```yaml
version: '3.8'
services:
  ppt-app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ppt-data:/app/data
    environment:
      - NODE_ENV=production
      - DATABASE_URL=/app/data/local.db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped

volumes:
  ppt-data:
```

### Environment-Specific Builds

```bash
# For ARM64 (Apple Silicon)
docker build --platform linux/arm64 -t ppt-app:arm64 .

# For AMD64 (Intel/AMD)
docker build --platform linux/amd64 -t ppt-app:amd64 .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -t ppt-app:latest .
```

## Troubleshooting

### Common Issues

1. **Native module errors**: 
   - The app automatically falls back to better-sqlite3
   - Check logs for "Database initialization summary"

2. **Permission errors**:
   - Ensure data volume has correct permissions
   - Container runs as non-root user `node`

3. **Health check failures**:
   - Check `/health` endpoint responds with status 200
   - Verify database initialization completed

### Debug Mode

```bash
# Run with debug output
docker run -it --rm \
  -e NODE_ENV=development \
  -p 3000:3000 \
  ppt-app

# Check database initialization
docker logs ppt-app | grep "Database initialization"
```

### Performance Monitoring

```bash
# Container stats
docker stats ppt-app

# Health check status
docker inspect ppt-app --format='{{.State.Health.Status}}'

# Database status
curl http://localhost:3000/health | jq '.database'
```

## Security Features

- **Non-root execution**: Runs as `node` user
- **Minimal attack surface**: Alpine Linux with minimal packages
- **Signal handling**: Proper shutdown with dumb-init
- **Health checks**: Container self-monitoring
- **No secrets in image**: Environment variables for sensitive data

## Volume Management

```bash
# Create named volume
docker volume create ppt-data

# Backup database
docker run --rm \
  -v ppt-data:/source:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/ppt-backup.tar.gz -C /source .

# Restore database
docker run --rm \
  -v ppt-data:/dest \
  -v $(pwd):/backup:ro \
  alpine tar xzf /backup/ppt-backup.tar.gz -C /dest
```

## Monitoring and Logging

The application provides structured logging and health endpoints:

- **Health**: `GET /health` - Container health status
- **Logs**: JSON structured logs with database client info
- **Metrics**: Database initialization and fallback status

Example health response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-XX",
  "version": "0.0.2",
  "platform": "linux",
  "docker": true,
  "database": {
    "url": "configured",
    "useFallback": true
  }
}
```