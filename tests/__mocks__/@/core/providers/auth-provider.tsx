import React from 'react';

export const useAuth = jest.fn().mockImplementation(() => ({
  user: null,
  error: null,
  isLoading: false,
  authMethod: 'otp',
  requestAuthMutation: { mutate: jest.fn(), isPending: false },
  requestOtpMutation: { mutate: jest.fn(), isPending: false },
  verifyOtpMutation: { mutate: jest.fn(), isPending: false },
  logoutMutation: { mutate: jest.fn(), isPending: false },
}));

export const AuthProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>; 