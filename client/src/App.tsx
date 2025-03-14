import { Switch } from "wouter";
import * as React from "react";
import { Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/core/providers/auth-provider";
import { I18nextProvider } from "react-i18next";
import i18n from "@/core/i18n/config";
import CoreLayout from "@/core/layout/CoreLayout";
import { getAllRoutes } from "@/core/routes";

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CoreLayout>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
              <Switch>
                {getAllRoutes()}
              </Switch>
            </Suspense>
          </CoreLayout>
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
