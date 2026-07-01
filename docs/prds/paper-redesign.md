# PRD: akli.dev Warm Editorial "Paper" Redesign

> Canonical design source of truth: `docs/design/paper/` (`README.md` + `design_system/`). This supersedes `docs/prds/redesign.md` (old neo-brutalist direction — now deprecated).

## Overview

Re-implement every screen and shared primitive of akli.dev against the `docs/design/paper/` design system, moving the fully-built app from its current **neo-brutalist** look to a **warm editorial "paper"** aesthetic. Adopt the new tokens, self-hosted fonts, soft-elevation visual language, and the design's signature interactions (icon-nudge, card lift, filter/search, autosave, toasts, dialogs, URL query sync). Simultaneously upgrade the DOM from prototype div-soup to semantic HTML5 and bring every page to **WCAG 2.2 AA**. The design is the source of truth for how the app **looks and behaves** — visual architecture, spacing, color, layout, and interaction — but it is **not a code spec.** Claude Code owns every code decision and applies clean-code / best-practice judgment: free to add, remove, rename, or restructure components, props, hooks, and tokens wherever that is genuinely cleaner. The only thing to avoid is **gratuitous churn** — don't rename or re-architect working code *merely* to mirror the prototype's names when there's no engineering benefit (e.g. renaming the `theme` storage key to `akli-theme`). We restructure DOM freely for semantics, accessibility, and SEO.

This is a **re-skin + interaction-adoption + accessibility/semantics overhaul** of an already-built app — not a greenfield build and not a feature project.

## Problem Statement

The site (akli.dev) is fully built — React 19 + TS + Vite 7 + CSS Modules + React Router v7, ~38 components, 12 routes (6 public + 5 admin + 404), SSR-capable. It currently ships a neo-brutalist system (pure-white bg, `#000` 2px hard borders, hard-offset shadows, `--radius-none`, system fonts). That direction has been superseded by the `docs/design/paper/` redesign, and the two are mutually exclusive — radii, borders, shadows, fonts, accent, and text hierarchy all differ.

- The design prototypes are inline-styled `.dc.html` files with div-soup, `role="button"` divs, visual-only state (`data-checked`, `data-active`), missing `aria-live` regions, no admin skip links, and `alt=""` on meaningful images — none of which should ship as-is.
- Behaviors the design specifies (blog `?tag=` filter, recipes search + tag filter, ingredient check-off, publish checklist, autosave states, toasts, confirm dialogs) already exist in the codebase in varying completeness. They are **restyled** to the design's look/UX — kept as-is where the code is sound, refactored where that's genuinely cleaner, but not churned merely to match the prototype's internal naming.

## Goals

1. Every one of the 12 routes and all shared primitives match the `docs/design/paper/` spec in both light and dark themes.
2. A single tokens layer (`src/styles/tokens.css`) replaces the neo-brutalist tokens with the paper system (semantic `--color-*` + short aliases), consumed by all CSS Modules.
3. Geist + JetBrains Mono are **self-hosted** (woff2, `font-display: swap`), no third-party font requests.
4. Light/dark theming looks correct in both themes on every screen, with **no theme flash on load**. Keep the existing `localStorage('theme')` key (no gratuitous rename) and `data-theme` on the root; the toggle is restyled to the design's icon button.
5. Every page passes automated a11y checks (`vitest-axe` in tests + `eslint-plugin-jsx-a11y` at lint time) and meets WCAG 2.2 AA: semantic landmarks, heading order, focus management, `aria-live` for async status, real dialog semantics, labelled controls.
6. The existing Vitest suite stays green; new behavior/a11y tests cover the adopted interactions.
7. `CLAUDE.md` is updated to describe the new system (removing the neo-brutalist / `--radius-none` mandate and stale facts).

## Non-Goals

- **No new product features** beyond what the design shows. Adopting design-specified interactions is in scope; inventing capability is not.
- **No API/contract changes.** Auth (Cognito), recipes/users/image APIs, routes, and data models are unchanged. Any design behavior with no backing endpoint is flagged as a follow-up, not stubbed into product.
- **No _gratuitous_ churn to mirror the prototype.** Don't rename working identifiers or re-architect sound code *merely* because Claude Design named/built it differently — e.g. keep the `theme` localStorage key and the existing `?tag=` filter param (used by **both** blog and recipes today; the design's `?category=` is not adopted). (Claude Code remains free to change props, components, hooks, or structure wherever it yields cleaner code — see Design & UX. This is a ban on pointless churn, not on improvement.)
- **No pixel/visual-regression testing** (no Playwright screenshots in CI this iteration).
- **No shipping** of the `.dc.html` prototypes, `pages/support.js`, or any design-time affordance (the bottom preview "state switchers", `data-props` toggles).
- **No migration off CSS Modules** or React Router; **no design-system tooling** (Storybook) added.
- Not building a real architecture-diagram renderer beyond the existing MDX/Mermaid pipeline. (Ingredient check-off **is** persisted — see Resolved Decisions.)

## User Stories

- As a **visitor**, I want a calm, legible, fast site in my preferred light/dark theme so that reading blog posts and recipes is pleasant on any device.
- As a **keyboard / screen-reader user**, I want proper landmarks, focus management, and announced status changes so that I can navigate, filter, and operate every control without a mouse.
- As a **reader**, I want to filter the blog by tag and search/filter recipes so that I can find content quickly, with the active tag reflected in a shareable URL.
- As the **admin (Akli)**, I want the recipe editor's autosave, slug locking, image processing, and publish checklist to keep behaving correctly (restyled to the new look) so that I can author recipes confidently without a manual save button.
- As the **admin**, I want a clear, accessible preview of how a recipe will look published so that I can verify before publishing.

## Design & UX

**Source of truth:** `docs/design/paper/README.md` (screen-by-screen intent) and `docs/design/paper/design_system/` (tokens, component contracts `<Name>.d.ts`, usage `<Name>.prompt.md`, `_helpers.css`, `ui_kits/`, `guidelines/`). Where they disagree **on visuals, layout, or UX, the design wins.** The design is **not** a code spec: Claude Code owns implementation (naming, storage keys, URL params, prop APIs, hooks, structure) and applies clean-code judgment — change what's genuinely cleaner, keep what's sound, and don't churn working code *merely* to mirror the prototype. The design's `<Name>.d.ts` prop contracts show *what states/variants must exist visually*, not a prop API to adopt verbatim.

### Visual language (from `design_system/readme.md`)

Warm paper (never pure white), generous whitespace, narrow reading columns (1080 shell / 720 index / 680 article / ~54ch hero), quiet 1px hairlines, soft blurred low-opacity shadows reserved for toasts/dropdowns/dialogs, single blue accent used sparingly, 4-step ink-on-paper text hierarchy. Dark mode is a true warm near-black (`#141310`, not blue-black). Restrained motion (`.18–.25s ease`), spinner + shimmer for async, blur only on the sticky header. **All motion respects `prefers-reduced-motion`.** First-person, plain, dry copy; sentence case except mono uppercase eyebrows; `·` mid-dot meta separators; emoji only in the 3 Callout glyphs.

### Design tokens → `src/styles/tokens.css` (full replacement)

Two layers per the spec: semantic `--color-*` (light on `:root`, dark under `[data-theme="dark"]`) **and** short aliases (`--bg`, `--surf`, `--field`, `--text`→text-strong, `--subtle`→text, `--muted`, `--faint`, `--line`, `--accent`, `--btn-bg/-fg`, `--green/-bg`, `--amber/-bg`, `--danger/-bg`). Copy exact values from `design_system/tokens/`. Key migration deltas (old → new):

| Aspect | Old (neo-brutalist) | New (paper) |
|---|---|---|
| bg | `#FFFFFF` | `#FBFAF7` (dark `#141310`) |
| surface | `#FFFFFF` | `#F4F1EA` (dark `#1C1A15`) |
| text | 1 muted step | 4 steps: strong `#1C1A16` / body `#3A3631` / muted `#6F6961` / faint `#767066` (AA-adjusted from design `#9A938A`) |
| border | `#000` 2px | `#ECE6DA` 1px hairline (+ `-strong #E0DACE`) |
| accent | `#2563EB` | `#1F66E0` (dark `#6BA0FF`) |
| shadow | hard offset `4px 4px 0` | soft: `sm 0 1px 2px/.05` · `md 0 4px 14px/.08` · `lg 0 12px 30px/.16` · `xl 0 24px 60px/.28` |
| radius | `0` / `2px` | `sm 6 · md 10 · lg 12 · xl 16 · 2xl 18 · full 999` |
| fonts | system stacks | Geist (sans) + JetBrains Mono (mono) |

Also net-new vs old: `--color-field`, `--color-hover`, `--color-*-bg` status tints, `--btn-*`, fluid `--font-display-hero/-title/-h2` (`clamp()`), fixed 11→56px size scale, tracking tokens (`--tracking-eyebrow .16em`, `-meta .04em`, `-tight -.03em`, `-snug -.02em`), line-heights (1.08→1.75), `--ring` focus token, `--max-w-reading/-article/-prose`, `--z-overlay/-toast`, `--duration-fast 180 / -base 250`. Import order per `styles.css`: fonts → colors → typography → spacing → helpers.

The `_helpers.css` `.ds-*` interaction utilities (link nudge, card lift+zoom, field focus ring, tag/suggest/upload/danger chip hovers, toggle hover, sticky-header blur, spinner, shimmer, reduced-motion block) encode the design's _behaviors_, but do **not** ship the global `.ds-*` class contract into this CSS-Modules codebase — global classes force `:global()`/string refs that break module scoping and `composes` (and the css-engineer conventions forbid gratuitous `:global`). **Port the behaviors into the relevant component `.module.css` files.** While porting, fix two source issues: drop the `!important` on `.ds-field:focus`, and use **`:focus-visible`** (not `:focus`) for the ring. **The reduced-motion handling is mandatory** and must cover per-module transitions too (see a11y notes), not only the shared spinner/shimmer.

**Alias footgun:** `--text` resolves to `text-strong` (strongest ink) while `--subtle` resolves to `--color-text` (body). Components today consume `--color-text` for body — an engineer reaching for `--text` gets the strongest ink by mistake. Prefer the semantic `--color-*` names in consumers, or add a lint note.

### Fonts (self-hosted)

Replace the design's `fonts.css` Google-Fonts `@import` with self-hosted woff2. **Manual self-host, deliberately not Fontsource** — no font npm dependency; commit the `.woff2` files to the repo (keeps `package.json` lean). Place files in `src/assets/fonts/` (**`.woff2` only**, only the weights used) and declare `@font-face` in a plain CSS file (`src/styles/fonts.css`) using **relative `url("../assets/fonts/*.woff2")`** — Vite's CSS asset pipeline hashes/fingerprints them automatically; no JS-side import needed. Faces: Geist 400/500/600/700 + JetBrains Mono 400/500, `font-display: swap`. Ship the official **latin** files (no manual subsetting). **Include each font's `OFL.txt`** in `src/assets/fonts/` (both are SIL Open Font License — the license must travel with the redistributed font). `--font-sans`/`--font-mono` reference the family names with the existing system-stack fallbacks. No `<link>` to fonts.googleapis.com.

**FOUT/CLS mitigation (required — `swap` guarantees a flash otherwise):** (a) `<link rel="preload" as="font" type="font/woff2" crossorigin>` the critical faces (Geist 400/500) in the document `<head>`; (b) add a metric-matched fallback `@font-face` (`size-adjust`/`ascent-override`/`descent-override`) so the system fallback holds layout and CLS ≈ 0. `unicode-range` only helps if we generate subsets — omit it unless we commit to subsetting.

### Theming

- **No theme flash on load is in scope** (a quality goal; the approach is Claude Code's call). Recommended: a tiny blocking inline script in the document `<head>` that reads the persisted theme with a `prefers-color-scheme` fallback (wrapped in `try/catch`) and sets `data-theme` on `<html>` **before first paint**. Keep `data-theme` on `document.documentElement`.
- **Keep the existing `localStorage('theme')` key** — don't rename it to the prototype's `akli-theme` (a migration with no benefit that would drop users' saved preference). Whether the toggle stays self-contained or moves behind a small `useTheme`/context is Claude Code's call — pick the cleaner option. If theme-dependent SSR markup risks a hydration mismatch, resolve it cleanly (read from `data-theme`, or mount-gate the toggle's stateful attributes).
- **Restyle the toggle's markup** to the design's 32px round icon button (☾/☀, `aria-label`), replacing the current checkbox-switch.
- **Filter state:** derive `activeTag` from `useSearchParams` on every render — do **not** mirror the URL into `useState` (desyncs on back/forward). Both `Blog.tsx` and `Recipes.tsx` already read `?tag=` correctly (recipes filter on `recipe.tags`); preserve the pattern and the shared `?tag=` param name.

### Shared shell & primitives (component mapping)

Reuse existing folders where names match; add/rename/delete per the design. Representative mapping (design component → repo action):

- **Header** (`navigation/Header`): rebuild as one component, `variant: 'public' | 'admin'`, sticky translucent blur, `<nav aria-label>`, active link `aria-current="page"` (public headers currently lack it). Renders the existing self-contained `ThemeToggle`; absorbs repo `Navigation` + `Header` wiring. Public: brand + Apps/Recipes/Blog + toggle. Admin: brand + Recipes/Users + email + Log out + toggle. **Login uses a third "logged-out" header** (brand + "Admin" + toggle, no nav/logout).
- **Footer**: new small shared component (public: `<nav aria-label="Elsewhere">` GitHub/LinkedIn/Email as `<ul><li>` + "akli.dev"; admin: two spans). Reuse the existing links from `SocialCard`: GitHub `https://github.com/vandelay87`, LinkedIn `https://www.linkedin.com/in/akli-aissat-b08119115/`, Email `mailto:akliaissat@outlook.com`. Currently footer is ad hoc.
- **Core:** `Button` — extend/refactor the API to cleanly express the design's visual variants the app needs (a destructive style, an outline style, a pill vs default shape, optional `loading` and leading/trailing icon). Choosing the cleanest variant naming is Claude Code's call — rename `primary`/`secondary` to something like `solid|outline|danger` if that's genuinely cleaner, or keep and extend them; don't force new visuals into an ill-fitting existing shape, and update all callers whichever way you go. `Card`, `Link` (add `tone`, `nudge`, `icon`), `Tag` (new component — chip/filter `as span|button`, `active` → `aria-pressed`, `removable`), `StatusBadge` (extend to the design's tones + dot).
- **Forms:** `Input` (add `prefixIcon`/`suffix`, `invalid`→`aria-invalid`), `Textarea`, `TagInput` — restyle to the design's chips + suggestions; keep the existing API (`tags`/`onChange`/`existingTags`) unless a change is genuinely cleaner (don't rename to the prototype's props just to match). `ImageUpload` (three visual states `empty|processing|ready`; **cover dropzone must be a real `<button>` or `<label>`+hidden file input**, not a `role="button"` div; wire collected alt → `<img alt>` — keep the existing upload/S3 logic; refine props only if cleaner).
- **Feedback:** `AutosaveStatus` (`saving|saved|error`+retry, wrap in `aria-live="polite"`), `Callout` (tip/warning/info, emoji `aria-hidden`, `role="note"`), `Loading`, `ProcessingPlaceholder`, `Toast` (bottom-right, whole pill dismiss, **container needs an `aria-live` region** — one `ToastProvider`; note the design `Toast.jsx` `✕` literal is a bug to fix).
- **Overlays:** `ConfirmDialog` — one accessible dialog used by Delete/Remove/Discard/Leave. **Use native `<dialog>` + `showModal()`** (focus trap, Escape, top-layer, focus-restore for free; call `showModal()` in an effect, never `open` during SSR; scrim-close via a `target === dialogEl` check), `danger` variant. Add a jsdom `showModal`/`close` polyfill in `tests/setup.ts`.
- **Content:** `CodeBlock` — **enhance the existing Shiki MDX `CodeBlock`** with the design's filename header + Copy→"Copied" (keep its existing Shiki rendering/pipeline; add `aria-live` on the copy state). `RecipeCard` (lift + cover zoom; **real alt text**, meta as `<ul>`/`<dl>`).
- **Icons:** **no icon library** — keep the existing hand-inlined SVG approach. Add new outline icons as inline SVG (`stroke="currentColor"`, Lucide-grade paths), always `aria-hidden` with a text label on the control. GitHub/LinkedIn brand glyphs stay as their existing SVGs. Glyph stand-ins (`☾/☀ ✓ ✕ · ↗ ←`) kept where the design uses them.
- **Delete/verify:** components with no design counterpart (e.g. `FullPageHeader` neo-brutalist hero, `Grid`, `SocialCard`, `AppsCta`/`RecipesCta`/`CVDownload` as-composed) — restructure or remove as the new Home/Apps layouts dictate; the implementer has authority to delete/rename with tests updated.

### Per-page specs

Each page: adopt the design layout; upgrade to the listed semantics; implement the interactions/states; meet the a11y notes.

**Public**

1. **Home** `/` — hero (eyebrow + h1 + role + bio + Email me/Download CV CTAs; **keep the profile photo**, restyled) → "Apps & Experiments" link-section → "From the Kitchen" RecipeCard rail → "The blog" link-section. **Rewrite the hero bio to the design's plain/dry voice** (current copy is too hype-y). Upgrade: link lists → `<ul><li>`, row title → `<h3>`, dividers `aria-hidden`, recipe imgs get real alt. Section eyebrows are `<h2>`.
2. **Apps** `/apps` — hero → responsive app-card grid (`<ul><li>`, card title `<h2>/<h3>`, decorative preview `aria-hidden`) → "In progress" `<aside>`. Count label pluralizes.
3. **Blog** `/blog` — hero → count row + tag filter bar (`role="group"`, chips are `<button>` + `aria-pressed`) → post list (`<article>` per post, `<h2>` title link + separate tag `<ul>` of filter buttons — **do not wrap whole card in an anchor**). Interactions: tag filter preserving the **existing** `?tag=` `useSearchParams` sync (existing param name kept; derive from the URL), empty state, `aria-live` result count.
4. **Blog Post** `/blog/:slug` — `<main><article>`, back link, `<header>` (h1 + meta + tag `<a>` links), hero `<figure>/<figcaption>`, MDX prose (existing MDX pipeline: Callout/CodeBlock/FileTree/Image/Link/Typography), Copy-to-clipboard with `aria-live`, Share row, Related `<section>`. Architecture diagram (existing Mermaid) needs a text alt.
5. **Recipes** `/recipes` — hero → search (`<form role="search">`, `<input aria-label>`, magnifier `aria-hidden`, clear button) + **dynamic tag-filter chips** (`role="group"`, `aria-pressed`) → RecipeCard grid (`<ul><li>`, real alt) → empty state. **Keep the existing filter behavior — restyle only:** chips come from the live `/recipes/tags` endpoint (`fetchTags()` → all tags, data-driven). The design's curated "category" chips are a *visual look*, not a new taxonomy — do **not** hardcode a category list or add a `category` field. Search is client-only; only the tag filter syncs to `?tag=` (same param as Blog). The `(count)` label is a minor visual detail (the design omits it — keep or drop as looks best). `aria-live` result count.
6. **Recipe** `/recipes/:slug` — `<main><article>`, back link, hero `<figure>`, `<header>` (h1 + mono meta + tag `<a>` links + intro), two-column: sticky `<aside>` Ingredients + `<section>` Method. **Ingredients → `<ul><li>` with real checkbox semantics** (`<input type=checkbox>` or `role="checkbox" aria-checked`; strikethrough not the only signal — note the design's "don't transition ingredient-name color" caveat). **Steps → `<ol><li>`** (number from list). **Persist checked ingredients per recipe in `localStorage`** (survives reload/navigation). Reuse as shared **`RecipeView`** (also used by Preview).

**Admin** (shell = admin Header/Footer; add skip link + `<main id="main">` to all — currently missing)

7. **Login** `/admin/login` — logged-out header; centered auth `<main id=main>` card; `<form novalidate>` two modes (`login` | `setPassword` from Cognito `NEW_PASSWORD_REQUIRED`); wrapping `<label>`s, correct `autocomplete`, `role="alert"` error, submit spinner/disabled. On mode switch move focus to first new field + announce heading. **Drop the bottom-right preview switcher.**
8. **Admin Recipes** `/admin/recipes` — admin header (`aria-current` active), page header (h1 + count + "New recipe" → route, prefer `<a>`), states `list | empty | loading | error` (retry). List → `<ul><li>` rows: StatusBadge + title (`<h2/h3>`) + tags + relative "Updated…" + actions (Edit/Preview/Publish-Unpublish/Delete, icons `aria-hidden` + text labels). Delete → shared ConfirmDialog. **Toast container = `aria-live`** (polite success/info, assertive error). **Drop preview switcher + standalone Toast trigger.**
9. **Admin Users** `/admin/users` (`requiredRole="admin"`) — page header (h1 + count + Invite), inline invite panel (`<form novalidate>`: email `<input>`+`<label>`, **role segmented control → `<fieldset><legend>Role` + `aria-pressed`**, Send spinner, `role="alert"` error + `aria-invalid`/`aria-describedby`), user list (`<ul><li>` or `<table>`; avatar `aria-hidden`; role pill; status dot+text; Remove hidden for self "You"). Remove → ConfirmDialog (danger). Toasts `aria-live`. **Drop preview switcher.**
10. **Admin Recipe Editor** `/admin/recipes/new` & `/:id/edit` — largest. Back link; conditional banners (session-expired `role="alert"`, image-processing `role="status"`); title bar (h1 + status pill); two-column: left **single `<form>`** of `<section>`/`<fieldset>` groups (Basics: title, **URL slug** live `akli.dev/recipes/[slug]` preview + "Reset to title" + **locked** state once images exist; intro; Cover image upload+alt; Timing/servings; **TagInput**; Ingredients rows +reorder; **Steps `<ol>`** each with own image+alt), right sticky `<aside>` rail (**autosave `aria-live`**, state-aware actions, **"Before publishing" checklist** as `<ul>` with text status not color-only). Interactions: keep the existing autosave (`useAutosave`) and restyle its indicator (the prototype's ~1.5s timing isn't a mandate — change only if genuinely cleaner); slug auto/lock, image `empty→processing→ready`, publish gating (`missing()` checklist incl. all ready images have alt + none processing), Discard + Leave(unsaved-changes) dialogs, toasts. **Every `.seclabel` → real heading/legend; cover dropzone → real button/file input; wire alt → `<img alt>`; focus follows reordered item. Drop the 6-way preview switcher.**
11. **Admin Recipe Preview** `/admin/recipes/:id/preview` — sticky status banner (amber draft / green published; back link, status text carries state, Edit + Publish(draft)|View public(published) + toggle) wrapping the shared **`RecipeView`**; states `draft | published | loading | notfound`. Reuse public `<main id=main>` + skip link + ingredient/steps semantics. **Drop preview switcher.**

### States (every page)

Empty, loading, error(+retry), success/toast, disabled — as enumerated per admin page above. Public pages are mostly static except Blog/Recipes (filter empty states) and BlogPost/Recipe (no async states beyond MDX/route load).

## Technical Considerations

- **Stack (verified):** React 19, TypeScript, Vite 7.3, react-router-dom 7.1.5, CSS Modules, Vitest 4.1 + Testing Library, SSR via `entry-server.tsx` + `lambda-handler.ts`, MDX (`@mdx-js/rollup` + Shiki dual-theme + Mermaid). pnpm only. Path aliases: `@api @components @contexts @hooks @pages @models` — **note `@models` (→`src/types`), there is NO `@types` alias** (CLAUDE.md is wrong).
- **Conventions (keep):** `src/components/<Name>/<Name>.tsx` + `index.ts` barrel + co-located `.module.css` + `.test.tsx`; const arrow functions (`func-style: expression` ESLint); run `pnpm exec eslint --fix` on changed TSX; use the `frontend-design` skill for CSS/visual work; run `/simplify` before PRs.
- **Tokens are a remap + deletion, NOT a clean 1:1 value swap** (correction from review). Many current tokens have **no new-system counterpart** and must be migrated by hand across `src/**/*.module.css`, e.g. `--radius-none` (~30 refs → new soft radii), `--border-width`/`-thick` (~37 refs; new system keeps the name but flips 2px→1px, a **meaning change**), `--color-bg-subtle` (~15), `--easing-default` (~12), `--color-border-subtle` (~8), `--color-link-hover` (~6), `--color-primary-hover` (~3), the `--max-w-xs/sm/md/lg/2xl` set, and the hard-shadow scale. The new system has **no hover-color tokens** (helpers just switch to `--color-primary`) and a different radius/shadow/max-width naming set. **Deliverable: an explicit old→new mapping table (including deletions) authored before the swap.** Also scope the **hardcoded** brutalist values in `src/index.css` (Mermaid `4px 4px 0 #000`, `invert(1) hue-rotate`, `--radius-none`, base body styles) — the token AC won't catch literals. Add a greppable AC: no module references a removed token.
- **Token-value accessibility (resolved):** the design's `--color-text-faint #9A938A` on `--color-bg #FBFAF7` is only ≈2.9:1 (fails AA). **Override it to `#767066`** (~4.5:1, AA-safe for eyebrow/caption/meta text); `--color-text-muted #6F6961` (≈5.2:1) already passes. Verify the dark-mode faint `#6E685E` on `#141310` and darken if needed. axe (via `vitest-axe`) can't catch contrast under jsdom (see Testing) — this is a manual/token-level check.
- **New dependencies:** `vitest-axe` (the Vitest-native axe-core matcher — same engine as jest-axe/Lighthouse, but ships its own types so no `@types` shim) for runtime a11y tests, and **`eslint-plugin-jsx-a11y`** for static a11y linting — the repo has *neither* today. **No icon library** — icons stay hand-inlined SVG. Self-hosted font files in `src/assets/fonts/`.
- **Theming:** no theme flash on load is in scope (see Design). Keep the `theme` localStorage key (no gratuitous rename to `akli-theme`); whether to add a `useTheme`/context or keep the toggle self-contained is Claude Code's call. Main changes: restyle the toggle + apply `data-theme` before first paint; update the toggle test for the new markup.
- **Accessibility (WCAG 2.2 AA) cross-cutting must-fixes** (from prototype analysis): (1) `aria-live` regions for toasts + autosave; (2) real focus-trap/Escape/**restore** dialogs; (3) checkbox semantics for ingredient toggles; (4) `aria-pressed` on filter/role toggles; (5) real button/file-input for cover dropzone; (6) admin forms wrapped in `<form>`/`<fieldset>`/`<legend>` with real headings; (7) skip link + `id="main"` on all admin pages; (8) real alt on content images + editor-collected alt wired to `<img>`; (9) `<ul>/<ol>/<li>` for grids/rows/ingredients/steps; (10) strip all design-time preview switchers/`data-props`.
- **Additional WCAG 2.2 items not in the prototypes:** (11) **Focus management on client route change (SC 2.4.3)** — nothing currently moves focus to `<main>`/`<h1>` after navigation (`ScrollToTop` only scrolls); add a focus reset keyed on `useLocation().pathname` to the skip target. (12) **Focus Not Obscured (SC 2.4.11)** — the sticky blurred header can cover a focused element; add `scroll-margin-top`/anchor handling. (13) **Forced-colors / Windows High Contrast** — the `--ring` is `box-shadow`-only and vanishes when box-shadows are stripped; pair it with `outline: 2px solid transparent` and adopt `:focus-visible`. (14) **`@supports` fallbacks** for `color-mix()` (used in `--ring` — no support ⇒ invisible focus, an a11y regression) and `backdrop-filter` (sticky header degrades to a translucent bg with text bleed-through ⇒ provide a solid fallback).
- **Existing `ConfirmDialog` gaps (the actual work):** it already has `role="dialog"`/`aria-modal`/Escape/Tab-trap, but lacks initial-focus-on-open, `document.activeElement` **save/restore**, and scrim-click close — those three are the adds. Native `<dialog>` + `showModal()` gives trap/Escape/top-layer/focus-restore for free (call `showModal()` in an effect, never `open` during SSR; scrim-close needs a manual `target === dialogEl` check), **but jsdom does not implement `showModal()`** — if we go native, add a jsdom polyfill in `tests/setup.ts`, else keep `role="dialog" aria-modal` so tests run.
- **SEO:** semantic landmarks (`<main>/<nav>/<article>/<header>/<footer>`), one `<h1>` per page + ordered headings, existing `meta.ts`/sitemap plugin preserved, tag links crawlable as `<a>`. Confirm `meta.ts` titles/descriptions still apply per route.
- **Testing:** TDD is **not** mandated for visual work (per decision). Bar = `vitest-axe` + Testing Library behavior/a11y tests, backed by `eslint-plugin-jsx-a11y` at lint time. Extend `expect` with vitest-axe's matchers (`toHaveNoViolations`) in `tests/setup.ts` (foundation gate — `vitest-axe` must land in issue 0 or downstream a11y tests can't import). Known jsdom limits to design around:
  - **axe under jsdom (via `vitest-axe`) cannot run `color-contrast`** (no layout/paint) — it reports "incomplete", so "zero violations" does **not** cover the faint/muted contrast risk. Contrast is a **manual/token-level** check, not an axe assertion.
  - **`aria-live` cannot be asserted as "announced"** (no AT in jsdom) — assert the live region exists with the right `aria-live` and that its text content updates after the action. Reword ACs accordingly.
  - **Timer-driven behaviors** (autosave cadence, toast auto-dismiss ~3.6s, Copy→"Copied" 1.6s) use `vi.useFakeTimers()` + `advanceTimersByTime`; configure `userEvent.setup({ advanceTimers })` or clicks hang. (`tests/setup.ts` already shims `jest.advanceTimersByTime` so `waitFor` works under fake timers.)
  - **`MockIntersectionObserver` fires `isIntersecting:true` synchronously on observe** — image/RecipeCard tests see images immediately loaded (good for asserting `<img alt>`), so testing the pre-intersection placeholder/`ProcessingPlaceholder` state needs a per-test non-firing IO mock.
  - **URL-sync tests** seed `MemoryRouter initialEntries={['/blog?tag=x']}` and assert the search string via a location probe (not just "chip has aria-pressed").
- **A shared `renderWithProviders` (MemoryRouter, + existing `AuthProvider` for admin) is worth adding** to cut boilerplate in router/auth-dependent tests (add a theme provider to it only if Claude Code introduces one).
- **"Keep existing suite green" means _update_, not _preserve untouched_.** The `theme` key and URL params are preserved; some component APIs may change where genuinely cleaner (e.g. `Button` variants) — update those tests too. The bigger churn is markup/structure: `ThemeToggle.test.tsx` (checkbox+"Dark Mode" → icon button changes its role/name; the `theme` logic stays) and tests affected by merging `Navigation` into `Header`. Update to the new markup/APIs **without reducing coverage**; suite green **after** update.
- **Much of the interaction logic already exists — restyle + a11y, do NOT rebuild:** `useBlocker(dirty)` + `beforeunload` (unsaved-changes) are in `RecipeEditor.tsx`; `useSearchParams` `?tag=` sync is in both `Blog.tsx` and `Recipes.tsx`; `ConfirmDialog`, `AutosaveStatus`, `ImageUpload`, `TagInput`, `useAutosave` all exist. ACs below are phrased as "preserve behavior, restyle + add the a11y gap", not greenfield.
- **Autosave: keep the existing `useAutosave` (interval-based, 2000ms)** unless Claude Code judges a change genuinely cleaner. The design's "~1.5s debounce" is a prototype detail, not a mandate. Restyle the indicator.
- **Docs:** update `CLAUDE.md` (remove neo-brutalist + `--radius-none` mandate; document paper tokens, Geist/JetBrains self-host, the a11y-test bar (`vitest-axe` + `eslint-plugin-jsx-a11y`); fix `@types`→`@models` and Vite 6→7). Keep the `theme` key in docs; update the toggle/theme description to match whatever's implemented. Mark `docs/prds/redesign.md` deprecated (superseded by this).
- **Suggested sequencing** (mega-PRD, one epic; matches the stacked-issue milestone workflow — no per-issue PRs, one green epic→main PR): (0) tokens + fonts + theme no-flash + `_helpers` port + vitest-axe & jsx-a11y setup → (1) shared shell + primitives (Header/Footer/Button/Link/Card/Tag/StatusBadge/Input/Textarea/Toast/ConfirmDialog/ThemeToggle) → (2) public pages Home→Apps→Blog→BlogPost→Recipes→Recipe (+ shared RecipeView) → (3) admin Login→RecipeList→Editor(largest)→Preview→Users → (4) CLAUDE.md + cleanup + `/simplify`.

## Acceptance Criteria

**Foundation**

- [ ] `src/styles/tokens.css` defines the full paper token set (semantic `--color-*` light on `:root` + dark under `[data-theme="dark"]`, short aliases, typography/spacing/radius/shadow/focus/layout/motion) with values matching `docs/design/paper/design_system/tokens/`. No neo-brutalist tokens remain.
- [ ] **(greppable)** No `src/**` file references a removed token (`--radius-none`, `--color-bg-subtle`, `--easing-default`, hard-shadow scale, old `--max-w-*`, etc.), and no `.module.css`/`index.css` contains hardcoded brutalist literals (`4px 4px 0`, `#000` borders, `invert(1)`); a grep in CI/verification returns nothing.
- [ ] An old→new token mapping table (incl. deletions + the `--border-width` 2px→1px meaning flip) exists and every consumer is migrated per it.
- [ ] `--color-text-faint` is `#767066` (~4.5:1 on paper); every muted/faint text token meets WCAG AA against its background in both themes (manual/token-level contrast check; dark-mode faint verified/darkened as needed).
- [ ] Geist (400/500/600/700) + JetBrains Mono (400/500) are self-hosted woff2 with `font-display: swap`; no request to `fonts.googleapis.com`; `--font-sans`/`--font-mono` resolve to them with system fallbacks.
- [ ] **No theme flash on load:** the persisted / `prefers-color-scheme` theme is applied to `data-theme` before first paint (verified in the SSR/prod build), with no hydration-mismatch warning.
- [ ] `ThemeToggle` is restyled to the design's round icon button (☾/☀, `aria-label`); the existing `localStorage('theme')` key is kept (no rename to `akli-theme`). The internal approach (self-contained vs `useTheme`/context) is the implementer's choice.
- [ ] Interaction behaviors (nudge/lift/zoom/focus-ring/chip-hovers/spinner/shimmer) ship in the component modules, and `prefers-reduced-motion: reduce` disables **all** transform/opacity motion — both the shared spinner/shimmer/nudge/lift **and** per-module card/tag/toggle/header transitions.
- [ ] Focus ring uses `:focus-visible`, includes a forced-colors fallback (`outline: 2px solid transparent`), and has `@supports` fallbacks for `color-mix()` and `backdrop-filter`.
- [ ] Critical fonts (Geist 400/500) are `<link rel="preload">`ed and a metric-matched fallback `@font-face` is present (CLS from `swap` held); no request to `fonts.googleapis.com`.
- [ ] `vitest-axe` is installed and its matchers (`toHaveNoViolations`) are extended in `tests/setup.ts` (+ a native-`<dialog>` `showModal` polyfill); `eslint-plugin-jsx-a11y` is added to `eslint.config.js` (flat config) and passes. No icon library added — icons stay hand-inlined SVG.

**Per screen (each of the 12 routes)**

- [ ] **(manual)** Visual sign-off against the `docs/design/paper/` prototype in **both** light and dark (no automated visual-regression this iteration — this is a manual AC, not CI-gated).
- [ ] **(greppable)** No hardcoded hex/px colors or radii outside the token layer in the page's modules.
- [ ] Uses correct landmarks (`<main id="main">` + skip link on every page incl. all admin), a single `<h1>`, and non-skipped heading order.
- [ ] On client route change, focus moves to `<main>`/`<h1>` (SC 2.4.3), and a focused element is never obscured by the sticky header (SC 2.4.11).
- [ ] Card grids/rows/ingredients/steps use `<ul>/<ol>/<li>`; interactive elements are real `<button>`/`<a>` (no `role="button"` divs); content images have meaningful `alt`.
- [ ] `axe` reports **zero violations for the rules runnable in jsdom** (roles/names/aria/landmarks/heading-order); `color-contrast` is out of jsdom scope and covered by the manual contrast + Lighthouse pass.

**Interactions (adopt design behavior; keep sound APIs, change where cleaner)**

- [ ] Blog: tag chips are `<button aria-pressed>`; clicking filters the list, updates the pluralized count via an `aria-live` region, and preserves the **existing** `?tag=` sync (existing param name, derived from URL); empty state + clear work.
- [ ] Recipes: `<form role="search">` filters client-side (title/desc/tags); **dynamic** tag-filter chips (from `/recipes/tags`, not a hardcoded set) with `aria-pressed` sync `?tag=` (same param as Blog, on the existing `recipe.tags`); search does **not** touch the URL; empty state + clear-filters work; count announced.
- [ ] Recipe/Preview: ingredients are real checkboxes announcing checked state and **persisting per recipe in `localStorage`** across reloads; steps render as an `<ol>`; `RecipeView` is shared between public Recipe and admin Preview.
- [ ] Editor: the **existing** autosave (`useAutosave`, interval-based) is preserved; its indicator renders an `aria-live="polite"` region whose text updates on each transition saving→saved(relative time)→error+Retry (tested with fake timers); slug auto-derives until edited/locked; images `empty→processing→ready`; Publish disabled until the checklist passes (incl. every ready image has alt + none processing); existing `useBlocker` unsaved-changes(Leave) + Discard dialogs preserved and restyled; collected alt is wired to the `<img alt>`.
- [ ] Header active link sets `aria-current="page"`; the ThemeToggle flips theme + persists via the existing `theme` key.
- [ ] Toasts render through one `aria-live` container (assertive for errors), auto-dismiss ~3.6s, dismiss on click.
- [ ] All ConfirmDialog usages (Delete/Remove/Discard/Leave) set initial focus on open, trap focus, close on Escape and scrim click, **restore focus to the triggering element on close** (the current custom dialog does not), and use the `danger` variant where destructive.
- [ ] No design-time affordance ships (no preview "state switcher", no `data-props` toggles, no `.dc.html`/`support.js`).

**Tests & docs**

- [ ] Existing tests are **updated** where markup/structure or a component API changed (e.g. `ThemeToggle` icon-button restyle, `Navigation`→`Header` merge, any `Button` variant change) without reducing coverage; the suite is green after update. (The `theme` key and URL params are preserved.) A shared `renderWithProviders` (MemoryRouter, + `AuthProvider` for admin) is available for router/auth-dependent tests.
- [ ] New tests cover the adopted interactions (filter/search/URL-sync via `initialEntries`, ingredient check state, autosave transitions under fake timers, publish gating, dialog focus-trap/restore, toast auto-dismiss, `aria-pressed`/`aria-current`) using Testing Library role/text queries.
- [ ] `CLAUDE.md` updated (paper system, fonts, a11y-test bar = `vitest-axe` + `eslint-plugin-jsx-a11y`; `@models` not `@types`; Vite 7; existing `theme` key/toggle left intact); `docs/prds/redesign.md` marked deprecated.

## Resolved Decisions

All open questions were resolved on 2026-07-01:

1. **Footer links** — reuse the existing three from `SocialCard`: GitHub `https://github.com/vandelay87`, LinkedIn `https://www.linkedin.com/in/akli-aissat-b08119115/`, Email `mailto:akliaissat@outlook.com`.
2. **Home hero** — **keep the profile photo** (restyled to the paper look); **rewrite the bio** to the design's plain/dry voice (current copy is too hype-y); CTAs = Email me + Download CV.
3. **Ingredient check-off** — **persist checked state per recipe in `localStorage`** across reloads (a deliberate improvement over the prototype, which doesn't persist).
4. **Icons** — **no icon library**; keep hand-inlined outline SVG (Lucide-grade paths, `aria-hidden` + text label). GitHub/LinkedIn brand glyphs stay as their existing SVGs.
5. **Button variants** — add destructive/outline styles + pill shape under whatever variant naming is cleanest (Claude Code's call at implementation); update all callers.
6. **`--color-text-faint`** — **darken to `#767066`** (~4.5:1 on paper, AA-safe); verify/darken the dark-mode faint `#6E685E` on `#141310` too.
7. **Dialogs** — use **native `<dialog>` + `showModal()`** (focus-trap/Escape/restore/top-layer for free); add a jsdom `showModal` polyfill in `tests/setup.ts`.
8. **Warning token** — the `#A66E0A` text vs `#C2810C` Callout-tint split is intentional in the design; use the design's values verbatim.
9. **Recipes filter chips** — **keep dynamic** (all tags from `/recipes/tags`, restyled to the paper look); do **not** adopt the design's curated "category" chips as a taxonomy or hardcode a category list. `(count)` label optional. (A real `category` field would be separate, out-of-scope backend work.)
10. **Fonts** — **manual self-host** (commit `.woff2`, no Fontsource dependency); latin-only, weights used only, `OFL.txt` included. (See Design & UX → Fonts.)

## Verification (post-implementation)

- `pnpm test` green; `pnpm exec eslint` clean on changed files.
- `pnpm build` + SSR run: load each route, hard-reload in each theme, confirm **no theme flash** and no hydration warning; toggle theme (dev image upload needs `VITE_S3_BUCKET_HOST`).
- Manual axe/Lighthouse pass per route (both themes); keyboard-only walkthrough of dialogs, filters, editor.
- Visually diff against `docs/design/paper/` prototypes (open `.dc.html` in browser) for layout/spacing fidelity.
