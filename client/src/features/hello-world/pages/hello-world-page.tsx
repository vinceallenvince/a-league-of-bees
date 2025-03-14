import * as React from "react";
import { HelloWorldCard } from "../components/hello-world-card";
import { useTranslation } from "react-i18next";

/**
 * Hello World Page Component
 * 
 * This is a simple example of a feature page that demonstrates
 * our new architecture. It includes a HelloWorldCard component
 * to show how components can be organized within features.
 */
export default function HelloWorldPage() {
  const { t } = useTranslation();
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">{t('helloWorld.title')}</h1>
      
      <p className="text-muted-foreground mb-8">
        {t('helloWorld.description')}
      </p>
      
      <HelloWorldCard />
    </div>
  );
} 