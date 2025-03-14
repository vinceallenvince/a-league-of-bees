import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/ui/dropdown-menu";
import { Button } from "@/core/ui/button";

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  
  // Get the available languages from i18n resources
  const availableLanguages = Object.keys(i18n.options.resources || {});
  
  // Only show the language switcher if there's more than one language
  if (availableLanguages.length <= 1) {
    return null;
  }

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  // Get language name in the current language
  const getLanguageName = (code: string) => {
    if (code === 'en') return 'English';
    if (code === 'es') return 'Español';
    return code;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1"
          aria-label="Select language"
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only md:not-sr-only md:inline-block">
            {getLanguageName(i18n.language)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLanguages.map(langCode => (
          <DropdownMenuItem 
            key={langCode}
            onClick={() => changeLanguage(langCode)}
            className={i18n.language === langCode ? 'bg-accent' : ''}
          >
            {getLanguageName(langCode)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher; 