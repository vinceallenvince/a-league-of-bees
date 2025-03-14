import * as React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/core/providers/auth-provider";
import { Button } from "@/core/ui/button";
import { Link } from "wouter";

/**
 * Home Page
 * 
 * The main landing page for the application.
 */
export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  return (
    <div className="container py-8">
      <section className="mb-10">
        <h1 className="text-4xl font-bold mb-6">{t('homePage.welcome.title')}</h1>
        
        <p className="text-muted-foreground mb-8">
          {user 
            ? t('homePage.welcome.authMessage')
            : t('homePage.welcome.nonAuthMessage')}
        </p>
      </section>

      {!user && (
        <section className="mb-10 p-6 bg-muted rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">{t('homePage.getStarted.title')}</h2>
          <p className="mb-6">{t('homePage.getStarted.description')}</p>
          <Button asChild>
            <Link href="/auth">{t('homePage.getStarted.button')}</Link>
          </Button>
        </section>
      )}
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-6">{t('homePage.keyFeatures.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">{t('homePage.keyFeatures.feature1')}</h3>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">{t('homePage.keyFeatures.feature2')}</h3>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">{t('homePage.keyFeatures.feature3')}</h3>
          </div>
        </div>
      </section>
      
      {user && (
        <section className="p-6 bg-muted rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">{t('homePage.profile.title')}</h2>
          <p className="mb-6">{t('homePage.profile.description')}</p>
          <Button variant="outline" asChild>
            <Link href="/profile">{t('homePage.profile.link')}</Link>
          </Button>
        </section>
      )}
    </div>
  );
} 