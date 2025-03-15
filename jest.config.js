/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
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
  // Ignore database integration tests by default
  testPathIgnorePatterns: [
    '<rootDir>/tests/server/features/tournament/integration.test.ts',
    '<rootDir>/tests/server/features/tournament/tournament-participants.test.ts',
    '<rootDir>/tests/server/features/tournament/tournament-scores.test.ts',
    '<rootDir>/tests/server/features/tournament/notifications.test.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  }
}
