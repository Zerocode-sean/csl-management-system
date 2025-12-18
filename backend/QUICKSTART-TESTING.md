# Quick Start - Running Tests

## ✅ Unit Tests (No Setup Required)

```bash
cd backend
npm run test:unit
```

**Output:**
```
PASS tests/unit/certificateService.test.ts
  ✓ 7 tests passed
Time: ~5 seconds
```

---

## 🐳 Integration Tests (Docker Required)

### 1. Start PostgreSQL with Docker:
```bash
# From project root
docker-compose up postgres -d
```

### 2. Wait for database to be ready:
```bash
docker-compose ps
# Wait until postgres shows "healthy"
```

### 3. Run integration tests:
```bash
cd backend
npm run test:integration
```

### 4. Stop database when done:
```bash
docker-compose down
```

---

## 📊 Test Commands Summary

| Command | Database | What It Tests |
|---------|----------|---------------|
| `npm run test:unit` | ❌ No | CSL validation, parsing (7 tests) |
| `npm run test:integration` | ✅ Yes | Certificate generation, verification, revocation (15+ tests) |
| `npm run test:coverage` | ✅ Yes | All tests + coverage report |
| `npm test` | ✅ Yes | All tests |

---

## 🔧 Troubleshooting

### Unit tests fail
- Make sure you're in `backend/` directory
- Run: `npm install` if deps are missing

### Integration tests can't connect to DB
```bash
# Check if Docker is running
docker ps

# Start PostgreSQL
docker-compose up postgres -d

# Check logs
docker-compose logs postgres
```

### Port 5432 already in use
```bash
# Stop conflicting service
docker-compose down

# Or use different port in .env.test
```

---

## 🎯 What Was Fixed

- ✅ Created `jest.config.unit.js` for unit tests
- ✅ Unit tests no longer require database
- ✅ Updated `package.json` test scripts
- ✅ All 7 unit tests passing

## 📁 Test Files

```
backend/tests/
├── unit/certificateService.test.ts      ✅ PASSING (7 tests)
├── integration/certificate.integration.test.ts  ⏸️  Needs Docker
└── api/certificates.api.test.ts         📝 Placeholder
```
