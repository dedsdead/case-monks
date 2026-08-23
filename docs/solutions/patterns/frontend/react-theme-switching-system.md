---
title: "React Theme Switching System — Project Pattern"
problem_type: pattern
category: frontend
components:
  - frontend
tags:
  - patterns
  - theming
  - dark-mode
  - react-context
  - tailwind-css
  - shadcn-ui
module: frontend
date: 2026-08-23
establish_in: "Implemented during theming system migration, 2026-08-23"
---

# Pattern: React Theme Switching System

## Problem / When to Use This

Implement a complete React theming system with color scheme management, theme persistence, and dark mode support across a React + Tailwind CSS + shadcn/ui application. This pattern applies when you need:
- Light/dark/system theme modes
- User preference persistence
- System preference detection
- CSS variables for theming
- Theme-aware UI components
- Accessibility compliance (WCAG color contrasts, select option visibility)

## Source of Truth Files

- `src/hooks/useTheme.ts` — Theme state management and persistence
- `src/contexts/ThemeContext.tsx` — Theme provider and class application
- `src/index.css` — CSS variables and color scheme definitions
- `src/components/ui/theme-toggle.tsx` — Theme toggle component (can be customized)
- `src/App.tsx` — Theme provider integration
- `src/components/layout/LayoutWithSidebar.tsx` — Theme toggle placement

## Current Implementation Snapshot

**Theme System Components:**
- **useTheme hook** (`src/hooks/useTheme.ts`): Manages theme state, localStorage persistence, system preference detection
- **ThemeContext** (`src/contexts/ThemeContext.tsx`): Provides theme state via React Context with HTML class application
- **CSS Variables** (`src/index.css`): Defines light and dark mode color schemes using hex colors from design plan, enables Tailwind dark mode via `@custom-variant dark`
- **ThemeToggle** (`src/components/ui/theme-toggle.tsx`): Dropdown with light/dark/system options using shadcn/ui Button and DropdownMenu components

**Color Scheme Configuration:**
- Light mode: Primary #2c2c2c, Background #e8e7e2, Foreground #18181b
- Dark mode: Background #1a1a1a, Foreground #f5f5f5
- Select option visibility fix for dark mode
- Disabled state styling for accessibility

**Theme Switching Logic:**
- User preference stored in localStorage
- System preference detection via `window.matchMedia('(prefers-color-scheme: dark)')`
- CSS custom properties enable O(1) theme switching
- HTML class-based theme application (`light` or `dark`)

## Planned / Optional Extensions (If Applicable)

- Custom theme toggle components (simple button vs. dropdown)
- Additional theme modes (high-contrast, sepia)
- Theme-specific animations and transitions
- Theme restoration on page reload with saved preference
- Color scheme variants beyond light/dark

## Pattern Overview

Implement a layered theming system with React Context for state management, localStorage for persistence, CSS variables for theme application, and Tailwind CSS dark mode support. The system applies theme classes to the HTML element and uses CSS custom properties to enable instant theme switching across all components without re-renders.

## Implementation Steps

### Step 1: Define Theme Types and Constants

**File to modify:** `src/hooks/useTheme.ts`

```typescript
type Theme = 'light' | 'dark' | 'system';

const THEMES: readonly Theme[] = ['light', 'dark', 'system'] as const;
type ThemeKey = typeof THEMES[number];

const THEME_STORAGE_KEY = 'theme';
```

Key points:
- Use type-safe Theme type for state and props
- Define THEME_STORAGE_KEY as constant for localStorage access
- THEMES array as constant for dropdown options and validation

### Step 2: Implement useTheme Hook

**File to create:** `src/hooks/useTheme.ts`

```typescript
import { useState, useEffect, useMemo } from 'react';

export type Theme = 'light' | 'dark' | 'system';
type ThemeKey = 'light' | 'dark' | 'system';
const THEMES: readonly ThemeKey[] = ['light', 'dark', 'system'] as const;
const THEME_STORAGE_KEY = 'theme';

export interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  actualTheme: ThemeKey;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeKey>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored === 'light' || stored === 'dark' || stored === 'system')
      ? stored
      : 'system';
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const actualTheme = useMemo(() => {
    if (theme === 'system') {
      return (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    return theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

Key points:
- Initialize theme from localStorage with fallback to 'system'
- Persist theme changes to localStorage
- Calculate actual theme (system preference resolution)
- Use React Context for state distribution
- Type-safe ThemeKey type
- Memoize actualTheme to prevent unnecessary recalculations

### Step 3: Apply Theme to HTML Element

**File to modify:** `src/contexts/ThemeContext.tsx`

```typescript
import { ThemeProvider, useTheme, Theme } from './useTheme';
import { useEffect, ReactNode } from 'react';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { theme, setTheme, actualTheme } = useTheme();

  useEffect(() => {
    const html = document.documentElement;
    const currentClass = html.classList.contains('dark') ? 'dark' : 'light';

    if (currentClass !== actualTheme) {
      html.classList.remove('light', 'dark');
      html.classList.add(actualTheme);
    }
  }, [actualTheme]);

  return (
    <ThemeProvider contextValue={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeProvider>
  );
};
```

Key points:
- Remove HTML class when theme changes
- Add correct theme class (light or dark)
- Use actualTheme to determine class (resolves system preference)
- Only update when class actually changes

### Step 4: Define CSS Variables and Color Scheme

**File to modify:** `src/index.css`

```css
@custom-variant dark (&:where(.dark, .dark *));

:root {
  /* Light mode colors from plan */
  --background: #e8e7e2;
  --foreground: #18181b;

  /* Primary color from plan */
  --primary: #2c2c2c;
  --primary-foreground: #ffffff;

  /* Semantic colors */
  --muted: #f5f5f5;
  --muted-foreground: #52525b;

  /* Border and input colors */
  --border: rgba(148, 148, 146, 0.2);
  --input: rgba(148, 148, 146, 0.2);

  /* Radius */
  --radius: 0.5rem;
}

.dark {
  /* Dark mode colors */
  --background: #1a1a1a;
  --foreground: #f5f5f5;

  /* Muted colors for dark mode */
  --muted: #27272a;
  --muted-foreground: #a1a1aa;

  /* Border and input colors for dark mode */
  --border: rgba(255, 255, 255, 0.1);
  --input: rgba(255, 255, 255, 0.1);
}

/* Fix for select option visibility in dark mode */
.dark ::-webkit-scrollbar {
  background: var(--background);
}

/* Ensure select options are visible in dark mode */
.dark select option,
.dark select optgroup {
  background-color: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
}

/* Disabled state styling for accessibility */
.dark select option:disabled {
  background-color: var(--muted);
  color: var(--muted-foreground);
}
```

Key points:
- Use Tailwind CSS `@custom-variant dark` for dark mode support
- Define hex colors from design plan (not OKLCH for compatibility)
- Separate light and dark mode color schemes
- Fix select option visibility in dark mode with proper contrast
- Add disabled state styling for accessibility compliance
- Use CSS variables for theming

### Step 5: Create Theme Toggle Component

**File to create:** `src/components/ui/theme-toggle.tsx`

```typescript
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const icons = {
    light: <Sun className="size-4" />,
    dark: <Moon className="size-4" />,
    system: <Monitor className="size-4" />,
  };

  const labels = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          {icons[theme]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t}
            onClick={() => setTheme(t)}
            className={theme === t ? 'bg-accent' : ''}
          >
            {labels[t]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Key points:
- Use shadcn/ui Button and DropdownMenu components
- Show current theme in dropdown
- Highlight selected theme in dropdown
- Use lucide-react icons for theme representation
- Accessible aria-label

### Step 6: Integrate Theme Provider and Toggle

**File to modify:** `src/App.tsx`

```typescript
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LayoutWithSidebar } from '@/components/layout/LayoutWithSidebar';

function App() {
  return (
    <ThemeProvider>
      <LayoutWithSidebar>
        <ThemeToggle />
      </LayoutWithSidebar>
    </ThemeProvider>
  );
}

export default App;
```

Key points:
- Wrap entire app in ThemeProvider
- Place ThemeToggle in layout/sidebar component
- Don't forget to pass ThemeProvider context to sub-components

### Step 7: Update Tailwind Configuration

**File to modify:** `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Custom CSS variables
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        radius: 'var(--radius)',
      },
    },
  },
} satisfies Config;
```

Key points:
- Enable dark mode with `class` strategy (applies when HTML element has `.dark` class)
- Map CSS variables to Tailwind color tokens
- Extend theme with custom CSS variable references

## Complete Example

```typescript
// src/hooks/useTheme.ts
import { useState, useEffect, useMemo } from 'react';

export type Theme = 'light' | 'dark' | 'system';
type ThemeKey = 'light' | 'dark' | 'system';
const THEMES: readonly ThemeKey[] = ['light', 'dark', 'system'] as const;
const THEME_STORAGE_KEY = 'theme';

export interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  actualTheme: ThemeKey;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeKey>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'system';
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const actualTheme = useMemo(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// src/contexts/ThemeContext.tsx
import { ThemeProvider } from './useTheme';
import { useEffect } from 'react';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme, setTheme, actualTheme } = useTheme();

  useEffect(() => {
    const html = document.documentElement;
    const currentClass = html.classList.contains('dark') ? 'dark' : 'light';

    if (currentClass !== actualTheme) {
      html.classList.remove('light', 'dark');
      html.classList.add(actualTheme);
    }
  }, [actualTheme]);

  return <ThemeProvider contextValue={{ theme, setTheme, actualTheme }}>{children}</ThemeProvider>;
};

// src/index.css
@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: #e8e7e2;
  --foreground: #18181b;
  --primary: #2c2c2c;
  --primary-foreground: #ffffff;
  --muted: #f5f5f5;
  --muted-foreground: #52525b;
  --border: rgba(148, 148, 146, 0.2);
  --input: rgba(148, 148, 146, 0.2);
  --radius: 0.5rem;
}

.dark {
  --background: #1a1a1a;
  --foreground: #f5f5f5;
  --muted: #27272a;
  --muted-foreground: #a1a1aa;
  --border: rgba(255, 255, 255, 0.1);
  --input: rgba(255, 255, 255, 0.1);
}

.dark select option,
.dark select optgroup {
  background-color: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
}

.dark select option:disabled {
  background-color: var(--muted);
  color: var(--muted-foreground);
}

// src/components/ui/theme-toggle.tsx
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          {theme === 'light' ? <Sun className="size-4" /> : theme === 'dark' ? <Moon className="size-4" /> : <Monitor className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((t) => (
          <DropdownMenuItem key={t} onClick={() => setTheme(t)} className={theme === t ? 'bg-accent' : ''}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// src/App.tsx
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LayoutWithSidebar } from '@/components/layout/LayoutWithSidebar';

function App() {
  return (
    <ThemeProvider>
      <LayoutWithSidebar>
        <ThemeToggle />
      </LayoutWithSidebar>
    </ThemeProvider>
  );
}

export default App;
```

## Project-Specific Constraints

- **Color Scheme**: Use hex colors from design plan, not OKLCH (for compatibility)
- **Tailwind Dark Mode**: Use `@custom-variant dark` strategy with class-based switching
- **Theme Toggle**: Can use dropdown or simple toggle button depending on requirements
- **Select Option Visibility**: Must include explicit styling for dark mode to avoid readability issues
- **localStorage Access**: Handle SSR case (`typeof window === 'undefined'`)
- **Context Provider**: Must wrap entire app in ThemeProvider
- **Type Safety**: Use `ThemeKey` type for state and `Theme` type for context

## Anti-Patterns (What NOT to Do)

- ❌ **Don't use OKLCH colors** — Not all browsers support them consistently; use hex colors from plan
- ❌ **Don't hardcode theme classes** — Always use CSS variables for theming
- ❌ **Don't manipulate DOM directly** — Use React hooks and Context for state management
- ❌ **Don't omit select option styling** — Dark mode needs explicit styling for accessibility
- ❌ **Don't forget ThemeProvider** — Context must wrap entire app to provide theme to all components
- ❌ **Don't store raw theme objects in localStorage** — Only store theme mode ('light' | 'dark' | 'system')
- ❌ **Don't use CSS media queries in components** — Calculate actualTheme in hook using media queries

## Related Patterns / Docs

- `docs/solutions/patterns/frontend/react-i18n-hooks-dependency-pattern.md` — Similar hook + context pattern for internationalization

## Safe Change Checklist for Future AI Work

1. Add new theme mode (e.g., 'high-contrast') by updating Theme type, THEMES array, and ThemeToggle dropdown
2. Add color scheme variables to CSS using hex colors from plan
3. Apply new CSS variables to Tailwind config in `tailwind.config.ts`
4. Verify select option visibility in both light and dark modes
5. Test theme persistence across page reloads
6. Verify system preference detection works correctly
7. Run TypeScript validation and lint checks after changes

---

**Pattern Document**: `docs/solutions/patterns/frontend/react-theme-switching-system.md`
