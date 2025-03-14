import { useAuth } from "@/core/providers/auth-provider";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  requireAuth = true,
  key,
}: {
  path: string;
  component: () => React.JSX.Element;
  requireAuth?: boolean;
  key?: string;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path} key={key}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // For auth-only routes, redirect to auth page if not logged in
  if (requireAuth && !user) {
    return (
      <Route path={path} key={key}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // For auth page, redirect to home if already logged in
  if (path === "/auth" && user) {
    return (
      <Route path={path} key={key}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} key={key} />;
}
