# Docker Setup Guide - CSL Management System

This guide explains how to run the CSL Management System using Docker in both development and production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Git**: For cloning the repository

Verify installations:
```bash
docker --version
docker-compose --version
```

## Quick Start

### Development Mode (Hot Reload Enabled)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd csl-management-system
   ```

2. **Set up environment variables**
   ```bash
   cp .env.dev .env
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api/v1
   - API Documentation: http://localhost:5000/api-docs
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

5. **View logs**
   ```bash
   docker-compose logs -f
   ```

6. **Stop the application**
   ```bash
   docker-compose down
   ```

## Development Environment

### Architecture
The development setup uses:
- `Dockerfile.dev` for both backend and frontend
- Volume mounts for hot reload
- All dev dependencies installed
- Nodemon for backend auto-restart
- Vite HMR for frontend instant updates

### Starting Development

```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up backend

# Rebuild after dependency changes
docker-compose up --build

# Run in background
docker-compose up -d
```

### Making Code Changes

Code changes are automatically detected:
- **Backend**: Nodemon restarts the server automatically
- **Frontend**: Vite HMR updates the browser instantly

### Running Database Migrations

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Seed database
docker-compose exec backend npm run seed
```

### Accessing Container Shells

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# PostgreSQL shell
docker-compose exec postgres psql -U csl_user -d csl_database
```

## Production Environment

### Architecture
The production setup uses:
- Multi-stage Docker builds for optimized images
- Nginx reverse proxy for routing
- No source code volume mounts
- Only production dependencies
- Resource limits and health checks

### Preparing for Production

1. **Create production environment file**
   ```bash
   cp .env.prod.example .env.prod
   ```

2. **Generate secure secrets**
   ```bash
   # Generate JWT secret
   openssl rand -base64 32

   # Generate refresh token secret
   openssl rand -base64 32
   ```

3. **Update `.env.prod` with:**
   - Strong database passwords
   - Generated JWT secrets
   - Production domain names
   - Email configuration (if needed)

### Starting Production

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Accessing via Nginx

All traffic goes through Nginx on port 80:
- Frontend: http://localhost/
- Backend API: http://localhost/api/
- Health Check: http://localhost/health

### SSL/HTTPS Setup (Optional)

1. **Add SSL certificates**
   ```bash
   # Place certificates in docker/nginx/ssl/
   cp cert.pem docker/nginx/ssl/
   cp key.pem docker/nginx/ssl/
   ```

2. **Update Nginx configuration**
   Edit `docker/nginx/conf.d/default.conf` and uncomment SSL lines

3. **Restart Nginx**
   ```bash
   docker-compose -f docker-compose.prod.yml restart nginx
   ```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_USER` | PostgreSQL username | `csl_user` |
| `DB_PASSWORD` | PostgreSQL password | `secure_password` |
| `DB_NAME` | Database name | `csl_database` |
| `JWT_SECRET` | JWT signing secret | Generated with openssl |
| `JWT_REFRESH_SECRET` | Refresh token secret | Generated with openssl |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `JWT_EXPIRES_IN` | Access token lifetime | `7d` (dev), `15m` (prod) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `30d` (dev), `7d` (prod) |
| `VITE_API_URL` | Frontend API URL | `http://localhost:5000/api` |

### Environment Files

- `.env.example` - Template with all variables
- `.env.dev` - Development defaults (included in repo)
- `.env.prod.example` - Production template
- `.env` - Your local environment (gitignored)

## Troubleshooting

### Container Won't Start

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs <service-name>

# Check for port conflicts
netstat -ano | findstr :5000  # Windows
lsof -i :5000                  # Linux/Mac
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker-compose exec postgres pg_isready

# Check database exists
docker-compose exec postgres psql -U csl_user -l

# Recreate database
docker-compose down -v
docker-compose up -d postgres
```

### Frontend Can't Reach Backend

1. Check `VITE_API_URL` in `.env`
2. Verify backend is running: `curl http://localhost:5000/api/v1/health`
3. Check browser console for CORS errors

### Hot Reload Not Working

```bash
# Restart the service
docker-compose restart backend

# Rebuild without cache
docker-compose up --build --force-recreate backend
```

### Permission Errors

```bash
# Fix file permissions (Linux/Mac)
sudo chown -R $USER:$USER .

# Reset volumes
docker-compose down -v
docker-compose up -d
```

### Clear Everything and Start Fresh

```bash
# Stop all containers
docker-compose down -v

# Remove all images
docker rmi $(docker images -q csl-*)

# Rebuild and start
docker-compose up --build
```

## Common Commands Reference

```bash
# Development
docker-compose up                          # Start dev environment
docker-compose up -d                       # Start in background
docker-compose down                        # Stop and remove containers
docker-compose down -v                     # Stop and remove volumes too
docker-compose logs -f                     # Follow logs
docker-compose exec backend npm test       # Run backend tests

# Production
docker-compose -f docker-compose.prod.yml build    # Build prod images
docker-compose -f docker-compose.prod.yml up -d    # Start prod environment
docker-compose -f docker-compose.prod.yml ps       # Check status
docker-compose -f docker-compose.prod.yml down     # Stop prod environment

# Maintenance
docker system prune -a                     # Clean up unused Docker resources
docker volume prune                        # Remove unused volumes
```

## Next Steps

- Configure SSL certificates for HTTPS
- Set up automated backups for PostgreSQL
- Configure monitoring and logging
- Set up CI/CD pipeline
- Review security settings

## Support

For issues and questions, please refer to the main README.md or create an issue in the repository.
