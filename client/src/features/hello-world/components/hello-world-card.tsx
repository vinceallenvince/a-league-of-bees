import * as React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/core/ui/card";
import { Button } from "@/core/ui/button";
import { useToast } from "@/hooks/use-toast";

/**
 * Hello World Card Component
 * 
 * A simple interactive card component that demonstrates:
 * - Using core UI components (Card, Button)
 * - Managing local state (counter)
 * - Using toast notifications
 * - Using translations
 */
export function HelloWorldCard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [counter, setCounter] = useState(0);
  
  const handleIncrement = () => {
    setCounter(prev => prev + 1);
    toast({
      title: t('helloWorld.counterUpdated', 'Counter updated'),
      description: t('helloWorld.newValue', 'New value: {{value}}', { value: counter + 1 }),
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('helloWorld.cardTitle', 'Interactive Example')}</CardTitle>
        <CardDescription>
          {t('helloWorld.cardDescription', 'This card demonstrates component organization and interactivity.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          <p className="text-xl mb-4">
            {t('helloWorld.counterValue', 'Counter value: {{value}}', { value: counter })}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleIncrement}>
          {t('helloWorld.increment', 'Increment Counter')}
        </Button>
      </CardFooter>
    </Card>
  );
} 