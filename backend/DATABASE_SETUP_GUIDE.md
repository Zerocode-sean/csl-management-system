# PostgreSQL Database Setup Guide for CSL Management System

## 🎯 Overview
This guide will help you set up a real PostgreSQL database for the CSL Management System, replacing the mock data with persistent database storage.

## 📋 Prerequisites Checklist

### 1. PostgreSQL Installation
- [ ] PostgreSQL 12+ installed on your system
- [ ] PostgreSQL service running
- [ ] `psql` command available in PATH
- [ ] Default `postgres` user accessible

### Windows Installation Options:
```bash
# Option 1: Official installer
# Download from: https://www.postgresql.org/download/windows/

# Option 2: Using winget
winget install PostgreSQL.PostgreSQL

# Option 3: Using chocolatey
choco install postgresql
```

## 🚀 Step-by-Step Setup

### Step 1: Verify PostgreSQL Installation
```bash
# Check PostgreSQL version
psql --version

# Check if service is running
sc query postgresql*

# Start PostgreSQL service if needed
net start postgresql-x64-16
```

### Step 2: Update Environment Variables
Edit your `.env` file in the backend directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=csl_database
DB_USER=csl_user
DB_PASSWORD=csl_password

# PostgreSQL Admin (for setup only)
POSTGRES_PASSWORD=your_postgres_admin_password
```

### Step 3: Run Automated Database Setup
```bash
# Navigate to backend directory
cd c:\Users\Administrator\OneDrive\Desktop\CSL\csl-management-system\backend

# Run the automated setup script
node setup-database.js
```

### Step 4: Manual Setup (if automated setup fails)

#### Create Database User:
```sql
-- Connect as postgres user
psql -U postgres -d postgres

-- Create CSL user
CREATE USER csl_user WITH PASSWORD 'csl_password';
ALTER USER csl_user CREATEDB;

-- Create database
CREATE DATABASE csl_database OWNER csl_user;
GRANT ALL PRIVILEGES ON DATABASE csl_database TO csl_user;

-- Exit postgres session
\q
```

#### Run Schema Creation:
```bash
# Apply the enhanced schema
psql -U csl_user -d csl_database -f ../database/schemas/enhanced_schema.sql

# Load development seed data
psql -U csl_user -d csl_database -f ../database/seeds/dev_seed.sql
```

### Step 5: Start Real Database Server
```bash
# Start the enhanced server with real database integration
node database-production-server.js
```

### Step 6: Test Database Integration
```bash
# Run comprehensive database tests
node test-database-integration.js
```

## 🔍 Verification Steps

### 1. Database Connection Test
```bash
# Test connection manually
psql -U csl_user -d csl_database -c "SELECT version();"
```

### 2. Table Verification
```sql
-- Check if all tables exist
\dt

-- Verify table contents
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM courses;
SELECT COUNT(*) FROM certificates;
```

### 3. API Endpoint Testing
```bash
# Test health endpoint (should show database status)
curl http://localhost:5001/health

# Test students API (should show source: "database")
curl http://localhost:5001/api/students
```

## 📊 Expected Results

### Database Tables Created:
- ✅ `users` - System users and authentication
- ✅ `students` - Student information and profiles
- ✅ `courses` - Available courses and programs
- ✅ `enrollments` - Student course enrollments
- ✅ `certificates` - Issued certificates and credentials
- ✅ `audit_logs` - System activity tracking

### Sample Data Loaded:
- ✅ 3+ Students with different statuses
- ✅ 3+ Courses across various categories
- ✅ 3+ Certificates with verification codes
- ✅ Admin user accounts
- ✅ Sample enrollment records

### API Endpoints Working:
- ✅ GET /api/students (with pagination, search)
- ✅ GET /api/students/:id
- ✅ POST /api/students (create new)
- ✅ GET /api/courses
- ✅ GET /api/certificates
- ✅ GET /api/verification/verify/:code

## 🛠️ Troubleshooting

### Common Issues:

#### 1. "PostgreSQL not found"
```bash
# Add PostgreSQL to PATH
# Typical location: C:\Program Files\PostgreSQL\16\bin
```

#### 2. "Connection refused"
```bash
# Check if PostgreSQL service is running
sc query postgresql*

# Start the service
net start postgresql-x64-16
```

#### 3. "Authentication failed"
```bash
# Check/reset postgres password
# Use pgAdmin or:
psql -U postgres -c "ALTER USER postgres PASSWORD 'newpassword';"
```

#### 4. "Database does not exist"
```bash
# Recreate database manually
psql -U postgres -c "CREATE DATABASE csl_database OWNER csl_user;"
```

#### 5. "Permission denied"
```bash
# Grant proper permissions
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE csl_database TO csl_user;"
```

## 📈 Performance Optimization

### Connection Pooling (already configured):
```javascript
// In database-production-server.js
const pool = new Pool({
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000 // Connection timeout
});
```

### Indexing (included in schema):
- Primary keys on all tables
- Unique indexes on email fields
- Indexes on frequently queried fields

## 🔐 Security Considerations

### 1. Database User Permissions
- ✅ Separate user for application (not postgres admin)
- ✅ Limited to specific database only
- ✅ No superuser privileges

### 2. Connection Security
- ✅ Password authentication
- ✅ SSL in production (configurable)
- ✅ Connection timeouts configured

### 3. Input Validation
- ✅ Parameterized queries (SQL injection prevention)
- ✅ Input validation middleware
- ✅ Error handling without data leakage

## 📋 Post-Setup Checklist

After successful setup, verify:

- [ ] PostgreSQL service is running
- [ ] Database `csl_database` exists
- [ ] User `csl_user` has proper permissions
- [ ] All tables created successfully
- [ ] Sample data loaded
- [ ] Server starts without errors
- [ ] Health endpoint shows "database: connected"
- [ ] API endpoints return real data (not mock)
- [ ] CRUD operations work correctly

## 🎉 Success Indicators

When everything is working correctly:

1. **Server Output:**
```
✅ Database connected successfully!
   Timestamp: 2025-10-25T...
   PostgreSQL Version: PostgreSQL 16.x
✅ Found 6 tables:
   - audit_logs
   - certificates
   - courses
   - enrollments
   - students
   - users
```

2. **Health Check Response:**
```json
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "type": "PostgreSQL",
    "info": {
      "timestamp": "2025-10-25T...",
      "version": "PostgreSQL 16.x"
    }
  }
}
```

3. **API Response Includes:**
```json
{
  "success": true,
  "data": [...],
  "source": "database"  // Not "mock"
}
```

## 🚀 Next Steps

Once database setup is complete:

1. **Test All Endpoints** - Verify CRUD operations work
2. **Load Production Data** - Import real student/course data
3. **Configure Backups** - Set up regular database backups
4. **Monitor Performance** - Check query performance and optimize
5. **Frontend Integration** - Connect React frontend to real API
6. **Production Deployment** - Prepare for production environment

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the test output from `test-database-integration.js`
3. Check PostgreSQL logs
4. Verify environment variables in `.env`
5. Ensure all prerequisites are met

---

**Ready to proceed with real database integration!** 🎯
