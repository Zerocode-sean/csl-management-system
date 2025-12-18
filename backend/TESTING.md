# Local Testing Guide

## Quick Start

### 1. Install Dependencies (if not already done)
```bash
npm install
```

### 2. Setup Test Environment
Make sure you have `.env.test` file (already created from `.env.test.example`)

Update the database password in `.env.test` to match your PostgreSQL password.

### 3. Run Tests

#### Run All Tests
```bash
npm test
```

#### Run Only Unit Tests (Fast, No Database)
```bash
npm run test:unit
```

#### Run Integration Tests (With Database)
```bash
npm run test:integration
```

#### Run API Tests (Full HTTP Testing)
```bash
npm run test:api
```

#### Run Tests with Coverage Report
```bash
npm run test:coverage
```

#### Run Tests for CI/Jenkins (JUnit Output)
```bash
npm run test:ci
```

## Test Structure

```
backend/tests/
├── setup/
│   ├── globalSetup.ts          # Creates test database before all tests
│   ├── globalTeardown.ts       # Drops test database after all tests
│   ├── setupTests.ts           # Loads environment before each test file
│   ├── testDatabase.ts         # Database utilities and helpers
│   └── mockData.ts             # Test fixtures and mock data
├── utils/
│   └── testHelpers.ts          # JWT tokens, PDF validation, etc.
├── unit/
│   └── certificateService.test.ts  # Unit tests (no database)
├── integration/
│   └── certificate.integration.test.ts  # Integration tests (with database)
└── api/
    └── certificates.api.test.ts  # API endpoint tests (HTTP)
```

## What Gets Tested

### Unit Tests
- ✅ CSL number format validation
- ✅ CSL number parsing
- ✅ Verification hash generation
- ✅ Edge cases and error handling

### Integration Tests
- ✅ Certificate generation with database
- ✅ Unique CSL number generation
- ✅ Sequential number incrementing
- ✅ Concurrent certificate generation
- ✅ Certificate verification
- ✅ Certificate revocation
- ✅ Certificate listing and filtering

### API Tests
- ✅ POST /api/v1/certificates/generate
- ✅ GET /api/v1/certificates/:id
- ✅ GET /api/v1/certificates/:id/download (PDF)
- ✅ GET /api/v1/certificates/verify/:cslNumber
- ✅ PATCH /api/v1/certificates/:id/revoke
- ✅ GET /api/v1/certificates (list with pagination)
- ✅ GET /api/v1/certificates/stats
- ✅ Authentication and authorization
- ✅ Input validation and error responses

## Test Database

The tests use a separate test database (`csl_test_db`) that:
- ✅ Is created automatically before tests run
- ✅ Is dropped automatically after tests finish
- ✅ Does NOT affect your development database
- ✅ Uses the same schema as production

## Coverage Report

After running `npm run test:coverage`, open:
```
backend/coverage/lcov-report/index.html
```

## Troubleshooting

### Error: "Cannot connect to database"
- Check PostgreSQL is running
- Verify credentials in `.env.test`
- Make sure DB_PASSWORD matches your PostgreSQL password

### Error: "Port already in use"
- Tests run on port 5099 (different from dev)
- Check no other service is using this port

### Tests hanging
- Make sure to use `--runInBand` flag (already in scripts)
- This runs tests sequentially to avoid database conflicts

### PDF generation errors
- Puppeteer may need additional setup on some systems
- Check `test_certificates/` directory is created

## Next Steps

Once all tests pass locally:
1. ✅ Tests are ready for Jenkins CI/CD
2. ✅ Use `npm run test:ci` in Jenkins pipeline
3. ✅ JUnit results in `test-results/junit.xml`
4. ✅ Coverage report in `coverage/`
