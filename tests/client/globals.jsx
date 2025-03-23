/**
 * Global mocks for client tests
 * This file will be loaded by Jest's setupFilesAfterEnv
 */
import React from 'react';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
    },
  }),
}));

// Mock wouter
jest.mock('wouter', () => ({
  useLocation: () => ["/", jest.fn()],
  useRoute: () => [false, {}],
  Link: ({ children, href }) => React.createElement('a', { href }, children),
  Route: ({ children }) => children,
}));

// Mock the auth provider
jest.mock('@/core/providers/auth-provider', () => ({
  useAuth: jest.fn().mockImplementation(() => ({
    user: null,
    error: null,
    isLoading: false,
    authMethod: 'otp',
    requestAuthMutation: { mutate: jest.fn(), isPending: false },
    requestOtpMutation: { mutate: jest.fn(), isPending: false },
    verifyOtpMutation: { mutate: jest.fn(), isPending: false },
    logoutMutation: { mutate: jest.fn(), isPending: false },
  })),
  AuthProvider: ({ children }) => children,
}));

// Mock use-toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Add a global wrapper for cn utility
global.cn = (...inputs) => inputs.filter(Boolean).join(' ');

// Mock formatDate utility
global.formatDate = (date) => date.toLocaleDateString();

// Mock Tournament type API 
global.mockTournamentApi = {
  getTournaments: jest.fn(),
  getTournament: jest.fn(),
  createTournament: jest.fn(),
  updateTournament: jest.fn(),
  deleteTournament: jest.fn()
}; 