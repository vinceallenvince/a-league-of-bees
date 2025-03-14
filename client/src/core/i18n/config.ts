import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en/translations.json';
// import esTranslations from './locales/es/translations.json';

/**
 * i18n Configuration
 * 
 * The language switcher in the UI is conditionally rendered based on the number of 
 * languages configured in this file. It will only appear when there are multiple 
 * languages available in the resources object below.
 * 
 * To add a new language:
 * 1. Import the translation file
 * 2. Add it to the resources object
 * 
 * To disable a language:
 * 1. Comment out or remove it from the resources object
 * 2. Optionally comment out the import
 * 
 * The language switcher will automatically update based on these changes.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    resources: {
      en: {
        translations: enTranslations
      },
      // es: {
      //   translations: esTranslations
      // },
      // Add more languages as needed
    },
    ns: ['translations'],
    defaultNS: 'translations',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 