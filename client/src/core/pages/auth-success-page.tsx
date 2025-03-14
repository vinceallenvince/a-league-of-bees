import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/core/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { Button } from "@/core/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AuthSuccessPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();

  // Redirect to home after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center" role="main">
      <div className="container">
        <div className="max-w-md mx-auto">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>{t('auth.loginSuccessful')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : user ? (
                  <>
                    <p>{t('auth.welcomeBackMessage')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('auth.redirectingToHome')}
                    </p>
                  </>
                ) : (
                  <p className="text-destructive">{t('auth.sessionError')}</p>
                )}
                
                <Button 
                  onClick={() => setLocation("/")} 
                  className="w-full"
                >
                  {t('auth.goToHome')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 