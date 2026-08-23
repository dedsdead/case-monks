---
title: "React Theming System with Tailwind CSS — Project Pattern"
problem_type: pattern
category: frontend
components:
  - frontend
tags:
  - patterns
  - react-theming
  - tailwind-css
  - dark-mode
  - light-mode
  - system-theme
  - theme-switching
  - css-custom-properties
module: frontend-styling
date: 2026-08-23
established_in: "Fixed UI theming issues including wrong colors, inconsistent theming, and lack of light/dark/system theme switch"
---

# Pattern: React Theming System with Tailwind CSS

## Problem / When to Use This

When implementing React applications with comprehensive theming support including light, dark, and system theme switching, developers need a robust theming system that maintains color consistency, provides theme persistence, and works seamlessly with Tailwind CSS. This pattern applies to any React application that requires consistent theming across the entire UI with proper theme switching capabilities.

## Source of Truth Files

- `src/hooks/useTheme.ts` - Theme state management hook
- `src/contexts/ThemeContext.tsx` - Theme context provider
- `src/components/ui/theme-toggle.tsx` - Theme switching component
- `src/index.css` - CSS custom properties for color palette
- `src/components/layout/LayoutWithSidebar.tsx` - Theme toggle integration in layout

## Current Implementation Snapshot

The pattern was established by fixing theming issues across the entire UI:
- Implemented complete theme switching system with light, dark, and system options
- Added theme persistence using localStorage
- Integrated theme toggle in the main layout next to language switcher
- Verified CSS custom properties support both light and dark themes
- Ensured all components work with the new theme system

## Planned / Optional Extensions (If Applicable)

- Theme customization UI with color picker
- Theme-specific component variants
- Theme-based animations and transitions
- Theme-aware data visualization
- Accessibility compliance for theme switching

## Pattern Overview

The solution approach implements a comprehensive theming system that follows the existing LanguageContext pattern for consistency. It provides three theme options (light, dark, system) with proper persistence and system preference detection. The system uses CSS custom properties with Tailwind CSS integration for consistent theming across all components.

## Implementation Steps

### Step 1: Create Theme State Management Hook

[File to create: `src/hooks/useTheme.ts`]

```typescript
import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const THEME_STORAGE_KEY = 'theme';

export function useTheme(): ThemeContextType {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Try to get from localStorage first
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
      return stored as Theme;
    }
    // Default to system preference
    return 'system';
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    // Handle system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        setActualTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    // Set initial actual theme
    setActualTheme(mediaQuery.matches ? 'dark' : 'light');

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return {
    theme,
    setTheme,
    actualTheme,
  };
}
```

Key points:
- Theme options: 'light', 'dark', 'system'
- localStorage persistence for user preference
- System preference detection using `prefers-color-scheme`
- Actual theme calculation based on user choice or system preference

### Step 2: Create Theme Context Provider

[File to create: `src/contexts/ThemeContext.tsx`]

```typescript
import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTheme, type Theme } from '../hooks/useTheme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme, actualTheme } = useTheme();

  useEffect(() => {
    // Apply theme class to html element
    const html = document.documentElement;
    
    // Remove existing theme classes
    html.classList.remove('light', 'dark');
    
    // Add current theme class
    if (actualTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.add('light');
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
```

Key points:
- Provides theme context to all components
- Applies theme classes to HTML element for CSS custom property overrides
- Follows the same pattern as LanguageContext for consistency
- Throws error if used outside of ThemeProvider

### Step 3: Create Theme Toggle Component

[File to create: `src/components/ui/theme-toggle.tsx`]

```typescript
import { Check, Monitor, Sun, Moon } from "lucide-react";
import { useThemeContext, type Theme } from "../../contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEMES: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useThemeContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme" title="Toggle theme">
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" sideOffset={8}>
        {THEMES.map((entry) => {
          const Icon = entry.icon;
          return (
            <DropdownMenuItem
              key={entry.value}
              role="menuitemradio"
              aria-checked={theme === entry.value}
              onSelect={() => setTheme(entry.value)}
            >
              <Icon className="mr-2 size-4" />
              <span className="flex-1">{entry.label}</span>
              {theme === entry.value && <Check className="size-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Key points:
- Follows the same pattern as LanguageSwitcher for consistency
- Uses icons for visual theme representation
- Shows current selection with checkmark
- Smooth transitions between sun and moon icons

### Step 4: Update App with ThemeProvider

[File to modify: `src/App.tsx`]

```typescript
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { LanguageProvider } from "./i18n/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { Layout } from "./components/layout/LayoutWithSidebar";
import { Home } from "./pages/Home";
import { Evaluate } from "./pages/Evaluate";
import { History } from "./pages/History";
import { GlobalHistory } from "./pages/GlobalHistory";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/evaluate/:employeeId" element={<Evaluate />} />
                  <Route path="/history/:employeeId" element={<History />} />
                  <Route path="/history" element={<GlobalHistory />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </LanguageProvider>
  );
}
```

Key points:
- ThemeProvider wraps the entire application
- Positioned after LanguageProvider to maintain proper context hierarchy
- Ensures all components have access to theme context

### Step 5: Update Layout with Theme Toggle

[File to modify: `src/components/layout/LayoutWithSidebar.tsx`]

```typescript
import { Link, useLocation, Outlet } from "react-router-dom";
import { ClipboardList, History, LayoutDashboard, UserRoundPen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../i18n/LanguageContext";
import { LeaderSelector } from "./LeaderSelector";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Separator } from "@/components/ui/separator";

// ... rest of the file ...

export function Layout() {
  const { employeeId, clearEmployee } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (!employeeId) {
    return <LeaderSelector />;
  }

  // ... navigation items and logic ...

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        {/* ... sidebar content ... */}

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                <span
                  className="truncate font-mono text-xs text-muted-foreground"
                  title={`#${employeeId}`}
                >
                  #{employeeId}
                </span>
                <div className="flex items-center gap-1">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
              </div>
            </SidebarMenuItem>
            {/* ... other footer items ... */}
          </SidebarMenu>
        </SidebarFooter>

        {/* ... rest of the layout ... */}
      </Sidebar>
      {/* ... rest of the layout ... */}
    </SidebarProvider>
  );
}
```

Key points:
- ThemeToggle added next to LanguageSwitcher for consistency
- Proper flex layout to maintain spacing
- Group data attributes for responsive behavior

## Project-Specific Constraints

- [ ] Theme system must follow the same pattern as LanguageContext for consistency
- [ ] Theme persistence using localStorage with key 'theme'
- [ ] System preference detection using `prefers-color-scheme` media query
- [ ] Theme classes applied to HTML element for CSS custom property overrides
- [ ] Theme toggle positioned next to language switcher in layout footer

## Anti-Patterns (What NOT to Do)

- ❌ Don't hardcode theme classes in individual components
- ❌ Don't use inline styles for theming
- ❌ Don't forget to apply theme classes to HTML element
- ❌ Don't skip localStorage persistence for user preferences
- ❌ Don't ignore system preference detection for 'system' theme option
- ❌ Don't use different patterns than the existing LanguageContext system

## Related Patterns / Docs

- `docs/solutions/patterns/frontend/react-i18n-hooks-dependency-pattern.md` - Similar pattern for i18n hook management
- `src/i18n/LanguageContext.tsx` - Language context implementation for pattern reference
- `src/index.css` - CSS custom properties for color palette

## Safe Change Checklist for Future AI Work

1. First file/symbol to update: Check all theme-related hooks and context usage
2. Second dependent update: Ensure theme classes are properly applied to HTML element
3. Cross-layer sync requirement: Verify theme switching works across all components
 4. Verification/build/migration/deploy check: Run `npm run validate` (or `tsc --noEmit` if no validate script), test theme persistence and system preference detection