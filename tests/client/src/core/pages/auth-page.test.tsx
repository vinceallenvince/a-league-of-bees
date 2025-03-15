import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthPage from '../../../../../client/src/core/pages/auth-page';

// Mock dependencies
jest.mock('../../../../../client/src/core/providers/auth-provider', () => ({
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
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Get a reference to the mocked useAuth function
const mockUseAuth = jest.mocked(require('../../../../../client/src/core/providers/auth-provider').useAuth);

// Mock wouter
const mockSetLocation = jest.fn();
jest.mock('wouter', () => ({
  useLocation: () => ["/", mockSetLocation],
  Link: ({ children }: { children: React.ReactNode }) => children,
  Route: ({ children }: { children: React.ReactNode }) => children
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn(),
    },
  }),
}));

// Mock other dependencies
jest.mock('../../../../../client/src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

jest.mock('../../../../../client/src/core/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster" />
}));

jest.mock('../../../../../client/src/core/components/auth/otp-form', () => ({
  OtpForm: () => <div data-testid="otp-form">OTP Form</div>
}));

describe('AuthPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render auth form when user is not logged in', () => {
    // Mock useAuth to return null user (not logged in)
    mockUseAuth.mockImplementation(() => ({
      user: null,
      error: null,
      isLoading: false,
      authMethod: 'otp',
      requestAuthMutation: { mutate: jest.fn(), isPending: false },
      requestOtpMutation: { mutate: jest.fn(), isPending: false },
      verifyOtpMutation: { mutate: jest.fn(), isPending: false },
      logoutMutation: { mutate: jest.fn(), isPending: false },
    }));
    
    render(<AuthPage />);
    
    // Auth form should be rendered
    expect(screen.getByTestId('otp-form')).toBeInTheDocument();
    
    // Should not redirect
    expect(mockSetLocation).not.toHaveBeenCalled();
  });

  it('should redirect to home page when user is logged in', () => {
    // Mock useAuth to return a user (logged in)
    mockUseAuth.mockImplementation(() => ({
      user: { 
        id: "user-uuid-123", 
        email: 'test@example.com',
        firstName: null,
        lastName: null,
        username: null,
        bio: null,
        avatar: null,
        isAdmin: false,
        lastLogin: null,
        otpSecret: null,
        otpExpiry: null,
        otpAttempts: 0,
        otpLastRequest: null
      },
      error: null,
      isLoading: false,
      authMethod: 'otp',
      requestAuthMutation: { mutate: jest.fn(), isPending: false },
      requestOtpMutation: { mutate: jest.fn(), isPending: false },
      verifyOtpMutation: { mutate: jest.fn(), isPending: false },
      logoutMutation: { mutate: jest.fn(), isPending: false },
    }));
    
    const { container } = render(<AuthPage />);
    
    // Should redirect to home page
    expect(mockSetLocation).toHaveBeenCalledWith('/');
    
    // Container should be empty (null returned)
    expect(container.firstChild).toBeNull();
  });
}); 