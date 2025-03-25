import * as React from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/core/providers/auth-provider";
import { OtpForm } from "@/core/components/auth/otp-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";

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
          <Card className="p-6">
            <CardHeader>
              <CardTitle id="auth-title">{t('auth.welcomeBack')}</CardTitle>
            </CardHeader>
            <CardContent>
              <OtpForm />
            </CardContent>
          </Card>
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