import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

/**
 * 404 Not Found Page
 * 
 * This page is displayed when a user navigates to a route that doesn't exist.
 */
export default function NotFoundPage() {
  const { t } = useTranslation();
  
  return (
    <div className="container flex flex-col items-center justify-center min-h-[80vh] py-8 text-center">
      <h1 className="text-4xl font-bold mb-4">{t('notFound.title')}</h1>
      
      <p className="text-muted-foreground mb-8 max-w-md">
        {t('notFound.message')}
      </p>
      
      <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
        {t('navigation.home')}
      </Link>
    </div>
  );
} 