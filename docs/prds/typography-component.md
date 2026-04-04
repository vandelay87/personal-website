# PRD: Typography Component

## Overview

A reusable Typography component that enforces consistent text styling across the site. It uses a variant + as prop pattern to decouple visual style from semantic HTML, built on top of the existing design tokens. This PRD also covers migrating all existing typography in the codebase to use the new component.

## Problem Statement

Typography styles are currently scattered across individual CSS modules. Each component independently declares font-size, font-weight, line-height, and color for its headings and body text. While the values mostly reference design tokens, there is no single source of truth for what a "section heading" or "body text" should look like. This makes it easy for styles to drift over time and harder to make site-wide typography changes.

## Goals

- Single reusable component for all text rendering across the site
- Consistent typography variants derived from the existing design token system
- Semantic HTML output (correct heading levels, paragraph elements) decoupled from visual style
- Full test coverage written before implementation (TDD)
- WCAG AA accessible by default
- Migration of all existing typography to use the new component

## Non-Goals

- Responsive/fluid typography (clamp-based sizes) — the hero heading currently uses this but it is a one-off layout concern, not a Typography variant. The FullPageHeader can apply responsive overrides via its own CSS module on top of the Typography component.
- Prose/markdown rendering component — this is about individual text elements, not rich text blocks.
- Adding new design tokens — the component uses the existing token set in `src/styles/tokens.css`.
- Changing the current visual appearance of the site — the migration should be a visual no-op.

## User Stories

- As a developer, I want to render a heading with a consistent style so that I don't have to look up which font-size and weight to use each time.
- As a developer, I want to render an element that looks like an h2 but is semantically an h3 so that I can maintain correct heading hierarchy without sacrificing visual consistency.
- As a developer, I want a single component to update when I need to change typography styles site-wide.

## Design & UX

### Component API

```tsx
<Typography variant="heading1">Page Title</Typography>
<Typography variant="heading2">Section Title</Typography>
<Typography variant="heading2" as="h3">Visually h2, semantically h3</Typography>
<Typography variant="body">Regular paragraph text</Typography>
<Typography variant="caption">Small muted text</Typography>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `TypographyVariant` | required | Controls visual style (font-size, weight, line-height, color) |
| `as` | `ElementType` | Derived from variant | Overrides the rendered HTML element |
| `children` | `ReactNode` | required | Text content |
| `className` | `string` | — | Additional CSS class for layout concerns (margin, max-width, etc.) |

### Variants

Derived from the audit of current typography usage across the site:

| Variant | Default element | Font size | Weight | Line height | Color |
|---------|----------------|-----------|--------|-------------|-------|
| `heading1` | `h1` | `--font-size-4xl` (36px) | `--font-weight-bold` (700) | `--line-height-tight` (1.2) | `--color-text-strong` |
| `heading2` | `h2` | `--font-size-3xl` (30px) | `--font-weight-bold` (700) | `--line-height-tight` (1.2) | `--color-text-strong` |
| `heading3` | `h3` | `--font-size-xl` (20px) | `--font-weight-bold` (700) | `--line-height-tight` (1.2) | `--color-text-strong` |
| `heading4` | `h4` | `--font-size-lg` (18px) | `--font-weight-semibold` (600) | `--line-height-tight` (1.2) | `--color-text-strong` |
| `body` | `p` | `--font-size-base` (16px) | `--font-weight-normal` (400) | `--line-height-normal` (1.5) | `--color-text` |
| `bodyLarge` | `p` | `--font-size-lg` (18px) | `--font-weight-normal` (400) | `--line-height-relaxed` (1.7) | `--color-text` |
| `label` | `span` | `--font-size-sm` (14px) | `--font-weight-medium` (500) | `--line-height-normal` (1.5) | `--color-text` |
| `caption` | `span` | `--font-size-sm` (14px) | `--font-weight-normal` (400) | `--line-height-normal` (1.5) | `--color-text-muted` |

### What the component does NOT handle

- Margin/spacing — the consuming component controls this via `className`. Typography is a visual primitive, not a layout component.
- Responsive font sizes — the consuming component applies responsive overrides via its own CSS module (e.g., FullPageHeader's clamp-based hero heading).
- Text alignment — controlled by the parent layout.
- Truncation/line clamping — the consuming component handles this (e.g., Card description).

## Technical Considerations

### File structure

Following project conventions (`src/components/<Name>/<Name>.tsx` with barrel `index.ts`):

```
src/components/Typography/
  Typography.tsx
  Typography.module.css
  Typography.test.tsx
  index.ts
```

### Implementation notes

- Each variant maps to a CSS module class (`.heading1`, `.heading2`, `.body`, etc.)
- CSS classes reference existing design tokens from `src/styles/tokens.css` — no new tokens needed
- The `as` prop uses React's `ElementType` to render the correct HTML element
- Default element mapping is built into the component (variant `heading1` renders `h1` unless overridden)
- `className` prop is merged with the variant class for composability
- No third-party dependencies

### TDD approach

Tests are written first in `Typography.test.tsx` using Vitest + Testing Library, covering:

1. Each variant renders the correct default HTML element
2. The `as` prop overrides the rendered element
3. Each variant applies the correct CSS module class
4. `className` prop is merged with the variant class
5. Children are rendered
6. Accessibility: heading elements have correct roles in the accessibility tree

### Migration plan

After the component is built and tested, migrate existing typography in this order:

1. **AppsCta** — `h2.heading` and `p.body`
2. **CVDownload** — `h2.heading` and `p.paragraph`
3. **SocialCard** — `h2.heading`
4. **Card** — `h2.title` and `p.description`
5. **Apps page** — `h1.heading` and `p.description`
6. **NotFound page** — `h1.heading` and `p.subtext`
7. **FullPageHeader** — `h1.heading`, `p.tagline`, and `p.description` (will need responsive overrides via className)

For each migration:
- Replace the raw HTML element with `<Typography variant="..." className={styles.xxx}>`
- Remove font-size, font-weight, line-height, and color declarations from the CSS module (these are now handled by Typography)
- Keep layout-specific CSS (margin, max-width, text-align, line-clamp, etc.) in the component's own CSS module
- Verify no visual regression

### Accessibility

- Semantic HTML elements are rendered by default (h1-h4 for headings, p for body, span for inline)
- The `as` prop allows correct heading hierarchy regardless of visual style
- All colors use existing CSS custom properties which already support light/dark mode
- No ARIA attributes needed — native HTML semantics are sufficient

## Acceptance Criteria

- [ ] `Typography.test.tsx` exists with all tests written before implementation
- [ ] Typography component renders the correct default HTML element for each variant (`heading1` → `h1`, `body` → `p`, `label` → `span`, etc.)
- [ ] The `as` prop overrides the rendered HTML element (e.g., `variant="heading2" as="h3"` renders an `h3`)
- [ ] Each variant applies the correct font-size, font-weight, line-height, and color from design tokens
- [ ] The `className` prop is merged with the variant class, not replaced
- [ ] All existing typography across the site is migrated to use the Typography component
- [ ] No visual regressions after migration — the site looks identical before and after
- [ ] All existing tests continue to pass after migration
- [ ] `pnpm exec eslint --fix` passes on all changed files

## Open Questions

- Should `ThemeToggle`'s label span and `FileMeta`'s monospace text be migrated? These are highly specific UI elements where a Typography component may be over-abstraction. Recommend leaving them as-is for now.
