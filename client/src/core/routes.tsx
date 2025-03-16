import { lazy } from "react";
import { Route } from "wouter";
import { ProtectedRoute } from "@/lib/protected-route";

// Lazy load pages
// Core pages (authentication related)
const AuthPage = lazy(() => import("@/core/pages/auth-page"));
const MagicLinkVerifyPage = lazy(() => import("@/core/pages/magic-link-verify-page"));
const AuthSuccessPage = lazy(() => import("@/core/pages/auth-success-page"));
const NotFoundPage = lazy(() => import("@/pages/not-found"));

// Feature pages
// Profile feature
const ProfilePage = lazy(() => import("@/features/profile/pages/profile-page"));

// Admin feature
const AdminPage = lazy(() => import("@/features/admin/pages/admin-page"));

// Info feature
const AboutPage = lazy(() => import("@/features/info/pages/about-page"));
const ContactPage = lazy(() => import("@/features/info/pages/contact-page"));

// Hello World feature
const HelloWorldPage = lazy(() => import("@/features/hello-world/pages/hello-world-page"));

// Main application pages
const HomePage = lazy(() => import("@/pages/home-page"));

// Route definitions organized by category
export const coreRoutes = [
  <Route key="auth" path="/auth" component={AuthPage} />,
  <Route key="auth-verify" path="/auth/verify" component={MagicLinkVerifyPage} />,
  <Route key="auth-magic-link" path="/auth/magic-link" component={MagicLinkVerifyPage} />,
  <Route key="auth-success" path="/auth/success" component={AuthSuccessPage} />,
];

export const featureRoutes = {
  profile: [
    <Route key="profile" path="/profile" component={ProfilePage} />,
  ],
  admin: [
    <Route key="admin" path="/admin" component={AdminPage} />,
  ],
  info: [
    <Route key="about" path="/about" component={AboutPage} />,
    <Route key="contact" path="/contact" component={ContactPage} />,
  ],
  helloWorld: [
    <ProtectedRoute key="hello-world" path="/hello-world" component={HelloWorldPage} requireAuth={true} />,
  ],
};

export const mainRoutes = [
  <Route key="home" path="/" component={HomePage} />,
];

// Fallback route for 404
export const notFoundRoute = <Route key="not-found" component={NotFoundPage} />;

// Helper function to get all routes as a flat array
export const getAllRoutes = () => [
  ...coreRoutes,
  ...featureRoutes.profile,
  ...featureRoutes.admin,
  ...featureRoutes.info,
  ...featureRoutes.helloWorld,
  ...mainRoutes,
  notFoundRoute,
]; 