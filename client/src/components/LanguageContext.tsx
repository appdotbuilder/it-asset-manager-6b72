import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from './i18n/translations';

type Language = 'en' | 'id';
type TranslationPath = string;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: TranslationPath) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(() => {
    // Get language from localStorage or default to Indonesian
    const saved = localStorage.getItem('language') as Language;
    return saved && (saved === 'en' || saved === 'id') ? saved : 'id';
  });

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('language', language);
  }, [language]);

  const t = (path: TranslationPath): string => {
    const keys = path.split('.');
    let value: any = translations[language];
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // Fallback to English if key doesn't exist in current language
        let fallbackValue: any = translations['en'];
        for (const fallbackKey of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fallbackKey in fallbackValue) {
            fallbackValue = fallbackValue[fallbackKey];
          } else {
            return path; // Return the path itself if translation is missing
          }
        }
        return typeof fallbackValue === 'string' ? fallbackValue : path;
      }
    }
    
    return typeof value === 'string' ? value : path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}