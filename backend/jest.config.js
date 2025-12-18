module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Root directory for tests
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // TypeScript configuration
  preset: 'ts-jest',
  
  // ts-jest configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
    '**/tests/**/*.test.+(ts|tsx|js)'
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
    'cobertura',
    'html'
  ],
  
  // Test reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setupTests.ts'],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.ts',
  
  // Test timeout (10 seconds for integration tests)
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Detect open handles (helps find async issues)
  detectOpenHandles: false,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Module name mapper for path aliases (if you use them)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  }
};
