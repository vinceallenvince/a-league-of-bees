import * as React from "react";
import { createContext, ReactNode, useContext, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { 
  useRequestAuth, 
  useRequestOtp, 
  useVerifyOtp, 
  useLogout,
  type AuthMethod,
  type AuthContextType
} from "@/core/hooks/useAuth";

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: authMethodData } = useQuery<{ method: AuthMethod }>({
    queryKey: ["/api/auth/method"],
    retry: false,
  });

  // Handle magic link success redirect
  useEffect(() => {
    if (location === '/auth/success' && user) {
      toast({
        title: t('auth.loginSuccessful'),
        description: t('auth.welcomeBackMessage'),
      });
      setLocation("/");
    }
  }, [location, user, setLocation, toast, t]);

  const requestAuthMutation = useRequestAuth();
  const requestOtpMutation = useRequestOtp();
  const verifyOtpMutation = useVerifyOtp();
  const logoutMutation = useLogout();

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        error,
        isLoading,
        authMethod: authMethodData?.method || 'otp',
        requestAuthMutation,
        requestOtpMutation,
        verifyOtpMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 