/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/lib/utils$': '<rootDir>/tests/__mocks__/@/lib/utils.ts',
    '^@/lib/date-utils$': '<rootDir>/tests/__mocks__/@/lib/date-utils.ts',
    '^@/core/ui/card$': '<rootDir>/tests/__mocks__/@/core/ui/card.tsx',
    '^@/core/ui/form$': '<rootDir>/tests/__mocks__/@/core/ui/form.tsx',
    '^@/core/ui/button$': '<rootDir>/tests/__mocks__/@/core/ui/button.tsx',
    '^@/core/ui/input$': '<rootDir>/tests/__mocks__/@/core/ui/input.tsx',
    '^@/core/ui/label$': '<rootDir>/tests/__mocks__/@/core/ui/label.tsx',
    '^@/core/ui/select$': '<rootDir>/tests/__mocks__/@/core/ui/select.tsx',
    '^@/features/tournament/components/tournament/TournamentForm$': '<rootDir>/tests/client/src/@/features/tournament/components/tournament/TournamentForm.tsx',
    '^@/features/tournament/components/tournament/TournamentStatus$': '<rootDir>/tests/client/src/@/features/tournament/components/tournament/TournamentStatus.tsx',
    '^@/features/tournament/components/tournament/TournamentFilters$': '<rootDir>/tests/client/src/@/features/tournament/components/tournament/TournamentFilters.tsx',
    '^@/features/tournament/components/tournament/TournamentCard$': '<rootDir>/client/src/features/tournament/components/tournament/TournamentCard.tsx',
    '^@/features/tournament/components/score/ScoreHistory$': '<rootDir>/tests/client/src/@/features/tournament/components/score/ScoreHistory.tsx',
    '^@/features/tournament/api/tournamentApi$': '<rootDir>/tests/client/src/@/features/tournament/api/tournamentApi.ts',
    '^@/features/tournament/hooks/useTournaments$': '<rootDir>/tests/client/src/@/features/tournament/hooks/useTournaments.ts',
    '^@/features/tournament/hooks/useDashboardData$': '<rootDir>/tests/client/src/@/features/tournament/hooks/useDashboardData.ts',
    '^@/features/tournament/types$': '<rootDir>/tests/client/src/@/features/tournament/types.ts',
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  moduleDirectories: ['node_modules', '<rootDir>', 'tests'],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  testMatch: [
    '<rootDir>/tests/client/**/*.test.ts',
    '<rootDir>/tests/client/**/*.test.tsx',
    '<rootDir>/tests/server/**/*.test.ts',
    '<rootDir>/tests/server/**/*.test.tsx'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testPathIgnorePatterns: [
    '/node_modules/',
    'query-performance\\.test\\.ts$',
  ],
};
