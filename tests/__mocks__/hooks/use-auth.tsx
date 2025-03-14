import { createContext } from 'react';
import type { User } from '@shared/schema';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  requestOtpMutation: {
    mutate: jest.Mock;
    isLoading: boolean;
    error: null;
    mutateAsync: jest.Mock;
  };
  verifyOtpMutation: {
    mutate: jest.Mock;
    isLoading: boolean;
    error: null;
    mutateAsync: jest.Mock;
  };
  logoutMutation: {
    mutate: jest.Mock;
    isLoading: boolean;
    error: null;
    mutateAsync: jest.Mock;
  };
};

export const AuthContext = createContext<AuthContextType | null>(null);

const mockAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  requestOtpMutation: {
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    error: null
  },
  verifyOtpMutation: {
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    error: null
  },
  logoutMutation: {
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    error: null
  }
};

export const useAuth = () => mockAuthContext;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => children; 