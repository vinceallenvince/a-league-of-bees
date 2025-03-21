/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  // Use node environment for server tests and jsdom for client tests
  testEnvironment: process.env.TEST_ENV === 'server' ? 'node' : 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts',
    '<rootDir>/jest.setup.js'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true
    }]
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx',
    '<rootDir>/client/src/**/*.test.ts',
    '<rootDir>/client/src/**/*.test.tsx'
  ],
  // Ignoring performance tests by default
  testPathIgnorePatterns: [
    'query-performance\\.test\\.ts$'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  // Default timeout that can be overridden by JEST_TIMEOUT env variable
  testTimeout: process.env.JEST_TIMEOUT ? parseInt(process.env.JEST_TIMEOUT) : 30000,
  // Force exit after tests complete
  forceExit: true,
  // Detect open handles that might be preventing Jest from exiting
  detectOpenHandles: true
}
