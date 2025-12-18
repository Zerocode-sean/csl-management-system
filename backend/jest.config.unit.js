module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Root directory for tests
  roots: ['<rootDir>/tests/unit'],
  
  // TypeScript configuration
  preset: 'ts-jest',
  
  // ts-jest configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Test match patterns
  testMatch: [
    '**/tests/unit/**/*.test.+(ts|tsx|js)'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
  ],
  
  // NO global setup/teardown for unit tests - they don't need database!
  // setupFilesAfterEnv: ['<rootDir>/tests/setup/setupTests.ts'],
  
  // Test timeout
  testTimeout: 5000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Module name mapper
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // JUnit reporter for CI/CD
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true,
    }],
  ],
};
