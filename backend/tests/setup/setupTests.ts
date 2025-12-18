import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase } from '../../src/database/connection';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Initialize database connection for integration tests
beforeAll(async () => {
  await connectDatabase();
});

// Mock console methods for cleaner test output (optional)
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: console.error, // Keep errors visible
};
