# 🚀 Quick Start Guide - Setting Up on a New Machine

This guide will help you clone and run the CSL Management System on any machine using Docker.

## ✅ Prerequisites

Before you begin, ensure you have:

- **Docker Desktop** installed and running
  - Windows: https://docs.docker.com/desktop/install/windows-install/
  - Mac: https://docs.docker.com/desktop/install/mac-install/
  - Linux: https://docs.docker.com/desktop/install/linux-install/
- **Git** installed
- **Internet connection** (for pulling Docker images)

## 📋 Step-by-Step Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/Zerocode-sean/csl-management-system.git

# Navigate to project directory
cd csl-management-system

# Verify you're on the main branch
git branch
```

### Step 2: Create Environment Files

The project needs `.env` files for configuration. Create them from the examples:

#### Backend Environment File

```bash
# Windows PowerShell
Copy-Item backend\.env.example backend\.env

# Linux/Mac
cp backend/.env.example backend/.env
```

**Edit `backend/.env`** with your preferred text editor and set:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration (must match docker-compose.yml)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=csl_database
DB_USER=csl_user
DB_PASSWORD=csl_password

# JWT Configuration (IMPORTANT: Change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

#### Frontend Environment File

```bash
# Windows PowerShell
Copy-Item frontend\.env.example frontend\.env

# Linux/Mac
cp frontend/.env.example frontend/.env
```

**Edit `frontend/.env`**:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=CSL Management System
```

### Step 3: Start Docker Services

```bash
# Make sure Docker Desktop is running

# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up -d

# View logs to ensure everything started correctly
docker-compose logs -f
```

**Expected Output:**
```
✓ Container csl-postgres-dev     Started
✓ Container csl-backend-dev-v3   Started
✓ Container csl-frontend-dev-v3  Started
```

### Step 4: Wait for Services to Initialize

The services need time to start up:

- **PostgreSQL**: ~10-15 seconds
- **Backend**: ~20-30 seconds (compiling TypeScript)
- **Frontend**: ~30-40 seconds (Vite build)

**Check service health:**

```bash
# Check all containers are running
docker ps

# Check backend health
curl http://localhost:5000/health

# Check frontend
curl http://localhost:3000
```

### Step 5: Initialize Database (First Time Only)

The database schema should auto-initialize, but if needed:

```bash
# Connect to PostgreSQL container
docker exec -it csl-postgres-dev psql -U csl_user -d csl_database

# Verify tables exist
\dt

# You should see tables: admins, students, courses, certificates, etc.
# Exit with: \q
```

### Step 6: Access the Application

Open your browser and navigate to:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

**Default Admin Login:**
- Email: `admin@csl.com`
- Password: `Admin@123`

## 🔍 Troubleshooting Common Issues

### Issue 1: Port Already in Use

**Error**: `Bind for 0.0.0.0:5000 failed: port is already allocated`

**Solution**:
```bash
# Windows - Find and kill process using port
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9

# Or change the port in docker-compose.yml
ports:
  - "5001:5000"  # Use different host port
```

### Issue 2: Database Connection Failed

**Error**: `Error: connect ECONNREFUSED`

**Solution**:
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs csl-postgres-dev

# Restart PostgreSQL container
docker-compose restart postgres

# Wait 15 seconds, then restart backend
docker-compose restart backend
```

### Issue 3: Frontend Can't Connect to Backend

**Error**: `Network Error` or `ERR_CONNECTION_REFUSED`

**Solution**:

1. **Check backend is running**:
   ```bash
   docker logs csl-backend-dev-v3
   ```

2. **Verify backend health**:
   ```bash
   curl http://localhost:5000/health
   ```

3. **Check `.env` files match**:
   - `backend/.env` → `PORT=5000`
   - `frontend/.env` → `VITE_API_URL=http://localhost:5000`

4. **Restart containers**:
   ```bash
   docker-compose restart
   ```

### Issue 4: Docker Build Fails

**Error**: `failed to solve: process "/bin/sh -c npm install" did not complete successfully`

**Solution**:
```bash
# Clear Docker cache and rebuild
docker-compose down
docker system prune -a --volumes
docker-compose build --no-cache
docker-compose up -d
```

### Issue 5: Database Schema Not Created

**Solution**:
```bash
# Stop all services
docker-compose down -v  # WARNING: This deletes all data!

# Start fresh
docker-compose up -d

# Or manually run schema
docker exec -i csl-postgres-dev psql -U csl_user -d csl_database < database/schemas/complete_schema.sql
```

## 🔄 Common Commands

```bash
# View all running containers
docker ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker logs csl-backend-dev-v3 -f
docker logs csl-frontend-dev-v3 -f
docker logs csl-postgres-dev -f

# Restart a service
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build

# Execute command in container
docker exec -it csl-backend-dev-v3 npm list
docker exec -it csl-postgres-dev psql -U csl_user -d csl_database
```

## 📊 Verification Checklist

After setup, verify everything works:

- [ ] Docker containers are running (`docker ps`)
- [ ] Backend health endpoint responds: http://localhost:5000/health
- [ ] Frontend loads: http://localhost:3000
- [ ] Can login with admin credentials
- [ ] Dashboard displays (even with 0 data)
- [ ] Can navigate to Students, Courses, Certificates pages
- [ ] Can access Settings page
- [ ] Certificate verification page works: http://localhost:3000/verify

## 🆘 Getting Help

If you're still having issues:

1. **Check Docker Desktop** - Ensure it's running and not showing errors
2. **Check logs** - Run `docker-compose logs -f` and look for errors
3. **Verify files** - Ensure `.env` files exist in both `backend/` and `frontend/`
4. **Check firewall** - Ensure ports 3000, 5000, and 5432 aren't blocked
5. **Restart Docker Desktop** - Sometimes a full restart helps
6. **Fresh start**:
   ```bash
   docker-compose down -v
   docker system prune -a
   docker-compose up -d
   ```

## 📝 Notes

- **First run**: May take 5-10 minutes for all images to download and build
- **Data persistence**: Data is stored in Docker volumes and persists across restarts
- **Clean slate**: Use `docker-compose down -v` to delete all data and start fresh
- **Production**: Use `docker-compose.prod.yml` for production deployment

## ✅ Success!

If you can:
1. ✅ Access http://localhost:3000
2. ✅ Login with admin credentials
3. ✅ See the dashboard

**You're all set! 🎉**

---

**Repository**: https://github.com/Zerocode-sean/csl-management-system
**Documentation**: See README.md for full documentation
**Issues**: Open an issue on GitHub if you encounter problems
