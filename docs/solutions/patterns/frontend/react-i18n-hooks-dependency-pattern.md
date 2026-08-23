---
title: "React i18n Hooks Dependency Management — Project Pattern"
problem_type: pattern
category: frontend
components:
  - frontend
tags:
  - patterns
  - react-hooks
  - i18n
  - useCallback
  - useEffect
  - performance-optimization
module: frontend-internationalization
date: 2026-08-23
established_in: "Fixed React i18n performance optimization issues across multiple components"
---

# Pattern: React i18n Hooks Dependency Management

## Problem / When to Use This

When implementing React components with internationalization (i18n) using hooks like `useCallback`, `useEffect`, or `useMemo`, developers often face the dilemma of whether to include translation functions in dependency arrays. Excluding them for performance optimization can lead to stale closures and bugs when language changes occur. This pattern applies to any React component using i18n hooks where language changes should trigger updates or use fresh translation contexts.

## Source of Truth Files

- `src/i18n/LanguageContext.tsx` - Translation function provider
- `src/pages/Home.tsx` - Example of proper useCallback dependency management
- `src/pages/History.tsx` - Example of proper useCallback dependency management
- `src/pages/GlobalHistory.tsx` - Example of proper useEffect dependency management
- `src/components/layout/LeaderSelector.tsx` - Example of proper useEffect dependency management

## Current Implementation Snapshot

The pattern was established by fixing performance optimization issues across multiple components:
- Added translation function `t` back to `useCallback` dependencies in Home, History, and GlobalHistory components
- Added translation function `t` and `resetEmployee` back to `useCallback` dependencies in History component  
- Added translation function `t` back to `useEffect` dependencies in LeaderSelector component
- Removed premature `useMemo` optimization in LanguageContext that was causing stale translation contexts

## Planned / Optional Extensions (If Applicable)

- Custom hook for automatically managing i18n dependencies in useCallback/useEffect
- Performance monitoring for i18n-related re-renders
- Automated linting rule to detect missing i18n dependencies

## Pattern Overview

The solution approach is to always include translation functions in React hook dependency arrays, even when it seems like a performance optimization to exclude them. Translation functions are lightweight and their inclusion ensures fresh language context is used when language changes occur, preventing stale closures and bugs.

## Implementation Steps

### Step 1: Identify Translation Functions in Components

[File to create or modify: `src/pages/Home.tsx`]

```typescript
import { useLanguage } from "../../i18n/LanguageContext";

export function Home() {
  const { t } = useLanguage();
  
  // WRONG: Excludes t from dependencies (performance optimization that causes bugs)
  const handleAction = useCallback(() => {
    console.log(t('actionButton'));
  }, []); // BUG: t is stale, won't update with language changes
  
  // CORRECT: Include t in dependencies
  const handleAction = useCallback(() => {
    console.log(t('actionButton'));
  }, [t]); // GOOD: t updates with language changes
}
```

Key points:
- Translation functions (`t`) should always be included in dependency arrays
- The performance impact is minimal compared to the bug risk
- Stale translation functions cause inconsistent UI when language changes

### Step 2: Update useEffect Dependencies for i18n

[File to create or modify: `src/pages/GlobalHistory.tsx`]

```typescript
import { useLanguage } from "../../i18n/LanguageContext";

export function GlobalHistory() {
  const { t } = useLanguage();
  
  // WRONG: Excludes t from dependencies
  useEffect(() => {
    const loadData = async () => {
      const message = t('loadingData');
      console.log(message);
      // ... data loading logic
    };
    loadData();
  }, []); // BUG: Uses stale t function
  
  // CORRECT: Include t in dependencies
  useEffect(() => {
    const loadData = async () => {
      const message = t('loadingData');
      console.log(message);
      // ... data loading logic
    };
    loadData();
  }, [t]); // GOOD: Uses fresh t function when language changes
}
```

Key points:
- useEffect should include translation functions when they're used inside
- This ensures the effect re-runs when language changes
- Prevents async operations from using outdated translation contexts

### Step 3: Handle Multiple Dependencies Properly

[File to create or modify: `src/pages/History.tsx`]

```typescript
import { useLanguage } from "../../i18n/LanguageContext";

export function History() {
  const { t, resetEmployee } = useLanguage();
  const [employeeId, setEmployeeId] = useState(null);
  
  // WRONG: Missing dependencies
  const handleSubmit = useCallback(async () => {
    const message = t('submitting');
    console.log(message);
    await submitData(employeeId);
    resetEmployee();
  }, []); // BUG: Missing t, resetEmployee, and employeeId
  
  // CORRECT: Include all relevant dependencies
  const handleSubmit = useCallback(async () => {
    const message = t('submitting');
    console.log(message);
    await submitData(employeeId);
    resetEmployee();
  }, [t, resetEmployee, employeeId]); // GOOD: All dependencies included
}
```

Key points:
- Include all translation functions used in the callback
- Include any other state or props used in the callback
- Use dependency arrays that match the function's actual dependencies

### Step 4: Remove Premature Optimization from i18n Context

[File to create or modify: `src/i18n/LanguageContext.tsx`]

```typescript
// WRONG: Premature useMemo optimization causing stale contexts
export const LanguageContext = createContext<{
  t: (key: string) => string;
  language: string;
  setLanguage: (lang: string) => void;
}>({
  t: (key: string) => key, // Fallback
  language: 'pt',
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState('pt');
  
  // WRONG: useMemo that creates stale t function
  const t = useMemo(() => {
    return (key: string) => translations[language]?.[key] || key;
  }, [language]); // This is actually correct, but the context value was memoized incorrectly
  
  // CORRECT: Simple, direct approach without premature optimization
  const t = (key: string) => translations[language]?.[key] || key;
  
  return (
    <LanguageContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
```

Key points:
- Avoid premature optimization in i18n contexts
- Translation functions should be simple and direct
- Memoization should only be used when there's a proven performance benefit

## Complete Example

Here's a complete example showing proper i18n dependency management:

```typescript
import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

export function UserProfile() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Properly include t in useCallback dependencies
  const fetchUser = useCallback(async (userId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`);
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error(t('fetchError'), error);
    } finally {
      setLoading(false);
    }
  }, [t]); // Include t because it's used in error handling
  
  // Properly include t in useEffect dependencies
  useEffect(() => {
    if (user?.id) {
      // Use t function inside effect
      console.log(t('userLoaded', { name: user.name }));
    }
  }, [user, t]); // Include both user and t
  
  // Properly include t in event handler
  const handleSave = useCallback(async () => {
    const saveMessage = t('saving');
    console.log(saveMessage);
    
    try {
      await fetch('/api/user', {
        method: 'PUT',
        body: JSON.stringify(user),
      });
      console.log(t('saveSuccess'));
    } catch (error) {
      console.error(t('saveError'), error);
    }
  }, [user, t]); // Include both user and t
  
  return (
    <div>
      <h1>{t('profileTitle')}</h1>
      {loading && <p>{t('loading')}</p>}
      {user && (
        <div>
          <p>{t('name')}: {user.name}</p>
          <button onClick={handleSave}>{t('saveButton')}</button>
        </div>
      )}
    </div>
  );
}
```

## Project-Specific Constraints

- [ ] Translation functions are provided by `useLanguage()` hook from `src/i18n/LanguageContext.tsx`
- [ ] All user-facing text must use translation keys (`t('key')`)
- [ ] Language changes should trigger re-renders in components using translation functions
- [ ] Translation functions are lightweight and don't require memoization for performance

## Anti-Patterns (What NOT to Do)

- ❌ Don't exclude translation functions from `useCallback` dependencies for performance
- ❌ Don't use translation functions in `useEffect` without including them in dependencies
- ❌ Don't create memoized translation contexts that become stale
- ❌ Don't assume translation functions are stable across language changes
- ❌ Don't use hardcoded strings instead of translation keys

## Related Patterns / Docs

- `docs/solutions/patterns/evaluation-platform-error-handling-guide.md` - Contains general i18n patterns but not specifically React hooks dependency management
- `src/i18n/LanguageContext.tsx` - Translation context implementation

## Safe Change Checklist for Future AI Work

1. First file/symbol to update: Check all `useCallback` and `useEffect` hooks that use translation functions
2. Second dependent update: Ensure all translation function dependencies are properly included
3. Cross-layer sync requirement: Verify language changes trigger appropriate re-renders
4. Verification/build/migration/deploy check: Test language switching functionality after changes