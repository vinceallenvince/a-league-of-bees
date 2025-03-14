import * as React from "react";
import { createContext, useContext, ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { InsertOtp, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export type AuthMethod = 'otp' | 'magic-link';

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  authMethod: AuthMethod;
  requestAuthMutation: ReturnType<typeof useRequestAuth>;
  requestOtpMutation: ReturnType<typeof useRequestOtp>;
  verifyOtpMutation: ReturnType<typeof useVerifyOtp>;
  logoutMutation: ReturnType<typeof useLogout>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function useRequestAuth() {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/auth/request", { email });
      const data = await response.json();
      return data as { method: AuthMethod };
    },
    onSuccess: (data) => {
      if (data.method === 'magic-link') {
        toast({
          title: t('auth.magicLinkSent'),
          description: t('auth.checkEmailForLink'),
        });
      } else {
        toast({
          title: t('auth.otpSent'),
          description: t('auth.checkEmail'),
        });
      }
    },
    onError: (error: unknown) => {
      // Log the error for debugging
      console.error("Request auth error:", error);
      
      // Safely extract a string message from any error type
      let errorMessage = t('auth.unexpectedError');
      
      try {
        if (error instanceof Error) {
          errorMessage = error.message.replace(/[{}[\]"]/g, '').trim();
        } else if (error && typeof error === 'object') {
          errorMessage = JSON.stringify(error)
            .replace(/[{}[\]"]/g, '')
            .replace(/,/g, ' ')
            .replace(/:/g, ': ')
            .trim();
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
      } catch (conversionError) {
        console.error("Error while formatting error message:", conversionError);
      }
      
      toast({
        title: t('auth.failedToSendAuth'),
        description: String(errorMessage),
        variant: "destructive",
      });
    },
  });
}

export function useRequestOtp() {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("POST", "/api/auth/request-otp", { email });
    },
    onSuccess: () => {
      toast({
        title: t('auth.otpSent'),
        description: t('auth.checkEmail'),
      });
    },
    onError: (error: unknown) => {
      // Log the error for debugging
      console.error("Request OTP error:", error);
      
      // Safely extract a string message from any error type
      let errorMessage = t('auth.unexpectedError');
      
      try {
        if (error instanceof Error) {
          errorMessage = error.message.replace(/[{}[\]"]/g, '').trim();
        } else if (error && typeof error === 'object') {
          errorMessage = JSON.stringify(error)
            .replace(/[{}[\]"]/g, '')
            .replace(/,/g, ' ')
            .replace(/:/g, ': ')
            .trim();
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
      } catch (conversionError) {
        console.error("Error while formatting error message:", conversionError);
      }
      
      toast({
        title: t('auth.failedToSendOTP'),
        description: String(errorMessage),
        variant: "destructive",
      });
    },
  });
}

export function useVerifyOtp() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: InsertOtp) => {
      const res = await apiRequest("POST", "/api/auth/verify-otp", data);
      return res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: t('auth.loginSuccessful'),
        description: t('auth.welcomeBackMessage'),
      });
      setLocation("/"); // Redirect to home page after successful login
    },
    onError: (error: unknown) => {
      // Log the error for debugging
      console.error("OTP verification error:", error);
      
      // Safely extract a string message from any error type
      let errorMessage = t('auth.unexpectedError');
      
      try {
        if (error instanceof Error) {
          // Standard Error object handling
          const errorStr = error.message;
          console.log("Error message:", errorStr);
          
          if (errorStr.includes("expired")) {
            errorMessage = t('auth.otpExpired');
          } else if (errorStr.includes("invalid")) {
            errorMessage = t('auth.invalidOtp');
          } else {
            // Strip out any JSON syntax or object notation
            errorMessage = errorStr.replace(/[{}[\]"]/g, '').trim();
          }
        } else if (error && typeof error === 'object') {
          // Object error handling
          const serialized = JSON.stringify(error);
          console.log("Serialized error:", serialized);
          
          // Extract just the message/text content
          // Remove all JSON syntax characters and formatting
          errorMessage = serialized
            .replace(/[{}[\]"]/g, '')
            .replace(/,/g, ' ')
            .replace(/:/g, ': ')
            .trim();
        } else if (typeof error === 'string') {
          // Direct string error
          errorMessage = error;
        }
      } catch (conversionError) {
        console.error("Error while formatting error message:", conversionError);
        // Keep the default error message
      }
      
      // Ensure errorMessage is a string before sending to toast
      toast({
        title: t('auth.loginFailed'),
        description: String(errorMessage),
        variant: "destructive",
      });
    },
  });
}

export function useLogout() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      toast({
        title: t('auth.loggedOut'),
        description: t('auth.seeYouSoon'),
      });
      setLocation("/auth"); // Redirect to auth page after logout
    },
  });
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Implementation similar to the one in auth-provider.tsx
  // This is a duplicate export to maintain backward compatibility
  console.warn("Using deprecated AuthProvider from useAuth.ts. Please update to use @/core/providers/auth-provider instead.");
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const authQuery = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        const userData = await response.json();
        return userData as User | null;
      } catch (error) {
        return null;
      }
    },
  });

  const requestAuth = useRequestAuth();
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();
  const logout = useLogout();

  // Use local storage to remember the user's preferred auth method
  const [authMethod, setAuthMethod] = React.useState<AuthMethod>(() => {
    if (typeof window !== "undefined") {
      const storedMethod = localStorage.getItem("authMethod");
      return (storedMethod === "magic-link" || storedMethod === "otp") 
        ? storedMethod 
        : "otp"; // Default to OTP
    }
    return "otp"; // Default for SSR
  });

  // Update local storage when auth method changes
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("authMethod", authMethod);
    }
  }, [authMethod]);

  // Effect to redirect based on auth state
  React.useEffect(() => {
    // If auth state is loaded (not in loading state)
    if (!authQuery.isLoading) {
      // No redirection logic in this provider to avoid duplicate redirects
      // with the main auth provider
    }
  }, [authQuery.isLoading, authQuery.data, setLocation]);

  const value: AuthContextType = {
    user: authQuery.data ?? null,
    isLoading: authQuery.isLoading,
    error: authQuery.error || null,
    authMethod,
    requestAuthMutation: requestAuth,
    requestOtpMutation: requestOtp,
    verifyOtpMutation: verifyOtp,
    logoutMutation: logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 