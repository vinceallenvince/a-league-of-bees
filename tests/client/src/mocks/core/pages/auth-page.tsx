import React from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

// Mock function for useAuth
const useAuth = () => ({
  user: null,
  error: null,
  isLoading: false,
  authMethod: 'otp',
  requestAuthMutation: { mutate: () => {}, isPending: false },
  requestOtpMutation: { mutate: () => {}, isPending: false },
  verifyOtpMutation: { mutate: () => {}, isPending: false },
  logoutMutation: { mutate: () => {}, isPending: false }
});

export default function AuthPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center" role="main">
      <div className="container grid lg:grid-cols-2 gap-8">
        <section aria-labelledby="auth-title">
          <div className="p-6">
            <div>
              <div id="auth-title">{t('auth.welcomeBack')}</div>
            </div>
            <div>
              <div data-testid="otp-form">OTP Form</div>
            </div>
          </div>
        </section>

        <section aria-labelledby="info-title" className="hidden lg:flex flex-col justify-center space-y-4">
          <h1 id="info-title" className="text-4xl font-bold tracking-tight">
            {t('auth.secureAuth')}
          </h1>
          <p className="text-muted-foreground">
            {t('auth.secureAuthDesc')}
          </p>
        </section>
      </div>
    </div>
  );
} 