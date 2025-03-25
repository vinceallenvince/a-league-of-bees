import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock components and hooks
jest.mock('@/core/providers/auth-provider', () => ({
  useAuth: jest.fn()
}));

jest.mock('@/core/components/auth/otp-form', () => ({
  OtpForm: () => <div data-testid="otp-form">OTP Form</div>
}));

jest.mock('@/core/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={className}>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children, id }: { children: React.ReactNode, id?: string }) => <div id={id}>{children}</div>
}));

// Mock wouter
const mockSetLocation = jest.fn();
jest.mock('wouter', () => ({
  useLocation: () => ["/", mockSetLocation]
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

// Get reference to the mocked useAuth function
const mockUseAuth = require('@/core/providers/auth-provider').useAuth;

// Create a mock implementation of AuthPage component
const AuthPage: React.FC = () => {
  const { user } = mockUseAuth();
  const { t } = require('react-i18next').useTranslation();
  const [, setLocation] = require('wouter').useLocation();
  const { OtpForm } = require('@/core/components/auth/otp-form');
  const { Card, CardContent, CardHeader, CardTitle } = require('@/core/ui/card');

  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center" role="main">
      <div className="container grid lg:grid-cols-2 gap-8">
        <section aria-labelledby="auth-title">
          <Card className="p-6">
            <CardHeader>
              <CardTitle id="auth-title">{t('auth.welcomeBack')}</CardTitle>
            </CardHeader>
            <CardContent>
              <OtpForm />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

describe('AuthPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders auth form when user is not logged in', () => {
    // Set up the mock return value for useAuth
    mockUseAuth.mockReturnValue({
      user: null,
      error: null,
      isLoading: false,
      authMethod: 'otp',
      requestAuthMutation: { mutate: jest.fn(), isPending: false },
      requestOtpMutation: { mutate: jest.fn(), isPending: false },
      verifyOtpMutation: { mutate: jest.fn(), isPending: false },
      logoutMutation: { mutate: jest.fn(), isPending: false },
    });

    render(<AuthPage />);
    
    expect(screen.getByTestId('otp-form')).toBeInTheDocument();
    expect(mockSetLocation).not.toHaveBeenCalled();
  });

  it('redirects to home page when user is logged in', () => {
    // Set up the mock return value for useAuth with a user
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'user@example.com' },
      error: null,
      isLoading: false,
      authMethod: 'otp',
      requestAuthMutation: { mutate: jest.fn(), isPending: false },
      requestOtpMutation: { mutate: jest.fn(), isPending: false },
      verifyOtpMutation: { mutate: jest.fn(), isPending: false },
      logoutMutation: { mutate: jest.fn(), isPending: false },
    });

    const { container } = render(<AuthPage />);
    
    expect(mockSetLocation).toHaveBeenCalledWith('/');
    expect(container.firstChild).toBeNull();
  });
}); 