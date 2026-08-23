# ADR-002: Adopt Tailwind CSS v4 + shadcn/ui for the Frontend

**Date:** 2026-08-23
**Status:** Accepted
**Deciders:** Case Tecnico Team (user-approved during unplanned UI improvement session)

## Context

The frontend originally styled every component with inline `style` objects and hand-written CSS custom properties. This decision reverses an earlier constraint recorded in the implementation plan (`docs/plans/20260817203000-case-tecnico-avaliacao-plan.md`, ~line 1063: "no external CSS/UI library").

The inline-style approach produced real defects:

- Collapsed sidebar rendered labels with `whiteSpace: nowrap` inside a fixed-width column, spilling text over the content area.
- The employee ID / language switcher controls lived in mutually-exclusive sidebar-footer branches, disappearing entirely on mobile.
- A double-margin bug (`marginLeft: 250px` on a flex child) misaligned the main region.

Fixing these by hand meant re-implementing layout, theming, and accessible primitives that mature libraries provide for free.

## Decision

Adopt Tailwind CSS v4 (CSS-first configuration, no `tailwind.config.js`) plus shadcn/ui as the styling and component system:

- **Tailwind v4.3.3** via `@tailwindcss/vite`; theme lives entirely in `src/index.css` using oklch design tokens (including success/warning/chart scales) mapped through `@theme inline`.
- **shadcn/ui primitives vendored** into `src/components/ui/` (button, card, table, badge, input, separator, tooltip, sheet, sidebar, dropdown-menu, skeleton). Unused primitives (`dialog.tsx`, `label.tsx`, `native-select.tsx`) were deleted after review.
- **Supporting libraries:** `radix-ui` (monolith), `lucide-react` icons, `class-variance-authority` + `clsx` + `tailwind-merge` exposed as `cn()` in `src/lib/utils.ts`.
- App components keep explicit prop interfaces and all user-facing strings continue flowing through `t()`.

## Consequences

### Positive
- Collapsed-sidebar overflow and disappearing footer controls fixed structurally (DOM-level conditional rendering via `useSidebar()`)
- Accessible primitives (focus management, keyboard nav, ARIA) inherited from Radix instead of hand-rolled
- Design tokens centralize light/dark theming; base-layer 44px touch-target rule enforces accessibility
- Vendored files stay stock so future `shadcn` CLI updates remain diffable

### Negative
- Reverses the plan's "no external library" constraint — bundle grows (Radix, lucide)
- `size="sm"` buttons render ≥44px tall because the touch-target rule intentionally exempts only icon sizes (accessibility-first trade-off)
- Vendored `sheet.tsx` ships a hardcoded English sr-only "Close" label (known gap; documented below)
- Unused `--chart-*`/`--warning` tokens kept per stock template convention

### Known Limitations

#### sheet.tsx:78 Hardcoded English "Close" Label
**Issue:** The vendored `src/components/ui/sheet.tsx` contains a hardcoded English sr-only "Close" label at line 78:
```tsx
<span className="sr-only">Close</span>
```

**Impact:** This label is accessible to screen reader users when the sheet is open on mobile devices, but it's always in English regardless of the app's current language setting.

**Resolution:** This is documented as a known limitation rather than fixed because:
1. **Policy violation:** Editing vendored stock primitives would break the "stock for CLI diffs" principle
2. **Low impact:** The label is sr-only (screen reader only) and in a rarely-used mobile drawer
3. **Trade-off:** Maintaining diffability with shadcn CLI updates is prioritized over this edge case

**Future options:**
- Wait for shadcn/ui to provide i18n support for built-in labels
- Create a custom sheet component wrapping the stock primitive (complex for this edge case)
- Accept the limitation as-is for this demo application

## References

- `docs/architecture.md` §Technology Stack, §Frontend Modules
- Plan decision reversed: `docs/plans/20260817203000-case-tecnico-avaliacao-plan.md`
- Review agents: julik-frontend-races-reviewer, kieran-typescript-reviewer, code-simplicity-reviewer
