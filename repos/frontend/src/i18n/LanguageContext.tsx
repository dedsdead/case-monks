import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { translations, type TranslationKey } from './translations';

export type Language = 'pt-BR' | 'en';

export const localeFor: Record<Language, string> = {
  'pt-BR': 'pt-BR',
  en: 'en-US',
};

export function formatScore(value: number, language: Language): string {
  return new Intl.NumberFormat(localeFor[language], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(
  date: Date | string,
  language: Language,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(localeFor[language], options);
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.split(`{${k}}`).join(String(v)),
    template,
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get from localStorage first
    const stored = localStorage.getItem('language');
    if (stored && (stored === 'pt-BR' || stored === 'en')) {
      return stored;
    }
    // Default to Portuguese
    return 'pt-BR';
  });

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('language', language);
    document.documentElement.lang = localeFor[language];
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (
    key: TranslationKey,
    params?: Record<string, string | number>,
  ): string => {
    const template =
      translations[language][key] || translations['pt-BR'][key] || key;
    return interpolate(template, params);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
