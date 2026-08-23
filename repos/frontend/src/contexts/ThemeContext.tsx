import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTheme, type Theme } from '../hooks/useTheme';
export type { Theme };

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme, actualTheme } = useTheme();

  useEffect(() => {
    // Apply theme class to html element - only change if different
    const html = document.documentElement;
    const currentClass = html.classList.contains('dark') ? 'dark' : 'light';

    if (currentClass !== actualTheme) {
      html.classList.remove('light', 'dark');
      html.classList.add(actualTheme);
    }
  }, [actualTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return ctx;
}