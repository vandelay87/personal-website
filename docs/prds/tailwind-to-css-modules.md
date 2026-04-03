# PRD: Migrate Tailwind CSS to CSS Modules

## Overview
Replace the Tailwind CSS dependency with CSS Modules and CSS custom properties. The UI must remain pixel-perfect — this is a purely internal refactor. The goal is to remove the Tailwind build dependency and give direct, explicit control over styles at the component level.

## Problem Statement
Tailwind abstracts away CSS behind utility classes. While productive for rapid development, it reduces direct control over the cascade, specificity, and the exact CSS being generated. Removing Tailwind in favour of CSS Modules gives full ownership of styles with no build-time framework in between, while keeping styles scoped and co-located with their components.

## Goals
- Remove `tailwindcss` and `@tailwindcss/vite` as dependencies entirely.
- Every component has a co-located `.module.css` file managing its own styles.
- Design tokens (colours, spacing, typography, breakpoints) are defined once as CSS custom properties in a global tokens file and consumed everywhere.
- Dark mode continues to work via the existing `data-theme` attribute mechanism.
- All responsive behaviour is preserved using media queries matching Tailwind's default breakpoints.
- CSS is cleaner and more explicit than the Tailwind equivalent — use modern CSS properties where appropriate (e.g. `gap`, `clamp()`, logical properties, `color-mix()`).

## Non-Goals
- No visual changes of any kind — not a redesign.
- Not a migration to a different CSS-in-JS solution (styled-components, Emotion, etc.).
- Not introducing a new component library or design system.
- Not changing any component logic, props, or tests.
- Not adding CSS animations or interactions beyond what already exists.

## User Stories
- As a developer, I want component styles to live alongside the component file so that I can find, edit, and delete styles without searching a global stylesheet.
- As a developer, I want design tokens defined in one place so that changing a colour or spacing value updates the whole site consistently.
- As a developer, I want no Tailwind dependency so that the build has one fewer tool to configure, upgrade, or debug.

## Design & UX
No visual changes. The site must look identical in both light and dark mode across all breakpoints. Every pixel — spacing, typography, colours, transitions, animations, hover states, focus states — must match the current Tailwind output exactly before this is considered done.

## Technical Considerations

### File Structure
Each component gets a co-located CSS Module:
```
src/components/Button/
  Button.tsx
  Button.module.css   ← new
  Button.test.tsx
  index.ts
```

### Global Tokens
Create `src/styles/tokens.css` — imported once in `main.tsx`. Define all design tokens as CSS custom properties on `:root` and override for dark mode via `[data-theme=dark]`:
```css
:root {
  --color-bg: #ffffff;
  --color-text: #111827;
  --color-primary: #4f46e5;
  /* spacing, font sizes, radii, shadows, etc. */
}

[data-theme=dark] {
  --color-bg: #111827;
  --color-text: #f9fafb;
  /* dark overrides */
}
```
This means component CSS Modules reference tokens (`background: var(--color-bg)`) and dark mode works automatically — no per-component dark selectors needed.

### Breakpoints
Define as CSS custom properties or use consistent px values matching Tailwind's defaults:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Tailwind Features That Need Explicit Handling
- **Responsive modifiers** (`md:grid-cols-2`) → standard `@media (min-width: 768px)` in the module file.
- **Dark mode** (`dark:bg-gray-800`) → handled automatically via CSS custom properties on `[data-theme=dark]` (no per-rule overrides needed).
- **Group hover** (`group`, `group-hover:scale-105` on Card) → use `:has()` or pass hover state via JS/React state if `:has()` is insufficient.
- **Peer selectors** (`peer`, `peer-checked:`, `peer-focus-visible:` on ThemeToggle) → replace with explicit React state controlling a class or inline style.
- **Arbitrary values** (`w-[1em]`, `border-[0.15em]`, `ml-[calc(50%-50vw)]`) → write the value directly in CSS — these are already one-to-one.
- **Animations** (`animate-spin`, `animate-pulse`) → define `@keyframes` in a shared `src/styles/animations.css` or inline in the relevant module.
- **Transitions** (`transition-all duration-300`) → write as `transition: all 300ms ease` in the module.

### Dynamic Class Names
Components like `Button` build class strings conditionally based on props (variants, sizes). Continue using `clsx` (or a simple template literal) to compose module class names:
```tsx
import styles from './Button.module.css'
import clsx from 'clsx'

className={clsx(styles.button, styles[variant], disabled && styles.disabled)}
```

### Vite
No config changes required. Vite supports CSS Modules natively — any file named `*.module.css` is automatically scoped.

### Files to Delete / Modify
- Delete `tailwind.config.js`
- Remove `@tailwindcss/vite` from `vite.config.ts` plugins
- Replace `src/index.css` content — remove `@import 'tailwindcss'` and the `@custom-variant` rule; import `tokens.css` instead
- Remove `tailwindcss` and `@tailwindcss/vite` from `package.json` devDependencies

### Components to Migrate (17 files)
`Button`, `Card`, `CVDownload`, `ThemeToggle`, `AppsCta`, `Navigation`, `FullPageHeader`, `Grid`, `Link`, `SocialCard`, `Loading`, `Layout`, `Header`, `Image`, `FileMeta`, `Apps` (page), `NotFound` (page)

### Modern CSS Opportunities
Where Tailwind used workarounds or older patterns, prefer modern equivalents:
- Use `gap` over margin hacks for spacing between flex/grid children.
- Use `clamp()` for fluid typography or spacing where appropriate.
- Use `aspect-ratio` instead of padding-percentage tricks.
- Use CSS logical properties (`margin-inline`, `padding-block`) for directional spacing.
- Ensure `color-scheme` is set on `:root` so native browser UI (scrollbars, inputs) respects dark mode.

## Acceptance Criteria
- [ ] `tailwindcss` and `@tailwindcss/vite` do not appear in `package.json` or `node_modules`.
- [ ] `tailwind.config.js` is deleted.
- [ ] `src/index.css` contains no Tailwind imports or directives.
- [ ] Every component and page that previously used Tailwind classes has a co-located `.module.css` file.
- [ ] No Tailwind utility classes remain in any `.tsx` file.
- [ ] Design tokens are defined in `src/styles/tokens.css` and consumed via CSS custom properties throughout — no hardcoded colour or spacing values in module files.
- [ ] Light mode appearance is pixel-perfect compared to the current Tailwind output.
- [ ] Dark mode (`data-theme="dark"`) appearance is pixel-perfect compared to the current Tailwind output.
- [ ] All responsive layouts (mobile, tablet, desktop) match the current behaviour at `sm` (640px), `md` (768px), and `lg` (1024px) breakpoints.
- [ ] Hover, focus, and active states on interactive elements (Button, Card, Link, Navigation, ThemeToggle) match current behaviour.
- [ ] Loading spinner (`animate-spin`) and pulse animations function identically.
- [ ] ThemeToggle dark/light switching continues to work correctly.
- [ ] All existing Vitest tests pass without modification.
- [ ] Production build (`pnpm build:prod`) completes without errors or warnings related to CSS.
- [ ] Lighthouse accessibility score does not regress (focus indicators must remain visible).

## Open Questions
- Should `clsx` be added as a dependency if not already present, or handle conditional classes with template literals? Check `package.json` before implementing.
- The `Group hover` pattern on `Card` uses CSS class relationships that CSS Modules makes harder — confirm whether `:has()` browser support (baseline 2023, ~95% coverage) is acceptable, or whether React state should manage hover instead.
- Are there any Tailwind classes used in the sand-box app (`apps/sand-box`) that also need migrating, or is that out of scope?
