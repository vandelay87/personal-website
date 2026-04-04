# PRD: Site Redesign — Modern Minimal Brutalist

## Overview

Redesign akli.dev with a modern neo-brutalist aesthetic. The site was recently migrated from Tailwind to CSS Modules, but the visual result drifted from the original without a clear design direction. This PRD defines that direction: clean, minimal, blocky, with generous whitespace and zero decorative animation. The goal is a portfolio that looks intentional and distinctive — not generic, not cluttered.

## Problem Statement

The Tailwind-to-CSS-Modules migration was scoped as a pixel-perfect refactor but introduced unintentional visual changes (shadow style, border radius, spacing, typography weight). Rather than patch those regressions back to the old Tailwind look, this is an opportunity to simplify the design with a clear, cohesive visual language.

The current state has:
- Too many animation/transition layers (hero stagger, image scale, fade-ins)
- Inconsistent design tokens (some brutalist, some soft)
- No clear visual identity — caught between the old Tailwind design and a half-applied new one

## Goals

- Establish a cohesive neo-brutalist visual language across all components
- Simplify: fewer design tokens, fewer visual effects, fewer moving parts
- Fast — system font stack, no external font requests, no heavy animations
- Accessible — WCAG AA contrast ratios, visible focus indicators, semantic HTML, reduced-motion support
- Maintain dark mode with a smooth, functional theme toggle

## Non-Goals

- No new pages or routes
- No new functionality or features
- No changes to component logic, props, or data
- No migration away from CSS Modules — this builds on the existing module files
- No responsive layout changes — keep existing breakpoints and layout structure
- Not adding a component library or design system tooling (Storybook, etc.)

## Design Direction

### Visual Identity

**Modern neo-brutalist**: blocky elements with sharp edges, high contrast, bold typography, and generous whitespace. The "modern" qualifier means: restrained color palette, clean type hierarchy, no gratuitous decoration. Think engineer's notebook, not punk zine.

### Reference sites

- **rauno.me** — the whitespace, system fonts, and restraint. How little you need.
- **leerob.com** — content-first, neutral palette, no visual noise.
- **Neo-brutalist patterns** — thick borders, hard offset shadows, flat/no border-radius, bold weight headings.

The target sits between these: the cleanliness of rauno/leerob with the structural boldness of neo-brutalism.

### Design Principles

1. **Subtract, don't add.** If a style doesn't serve readability or hierarchy, remove it.
2. **Flat and honest.** No soft shadows, no gradients, no blur. Hard edges, solid colors.
3. **Whitespace is a feature.** Generous padding and margin. Let elements breathe.
4. **Functional motion only.** Theme toggle slides. Hover states shift. Nothing else moves.
5. **System-native.** System fonts. Respect OS preferences. No external dependencies for rendering.

---

## Design Specification

### Typography

Use system font stacks — zero external font requests.

```css
--font-sans:  system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-mono:  ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace;
```

| Role | Size | Weight | Font |
|------|------|--------|------|
| Page heading (h1) | `clamp(--font-size-4xl, 6vw, --font-size-5xl)` | 800 (extrabold) | `--font-sans` |
| Section heading (h2) | `--font-size-3xl` (1.875rem) | 700 (bold) | `--font-sans` |
| Body text | `--font-size-base` (1rem) | 400 (normal) | `--font-sans` |
| Small / meta text | `--font-size-sm` (0.875rem) | 400 | `--font-sans` |
| Code / mono accents | `--font-size-sm` | 400 | `--font-mono` |

Simplify the font size scale. Remove sizes that aren't used:

```css
--font-size-sm:   0.875rem;  /* 14px */
--font-size-base: 1rem;      /* 16px */
--font-size-lg:   1.125rem;  /* 18px */
--font-size-xl:   1.25rem;   /* 20px */
--font-size-2xl:  1.5rem;    /* 24px */
--font-size-3xl:  1.875rem;  /* 30px */
--font-size-4xl:  2.25rem;   /* 36px — responsive heading */
--font-size-5xl:  3rem;      /* 48px — page heading */
```

Remove `--font-size-xs` and `--font-size-6xl` (unused extremes).

Add `--font-weight-extrabold: 800` for the page heading.

Line heights:
```css
--line-height-tight:   1.2;
--line-height-normal:  1.5;
--line-height-relaxed: 1.7;
```

### Colors

High contrast, minimal palette. One accent color.

**Light mode:**
```css
--color-bg:            #FFFFFF;
--color-bg-subtle:     #F5F5F5;
--color-surface:       #FFFFFF;
--color-text:          #1A1A1A;
--color-text-strong:   #000000;
--color-text-muted:    #666666;
--color-border:        #000000;
--color-border-subtle: #E5E5E5;
--color-primary:       #2563EB;  /* blue-600 — links, buttons, accents */
--color-primary-hover: #1D4ED8;  /* blue-700 */
--color-error:         #DC2626;
```

**Dark mode:**
```css
--color-bg:            #0A0A0A;
--color-bg-subtle:     #171717;
--color-surface:       #141414;
--color-text:          #E5E5E5;
--color-text-strong:   #FFFFFF;
--color-text-muted:    #A3A3A3;
--color-border:        #FFFFFF;
--color-border-subtle: #2E2E2E;
--color-primary:       #60A5FA;  /* blue-400 — better contrast on dark */
--color-primary-hover: #93C5FD;  /* blue-300 */
--color-error:         #F87171;
```

**Remove:** all gradient tokens, secondary color set (unused after SocialCard simplification), placeholder gradient tokens. If a component needs a one-off color, use the color directly in the module file with a comment.

### Borders

```css
--border-width:       2px;
--border-width-thick: 3px;
```

Default border: `var(--border-width) solid var(--color-border)` — black in light mode, white in dark mode.

Use `--color-border-subtle` for dividers and non-interactive element borders (e.g., section separators).

### Border Radius

Brutalist = sharp corners. Minimal radius.

```css
--radius-none: 0;
--radius-sm:   2px;   /* slight softening — buttons, cards, inputs */
--radius-full: 9999px; /* toggle thumb, profile image */
```

Remove `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`. Most elements should use `--radius-sm` or `--radius-none`.

### Shadows

Hard offset shadows only. No blur.

```css
--shadow-sm:  2px 2px 0 var(--color-border);
--shadow-md:  4px 4px 0 var(--color-border);
--shadow-lg:  6px 6px 0 var(--color-border);
```

Remove all existing soft shadows (`--shadow-md`, `--shadow-xl`).

### Spacing

Keep the existing scale but remove unused values. The scale should be:

```css
--space-1:   0.25rem;  /* 4px  */
--space-2:   0.5rem;   /* 8px  */
--space-3:   0.75rem;  /* 12px */
--space-4:   1rem;     /* 16px */
--space-6:   1.5rem;   /* 24px */
--space-8:   2rem;     /* 32px */
--space-10:  2.5rem;   /* 40px */
--space-12:  3rem;     /* 48px */
--space-16:  4rem;     /* 64px */
--space-20:  5rem;     /* 80px */
```

Remove `--space-5` and `--space-7` (rarely used half-steps — use adjacent values instead).

### Transitions

Only functional transitions. No entrance animations, no stagger delays, no keyframe animations except the loading spinner and theme toggle.

```css
--duration-fast: 150ms;
--duration-base: 200ms;
--easing-default: ease;
```

Remove `--duration-slow`, `--duration-slower`, `--duration-image`, `--easing-in-out`, `--easing-out`.

---

## Component-Level Specifications

### FullPageHeader (Hero)

The homepage hero. Simplify dramatically.

- **Remove** all entrance animations (greeting fade-in, heading stagger, tagline delay, etc.)
- **Remove** the separate "greeting" element — integrate into the heading or remove entirely
- Layout: two-column at `md` (768px), stacked on mobile. Text left, image right.
- Heading: `clamp(var(--font-size-4xl), 6vw, var(--font-size-5xl))`, weight 800, `--color-text-strong` — should feel large and commanding
- Tagline: `--font-size-xl`, weight 400, `--color-text-muted`
- Description: `--font-size-lg`, `--color-text`, max-width `60ch` for readability
- Profile image: `border-radius: var(--radius-sm)` (rectangular, matching brutalist aesthetic), `border: var(--border-width-thick) solid var(--color-border)`, `box-shadow: var(--shadow-md)`. Keep original aspect ratio (`3/4`) and responsive max-widths (320px → 512px across breakpoints) — do not shrink.
- CTA button area: simple horizontal layout with `gap: var(--space-4)`

### Button

- Solid fill for primary: `background: var(--color-primary)`, white text
- Border: `var(--border-width) solid var(--color-border)`
- Shadow: `var(--shadow-sm)`
- Border-radius: `var(--radius-none)` — square corners so the shadow connects flush with the button edge
- Hover: shift shadow to `0 0 0` and translate `2px 2px` (press-down effect)
- Focus: `outline: 2px solid var(--color-primary)`, `outline-offset: 2px`
- Padding: `var(--space-2) var(--space-6)` (vertical horizontal)
- Font: `--font-weight-semibold`, `--font-size-base`
- Remove secondary variant if unused. If kept, use outline style: transparent background, border + text in `--color-text`, same hover behavior.
- Disabled: `opacity: 0.5`, `cursor: not-allowed`

### Card

- Background: `var(--color-surface)`
- Border: `var(--border-width) solid var(--color-border)`
- Shadow: `var(--shadow-md)`
- Border-radius: `var(--radius-none)` — square corners, consistent with buttons
- Hover: translate `(-4px, -4px)`, shadow grows to `var(--shadow-lg)`. Transition: `var(--duration-fast)`
- Image inside card: `object-fit: cover`, no border-radius (flush with card edges)
- Content padding: `var(--space-6)`
- Remove any image zoom/scale effects on hover

### Grid

- No changes to grid logic. Keep responsive columns.
- Ensure `gap: var(--space-6)` between cards

### Navigation

- Horizontal nav links, `gap: var(--space-6)`
- Links: `--color-text`, no underline by default
- Hover: `--color-primary`
- Active/current: `--color-primary`, `font-weight: var(--font-weight-semibold)`
- Keep `aria-label="Main navigation"`

### Header

- `position: sticky`, `top: 0`, `z-index: var(--z-header)`
- Background: `var(--color-bg)` with no transparency/blur — solid background
- Border-bottom: `var(--border-width) solid var(--color-border-subtle)`
- Padding: `var(--space-4) var(--space-6)`
- Remove any backdrop-filter or overlay background

### ThemeToggle

- Keep the sliding toggle interaction — this is a functional animation
- Track: `width: 2.5rem`, `height: 1.5rem`, `border-radius: var(--radius-full)`, `border: var(--border-width) solid var(--color-border)`
- Track unchecked: `background: var(--color-bg-subtle)`
- Track checked: `background: var(--color-primary)`
- Thumb: `width: 1rem`, `height: 1rem`, `border-radius: var(--radius-full)`, `background: var(--color-bg)`, `border: var(--border-width) solid var(--color-border)`
- Thumb slides with `transform: translateX()` and `transition: transform var(--duration-fast) var(--easing-default)`
- Sun/moon icons: keep but simplify — use `currentColor`, position inside or adjacent to track
- Focus: visible ring on the toggle input

### Link

- Color: `var(--color-primary)`
- Underline: `text-decoration: underline`, `text-underline-offset: 2px`
- Hover: `var(--color-primary-hover)`
- Remove border-bottom approach — use native text-decoration (simpler, better with descenders)
- Font-weight: inherit from parent (remove forced semibold)

### SocialCard

- Component exists but is not currently used on any page
- **No changes needed.** Skip during implementation. If reintroduced later, style it as a simple horizontal list of icon links with hover color change.

### Image

- Border: `var(--border-width) solid var(--color-border)`
- Border-radius: `var(--radius-sm)` (or `--radius-full` for profile image — set via prop/class)
- Remove scale-in animation on load — image just appears
- Remove pulse/placeholder gradient animation — use a flat `var(--color-bg-subtle)` placeholder
- Error state: flat background, muted text, icon centered
- Loading spinner: keep `@keyframes spin` (functional)

### Loading

- Keep `@keyframes spin` for the spinner
- Spinner: `border: var(--border-width-thick) solid var(--color-border-subtle)`, `border-top-color: var(--color-primary)`, `border-radius: var(--radius-full)`
- Remove any pulse animations

### AppsCta

- Simple section with top border: `border-block-start: var(--border-width) solid var(--color-border-subtle)`
- Remove gradient backgrounds entirely
- Padding: `var(--space-12) 0`
- Text + button, left-aligned or centered

### CVDownload

- Same treatment as AppsCta — bordered section, no gradient
- Clean layout: icon/label + download button

### FileMeta

- `font-family: var(--font-mono)`
- `font-size: var(--font-size-sm)`
- `color: var(--color-text-muted)`
- Simple list, no decoration

### Layout

- `.main`: `min-height: 100vh`
- `.withHeader`: proper padding-top to clear sticky header, `max-width: var(--max-w-site)`, centered with `margin-inline: auto`, `padding-inline: var(--space-6)`
- `--max-w-site: 64rem` (1024px) — tighter than before for better readability

### NotFound (404)

- Large heading: `clamp(var(--font-size-4xl), 8vw, var(--font-size-5xl))`, `--font-weight-extrabold`
- Subtext: `--font-size-lg`, `--color-text-muted`
- Centered vertically and horizontally
- Keep responsive — heading can scale down with `clamp()` if needed
- Link back to home

### Apps Page

- Heading: `--font-size-4xl`, `--font-weight-bold`
- Cards grid below
- Simple, no special treatment

---

## Global Styles (index.css)

- Remove all theme transition effects (the `transition: background-color, color...` on everything). These cause flash on page load and add complexity.
- Keep `.sr-only` utility
- Set `body { font-family: var(--font-sans); color: var(--color-text); background: var(--color-bg); line-height: var(--line-height-normal); }`
- Remove any global animation imports except the loading spinner keyframes

## Animations File (animations.css)

- Keep only `@keyframes spin` for the loading spinner
- Remove all entrance animations, pulse, fade-in, stagger keyframes
- Add `@media (prefers-reduced-motion: reduce)` to disable the spinner for users who prefer reduced motion

## Technical Considerations

### Token Cleanup

The current `tokens.css` has ~200 lines of tokens, many inherited from Tailwind's full scale. This redesign should reduce it to ~80-100 lines. Remove:
- All gradient tokens
- Secondary color set (keep primary + error only)
- Unused spacing steps (`--space-5`, `--space-7`)
- Unused radius values (`--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`)
- Soft shadow values
- Excess transition durations/easings
- Size tokens that can be replaced with spacing tokens or hardcoded in the one component that uses them

### Implementation Order

1. **Tokens** — rewrite `tokens.css` with the simplified token set
2. **Global styles** — update `index.css`, clean up `animations.css`
3. **Layout + Header + Navigation** — structural components first
4. **FullPageHeader** — the most complex component, biggest visual change
5. **Button + Link** — interactive primitives
6. **Card + Grid** — content display
7. **ThemeToggle** — functional animation component
8. **Image + Loading** — media components
9. **Remaining** — AppsCta, CVDownload, FileMeta, NotFound, Apps page

### What NOT to Change

- Component file structure (keep co-located `.module.css`)
- Component props and logic
- Router configuration
- Test files (tests should still pass — they test behavior, not styles)
- Dark mode mechanism (`data-theme` attribute)
- Breakpoint values (640, 768, 1024px)

## Acceptance Criteria

- [ ] Site uses system font stack — no external font requests (no Google Fonts links in `index.html`)
- [ ] `tokens.css` contains fewer than 100 custom property declarations
- [ ] No gradient tokens remain in `tokens.css`
- [ ] All shadows use hard offset (no `blur-radius` in any shadow value)
- [ ] All border-radius values are either `0`, `2px`, or `9999px`
- [ ] No `@keyframes` declarations exist except `spin` (loading spinner)
- [ ] No entrance/stagger/fade animations on any component
- [ ] Theme toggle thumb slides smoothly between positions
- [ ] All interactive elements (buttons, links, cards, toggle) have visible `:focus-visible` outlines
- [ ] WCAG AA contrast ratio met for all text/background combinations in both themes (minimum 4.5:1 for body text, 3:1 for large text)
- [ ] Dark mode toggles correctly and all components render properly in both themes
- [ ] Button hover produces a "press-down" effect (shadow collapses, element translates)
- [ ] Card hover produces a "lift" effect (shadow grows, element translates)
- [ ] Profile image displays as a rectangle (border-radius: 2px) with thick border and hard shadow, at full responsive sizes
- [ ] 404 page heading is large, bold, and centered
- [ ] No `transition` properties on `background-color` or `color` at the global/body level
- [ ] `@media (prefers-reduced-motion: reduce)` disables the loading spinner animation
- [ ] All existing Vitest tests pass without modification
- [ ] Production build (`pnpm build:prod`) completes without errors
- [ ] Lighthouse accessibility score >= 95

## Open Questions

- Should the profile image on the hero keep a hard shadow, or is the thick border enough? (Try both during implementation and pick whichever looks cleaner.)
- Is `--max-w-site: 64rem` (1024px) too narrow for the hero two-column layout? May need to bump to `72rem` (1152px) if it feels cramped at `md` breakpoint.
- Should the Apps page cards use the same hard shadow style, or a subtler `--shadow-sm`? Depends on how many cards are shown — too many shadows can feel noisy.
