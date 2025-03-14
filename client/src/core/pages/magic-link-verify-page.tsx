import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/core/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { Button } from "@/core/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function MagicLinkVerifyPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to home
  if (user) {
    setLocation("/");
    return null;
  }

  useEffect(() => {
    const verifyMagicLink = async () => {
      try {
        // The verification is handled by the server-side redirect
        // This page is just for showing loading state and handling errors
        // The actual verification happens when the server redirects to /auth/success
        
        // Extract token and email from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const email = urlParams.get('email');
        
        if (!token || !email) {
          setError(t('auth.invalidMagicLink'));
          setIsVerifying(false);
          return;
        }
        
        // Redirect to the API endpoint that handles verification
        window.location.href = `/api/auth/verify-magic-link?token=${token}&email=${encodeURIComponent(email)}`;
      } catch {
        setError(t('auth.magicLinkVerificationFailed'));
        setIsVerifying(false);
      }
    };

    verifyMagicLink();
  }, [t]);

  return (
    <div className="min-h-screen bg-background flex items-center" role="main">
      <div className="container">
        <div className="max-w-md mx-auto">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>{t('auth.verifyingMagicLink')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isVerifying ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>{t('auth.verifyingYourIdentity')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-destructive">{error}</p>
                  <Button 
                    onClick={() => setLocation("/auth")} 
                    className="w-full"
                  >
                    {t('auth.backToLogin')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 