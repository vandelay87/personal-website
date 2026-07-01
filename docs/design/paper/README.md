# Handoff: akli.dev Redesign

## Overview

A full redesign of **akli.dev** — Akli Aissat's personal site and recipe/blog platform — plus its authenticated **admin** area. The redesign moves the product from its original "neo-brutalist" look (black/white, hard 2px borders, hard-offset shadows, system fonts) to a **warm, editorial "paper" aesthetic** with a strict two-font pairing (Geist + JetBrains Mono), soft elevation, generous whitespace, and a first-class light/dark theme.

This bundle contains **11 design pages** (6 public + 5 admin) and the **design system** extracted from them (tokens, reusable components, UI kits, guidelines).

## About the design files

The files in this bundle are **design references authored in HTML** — prototypes that show the intended look and behavior. They are **not production code to copy directly**.

- The pages under `pages/` are `*.dc.html` files. They render as self-contained HTML documents (each has inline styles and its own copy of the theme tokens) and depend on the local `pages/support.js` runtime to mount. Open any of them in a browser to see the intended result.
- Your task is to **recreate these designs in the existing `personal-website` codebase** (React 19 + TypeScript + Vite + CSS Modules) using its established patterns — component folders at `src/components/<Name>/<Name>.tsx`, tokens at `src/styles/tokens.css`. Do **not** ship the `.dc.html` files or the `support.js` runtime.
- The `design_system/` folder is the canonical spec for tokens and components. Where the existing repo and these designs disagree, **the redesign wins** — it is the new direction.

## Fidelity

**High-fidelity (hifi).** Colors, typography, spacing, radii, shadows, copy, and interactions are all final. Recreate the UI to match, using the repo's existing libraries/patterns. Exact values are in the Design Tokens section below and in `design_system/tokens/`.

---

## Design tokens

Full source: `design_system/tokens/` (`colors.css`, `typography.css`, `spacing.css`, `fonts.css`). Two naming layers exist — semantic `--color-*` (mirrors the repo's convention) and short working aliases (`--bg`, `--text`, `--surf`, `--accent`…). Both resolve to the same values.

### Color — light (default)
| Token | Hex |
|---|---|
| bg (paper) | `#FBFAF7` |
| surface | `#F4F1EA` |
| field (inputs) | `#FFFFFF` |
| hover wash | `rgba(0,0,0,0.022)` |
| text-strong (headings) | `#1C1A16` |
| text (body) | `#3A3631` |
| text-muted | `#6F6961` |
| text-faint (eyebrows) | `#9A938A` |
| border | `#ECE6DA` |
| border-strong | `#E0DACE` |
| primary/accent | `#1F66E0` |
| button bg / fg | `#1C1A16` / `#FBFAF7` |
| success / bg | `#1F8A5B` / `rgba(31,138,91,.10)` |
| warning / bg | `#A66E0A` / `rgba(194,129,12,.12)` |
| error / bg | `#C0392B` / `rgba(192,57,43,.07)` |

### Color — dark (`[data-theme="dark"]`)
| Token | Hex |
|---|---|
| bg | `#141310` |
| surface | `#1C1A15` |
| field | `#1B1914` |
| hover wash | `rgba(255,255,255,0.04)` |
| text-strong | `#F3F0E8` |
| text (body) | `#CFC9BD` |
| text-muted | `#A6A093` |
| text-faint | `#6E685E` |
| border | `#2A2823` |
| border-strong | `#36342C` |
| primary/accent | `#6BA0FF` |
| button bg / fg | `#F3F0E8` / `#141310` |
| success / warning / error | `#62C08D` / `#E0A93B` / `#E8786B` |

Theming is **first-class**: every component must work in both themes. Theme is set via `data-theme` on a root ancestor and persisted to `localStorage('akli-theme')`; default falls back to `prefers-color-scheme`.

### Typography
- **Geist** — all UI + display. **JetBrains Mono** — eyebrows, meta lines, tags, code, numerics.
- Display headings: Geist 600, tracking `-0.03em`, line-height ~1.08, fluid via `clamp()` — hero `clamp(40px,7vw,56px)`, page title `clamp(32px,5.6vw,46px)`, section h2 `clamp(23px,3.2vw,27px)`.
- Body: 15px UI / 16px lists / 18px long-form; line-height 1.65 (body) to 1.75 (articles).
- Mono eyebrow: 11px, `letter-spacing:0.16em`, uppercase, faint. Meta line: 12–13px, `letter-spacing:0.04em`, middot `·` separators.
- 4-step text hierarchy (strong → body → muted → faint) does the work; secondary text leans muted.

### Spacing / radius / shadow
- Spacing: 4px base scale (`--space-1`=4px … `--space-24`=96px).
- Radius: 6px chips · 10px inputs/buttons · 12px code/callouts · 16px cards/panels · 18px dialogs · full pills (CTAs, badges, toggle, avatars).
- Shadow: soft/blurred/low-opacity only. `sm 0 1px 2px rgba(0,0,0,.05)` · `md 0 4px 14px rgba(0,0,0,.08)` · `lg 0 12px 30px rgba(0,0,0,.16)` · `xl 0 24px 60px rgba(0,0,0,.28)` (dialogs). **No hard-offset shadows.**
- Focus ring: `0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent)`.
- Layout widths: `1080px` shell · `720px` index/hero reading column · `680px` article column · `~54ch` hero measure.
- Motion: `.18–.25s ease` transitions; spinner + shimmer for async; small pop/fade for dialogs, slide-in for toasts. **All animation respects `prefers-reduced-motion`.**

### Iconography
Inline **outline SVG only** — `stroke="currentColor"`, `stroke-width:2`, round caps/joins (Lucide-grade; Lucide is the drop-in match). No filled icons, no icon font. A few Unicode glyphs stand in: `☾`/`☀` toggle, `✓`/`✕`, `·`, `↗`/`←`. **Emoji only** in the article Callout (💡 tip, ⚠️ warning, ℹ️ info).

---

## Global shell (all pages)

**Header** (`design_system/components/navigation/Header.jsx`) — sticky, translucent (`backdrop-filter: blur(10px)` over a `color-mix` bg), 1px bottom border, `1080px` inner width, `18px` vertical padding.
- **Public variant:** wordmark "Akli Aissat" (→ `/`) on the left; nav links Apps / Recipes / Blog + `ThemeToggle` on the right.
- **Admin variant:** same wordmark; nav links Recipes / Users; right cluster = signed-in email + "Log out" (outline button) + `ThemeToggle`.
- Nav links: 14px, muted; **active link** is full-strength text, weight 500, **no underline bar**; hover tints to accent. Brand + links share the `.ds-link` hover treatment.

**Footer** — 1px top border, `1080px` width. Public: "Elsewhere" label + GitHub / LinkedIn / Email links, and "akli.dev" at the right. Admin: "akli.dev admin" + "Signed in as {email}".

**ThemeToggle** — 32px round outline button; ☾ in light / ☀ in dark. Hover shades subtly (theme-aware, not accent). Persists to `localStorage('akli-theme')`.

---

## Screens / views

### PUBLIC

#### 1. Home — `pages/Home.dc.html`
- **Purpose:** Landing page; intro + jump-off points to Apps, Recipes, Blog.
- **Layout:** Shell header; hero in the `720px` reading column (mono eyebrow → large Geist title → muted lead); then stacked link sections and a "From the Kitchen" recipe rail; footer.
- **Sections:** "Apps & Experiments" and "Blog" render as **link sections** (a titled list of rows, each row a title + arrow that nudges on hover, with an "All →" link). The kitchen rail uses **RecipeCard**s. (These were inlined into the page from former shared components — see design system for the reusable versions.)
- **Interactions:** Section-heading links and row arrows nudge right on hover; recipe cards lift + cover zooms.

#### 2. Apps — `pages/Apps.dc.html`
- **Purpose:** Grid of apps/experiments (e.g. Pokédex).
- **Layout:** Header; hero (eyebrow + title + lead); a responsive grid of app cards, each with a preview image/placeholder, title, description, and tag chips; footer.
- **Components:** App cards (rounded, hairline border, hover lift), mono tag chips, "Read the blog" link with a nudging icon.

#### 3. Blog (index) — `pages/Blog.dc.html`
- **Purpose:** Editorial post index — deliberately distinct from the card grids.
- **Layout:** Header; hero; then a **reading list**: each post is a large tappable row with a mono meta line (`date · read-time`), a title that tints accent on hover (its `↗` nudges up-right), a description, and tech-tag chips.
- **Interactions:** Tag chips are **live filters** — clicking filters the list, highlights the active tag (in the filter bar and within posts), updates the count ("2 posts tagged react"), and syncs `?tag=` in the URL; reads `?tag=` on load. A bordered "✕ clear" pill resets. Empty state if a tag has no matches.
- **State:** `activeTag` (nullable), synced to URL query.

#### 4. Blog post — `pages/Blog Post.dc.html`
- **Purpose:** Long-form technical article (reference content = the Pokédex build).
- **Layout:** Header; back link ("← All posts", icon nudges left); article header (meta line, big title, clickable tag chips → `/blog?tag=…`); hero cover image + caption; then the **680px prose column**.
- **Components:** Prose (18px / 1.75); **CodeBlock** (filename header + Copy button that flips to "Copied ✓" ~1.6s; horizontal scroll; theme-aware); inline code chips; a file-tree block; a rendered architecture diagram (stack cards with region badges — mark `data-om-raster` equivalent if exporting); **Callout** (tip/warning/info — emoji + colored uppercase label + subtle tint, no left-accent-bar); Share (X / LinkedIn) row; a Related-posts card.

#### 5. Recipes (index) — `pages/Recipes.dc.html`
- **Purpose:** Recipe index.
- **Layout:** Header; hero; a controls row = **search input** (rounded, magnifier icon, ✕ clear) + **category filter chips** (all / Pasta / Mains / Quick / Baking); a responsive **RecipeCard** grid; footer.
- **Interactions:** Search filters title/description/category live; category chips filter and sync `?category=` in the URL; the two combine. Empty state ("Nothing in the kitchen matches that") with a bordered "✕ clear filters" pill. RecipeCards lift + cover zooms on hover.
- **State:** `query` (string), `category` (nullable, URL-synced).

#### 6. Recipe detail — `pages/Recipe.dc.html`
- **Purpose:** Public read view of one recipe.
- **Layout:** Header; back link; cover image; recipe header (title, mono meta `date · prep · cook · serves`, clickable tag chips, intro); then a **two-column** body — a **sticky Ingredients card** (left) beside the **numbered Method** (right). Collapses to one column on narrow screens.
- **Interactions:** Tap any ingredient to check it off (checkbox fills accent, name strikes through). Ingredient-name color must NOT be transitioned (a `transition: color` on a `var()` token mis-renders across theme switch — set it directly).

### ADMIN

Admin pages sit inside the shell (admin variant), **except Login**. Each functional page includes a small **bottom-left preview switcher** (design-time only — segmented control to jump between states); this is a prototype affordance and should **not** be reproduced in production.

#### 7. Login — `pages/Admin Login.dc.html`
- **Purpose:** Authentication; the only page outside the admin shell (it uses the public header/footer).
- **Layout:** Centered card, single column, on the paper background.
- **States (never both at once):** (a) **Log in** — email + password + submit (shows a loading state while signing in) + inline error area ("Incorrect email or password"). (b) **Set new password** (first-time users) — new-password + confirm-password + submit + inline error ("Passwords do not match"). Log-in first, then the set-password step if the account requires it.

#### 8. Recipe list (admin home) — `pages/Admin Recipes.dc.html`
- **Purpose:** Manage all recipes, sorted by most-recently-updated.
- **Layout:** Shell; page header ("Recipes" + count subtitle + prominent "New recipe" button); a bordered list. Each row: title, **StatusBadge** (Published=green / Draft=amber dot-pill), tag chips, last-updated date, and per-row actions (Edit / Preview / Publish↔Unpublish / Delete).
- **Interactions:** Delete opens a **ConfirmDialog** ("Are you sure you want to delete …?"). **Toasts** appear bottom-right for events (e.g. access-denied) — quiet pill, click-anywhere to dismiss, faint ✕ reveals on hover, auto-dismiss ~3.6s.
- **Secondary states:** empty ("No recipes yet" + "Create your first recipe"), loading (spinner panel), error (with Retry).

#### 9. Recipe editor — `pages/Admin Recipe Editor.dc.html`
- **Purpose:** Create/edit one recipe with **autosave** (no manual save button).
- **Layout:** Shell; "← Back to recipes"; a status pill; a **two-column** body — long form (left) + **sticky action rail** (right).
- **Form fields (grouped):** title; **URL slug** (live `akli.dev/recipes/[slug]` preview, "Reset to title" helper, and a **locked** state with explanation once any image exists); intro; **cover image** upload + alt-text field (alt appears only once an image is uploaded; required if an image exists); prep/cook/servings (numeric); **TagInput** (chips + add-on-Enter + suggestions from existing tags); **ingredients** (qty + name rows; add/remove/reorder); **steps** (each: text + optional own image upload **and its own alt-text field**, required only if that step image exists).
- **Autosave indicator (rail):** debounces ~1.5s after typing → **Saving…** → **Saved just now / Saved at 2:30 PM**; on failure → **Couldn't save · Retry**.
- **Actions (state-aware, rail):** a **draft** shows **Publish** + **Discard draft**; a **published** recipe shows **Update** + **Unpublish** + "View live recipe". **Publish is disabled** until a **"Before publishing" checklist** passes (title, intro, cover image, cover alt text, ≥1 ingredient, ≥1 step, no image still processing) — each item ticks green as satisfied.
- **Async images:** upload shows a **processing shimmer** placeholder, then the image + remove + alt field. Images uploading = publish blocked.
- **Supporting moments:** loading (draft init), **discard** confirm dialog, **unsaved-changes** dialog (if navigating away mid-save), **session-expired** banner ("Log in again"), **image-taking-longer** notice, success/error toasts.
- **State:** `recipe` object (title, slug, slugEdited, intro, cover{state,url,alt}, prep, cook, servings, tags[], ingredients[{id,qty,name}], steps[{id,text,image{state,url,alt}}]); `save` {state, at}; dialog/banner flags. Image state machine: `empty → processing → ready`.

#### 10. Recipe preview — `pages/Admin Recipe Preview.dc.html`
- **Purpose:** Read-only view of exactly how a recipe will look on the public site, rendered with the real public recipe layout.
- **Layout:** A **status banner** at the top, then the full public recipe below it.
  - **Unpublished:** banner reads "Preview — this recipe is not yet published" with **Edit** and **Publish** actions.
  - **Published:** banner reads "This recipe is published" with **Edit** and **View public page** actions.
- The banner is translucent/blurred like the nav (so content reads softly beneath when sticky). Also needs **loading** and **"Recipe not found"** states.

#### 11. User management (admin only) — `pages/Admin Users.dc.html`
- **Purpose:** Manage access.
- **Layout:** Shell; page header ("Users" + count + "Invite user" button); a bordered list — each user shows avatar/initial, email, **role** (Admin=accent pill / Contributor=neutral), **status** (Confirmed=green / Pending=amber dot), and a **Remove** action (except the current user, marked "YOU", who has none).
- **Invite:** "Invite user" opens an **inline form** (slides down) — email field + role segmented control (Contributor / Admin) + Send/Cancel, aligned on one row beneath their labels. Send shows a spinner. Inline errors: "A user with this email already exists." / "Enter a valid email address." A role hint line explains each role.
- **Remove:** **ConfirmDialog** ("Remove {email}? They will lose access immediately. This can't be undone.") with a danger (red) confirm.
- **Toasts:** "Invite sent to {email}.", "User {email} removed."
- **Secondary states:** loading (spinner), error (with Retry).
- **Note:** the role segmented control must set its active background via inline style, not an attribute selector + transition (that mis-rendered in testing).

---

## Interactions & behavior (cross-cutting)

- **Icon nudge (signature):** directional icons animate on hover via `transform` (`.25s ease`) — back chevrons slide left, forward/CTA arrows right, `↗` up-right. See `.ds-link` rules in `design_system/components/_helpers.css`.
- **RecipeCard hover:** card lifts (`translateY(-4px)` + soft shadow), cover image zooms (`scale(1.04)`).
- **Filter chips / dashed suggestions:** border + text tint to accent on hover; active filter fills solid accent.
- **Toasts:** bottom-right stack, slide-in, click-anywhere dismiss, faint ✕ on hover, auto-dismiss ~3.6s.
- **Dialogs:** scrim (`color-mix #000 38%`), pop-in, click-scrim or Cancel dismiss; danger variant = red confirm + alert icon.
- **URL sync:** blog `?tag=`, recipes `?category=` — write on change, read on load.
- **prefers-reduced-motion:** disables spinner/shimmer/nudge/card-lift transitions everywhere.

## State management (summary)
- **Theme:** `localStorage('akli-theme')` ('light'|'dark'), default from `prefers-color-scheme`, reflected on `data-theme`.
- **Blog:** `activeTag` ↔ `?tag=`. **Recipes:** `query` + `category` ↔ `?category=`.
- **Editor:** `recipe` model + debounced `save` state machine + async image state (`empty→processing→ready`) + publish-checklist derivation + dialog/banner flags.
- **Users:** `users[]`, inline-invite form state (email/role/sending/error), `removeId` for the confirm dialog, `toasts[]`.
- **Login:** `mode` ('login'|'setPassword'), field values, `loading`, inline `error`.

## Assets
- **Fonts:** Geist + JetBrains Mono (Google Fonts via `design_system/tokens/fonts.css`). The repo currently uses system fonts — adopting these is a deliberate redesign change. For production, consider self-hosting woff2 `@font-face` to avoid external requests.
- **Images:** the pages reference real akli.dev images (recipe covers, blog cover) and some Unsplash placeholders for recipe cards. Replace placeholders with real assets; keep alt text.
- **Logo:** none — the brand is a **wordmark only** ("Akli Aissat"). No favicon/mark was provided.
- **Icons:** hand-inlined outline SVG; **Lucide** is the matching set to adopt in-repo.

## Files in this bundle
- `pages/` — the 11 `*.dc.html` design references + `support.js` (runtime needed only to view them; do not ship).
- `design_system/` — canonical spec:
  - `styles.css` (entry; `@import`s everything), `tokens/` (colors, typography, spacing, fonts)
  - `components/` — reusable primitives grouped by concern (core, forms, feedback, overlays, navigation, content); each has `<Name>.jsx`, a `<Name>.d.ts` props contract, and a `<Name>.prompt.md` usage note; plus `_helpers.css` (hover/focus/animation rules)
  - `ui_kits/` — `public/` and `admin/` full-screen compositions
  - `guidelines/` — foundation specimen cards (Type, Colors, Spacing)
  - `readme.md` — the design-system narrative (voice, visual foundations, iconography, old→new shift)
  - `SKILL.md` — skill manifest

## Suggested implementation order
1. Land tokens into `src/styles/tokens.css` (both themes) + wire the theme toggle/persistence.
2. Build shared primitives (Button, Link, Header, Card, Tag, StatusBadge, Input/Textarea, Toast, ConfirmDialog, ThemeToggle).
3. Public pages (Home → Apps → Blog → Blog post → Recipes → Recipe).
4. Admin shell + Login, then Recipe list → Editor (largest) → Preview → Users.
