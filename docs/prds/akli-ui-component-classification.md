# PRD: @akli-dev/ui Component Classification & Storybook Discovery

> Companion PRDs: `akli-ui-package-and-storybook.md` in `akli-ui`, `storybook-app-routing.md` in `akli-infrastructure`.

## Overview

Two small, related pieces of work in `personal-website` that support the new `@akli-dev/ui` package and Storybook app: (1) document a convention in `CLAUDE.md` for deciding whether a new component belongs in this repo or in `@akli-dev/ui`, and (2) add Storybook as a new card on the Apps page, exactly like the existing Pokedex and Sand-box entries, so it's discoverable from the site.

## Problem Statement

With `@akli-dev/ui` now holding the site's generic/reusable UI primitives (Header, Footer, Button, Typography, etc.), there's no written rule for where a *new* component should live — without one, generic components will keep landing in `personal-website` by default, drifting back toward the duplication problem the package was built to solve. Separately, once Storybook is deployed at `storybook.akli.dev` (per the `akli-ui` PRD and its `akli-infrastructure` companion, `storybook-app-routing.md`), it won't be discoverable from the site unless it's added to the Apps page, exactly as happened for Pokedex and Sand-box (see `docs/prds/pokedex-integration.md`, `docs/prds/subdomain-migration.md`).

## Goals

- `CLAUDE.md` states a clear, checkable rule for classifying new components as generic (→ `@akli-dev/ui`) vs domain-specific (→ `personal-website`)
- The rule references the actual current split (which existing components moved) so it's concrete, not abstract
- Storybook appears as a card on the Apps page, linking to `https://storybook.akli.dev`

## Non-Goals

- Migrating `personal-website`'s own `Header`/`Footer`/etc. to import from `@akli-dev/ui` — tracked as a separate, deferred follow-up once `@akli-dev/ui` v1 is published (see the `akli-ui` PRD's Non-Goals, which also notes that swap must be atomic — local and package fonts/tokens must not both be imported at once, or the font double-loads)
- Enforcing the classification rule via lint/CI (e.g. a script flagging "this looks generic") — a documented convention is sufficient for now; automated enforcement is a future consideration if violations become a recurring problem
- Any change to the Storybook app itself — that's handled in the `akli-ui` repo
- CloudFront/S3 deployment config for Storybook — that's handled in `akli-infrastructure`
- A `personal-website` sitemap entry for Storybook — `storybook.akli.dev` is its own subdomain/origin with its own dedicated CloudFront distribution (see `akli-infrastructure`'s `storybook-app-routing.md`), not a route of this site. This mirrors Pokedex and Sand-box: their `/apps/pokedex`/`/apps/sand-box` sitemap entries were removed from `personal-website`'s sitemap once they moved to `pokedex.akli.dev`/`sandbox.akli.dev` (see `docs/prds/subdomain-migration.md`) — a separate origin isn't discoverable by adding it to *this* site's `sitemap.xml`. If Storybook wants SEO indexing, that's a sitemap on `storybook.akli.dev` itself, out of scope here.

## User Stories

- As a future contributor (or future me), when adding a new component, I want a clear rule in `CLAUDE.md` for whether it belongs here or in `@akli-dev/ui`, so I don't have to re-derive the decision each time.
- As a visitor browsing the Apps page, I want to see Storybook listed so I can click through to explore the design system.

## Design & UX

### CLAUDE.md convention

Added to the **Conventions** section, near the existing component-location bullet (`Components live in src/components/<Name>/<Name>.tsx...`).

### Apps page card

Follows the exact same pattern as the existing Pokedex/Sand-box cards (see `docs/prds/pokedex-integration.md`):

- Card image: a screenshot of Storybook's UI, provided by the user as a `.webp` file
- Card title: "Storybook"
- Card description: describes it as the interactive design system / component catalog for akli.dev
- Card link: `https://storybook.akli.dev`
- Added to the shared `APP_LINKS` constant (`src/constants/appLinks.ts`) alongside Pokedex/Sandbox, then referenced into the `APPS` array in `src/pages/Apps/Apps.tsx`, most-recent-first (before the Pokedex card) — matching how Pokedex/Sandbox's hrefs are already centralized there rather than hardcoded in `Apps.tsx`

## Technical Considerations

### CLAUDE.md convention

- Decision rule to document: *does the component encode UI style (spacing, color, typography, a generic interaction pattern) or does it encode what personal-website specifically does (recipes, admin/auth flows)?* Style → `@akli-dev/ui`. Domain logic → stays here.
- List the concrete v1 split for reference: `Header`, `Footer`, `ThemeToggle`, `Button`, `Typography`, `Link`, `Input`, `Card`, `Callout`, `Grid`, `Image`, `Loading`, `icons` moved to `@akli-dev/ui`; `RecipeCard`, `RecipeDetailView`, `AdminLayout`, `ProtectedRoute`, etc. stay
- Cross-reference the `akli-ui` repo's PRD for full rationale

### Apps page card

- Screenshot must be provided by the user as a `.webp` file in `src/assets/` (e.g. `src/assets/storybook.webp`), using `vite-imagetools` for responsive srcSet generation, matching the `pokedex`/`sand-box` pattern:
  ```typescript
  import storybookImgSrc from '../../assets/storybook.webp'
  import storybookImgSrcSet from '../../assets/storybook.webp?w=320;640;768;1024;1280;1536;1920&format=webp&as=srcset'
  ```
- `AppCardProps` shape already supports this (`title`, `description`, `image: { src, srcSet, alt }`, `href`, `tag`) — no component changes needed, only a new `APP_LINKS`/`APPS` entry
- No sitemap change: `storybook.akli.dev` is a separate origin, not a `personal-website` route — nothing to add via the sitemap plugin's `additionalRoutes` (see Non-Goals). This differs from how Pokedex/Sand-box were originally integrated (`docs/prds/pokedex-integration.md` predates their subdomain move) — follow the *current* Apps-page pattern (`APP_LINKS`, no sitemap entry), not that PRD's now-superseded sitemap step
- Prerequisite: Storybook must actually be built, deployed, and reachable at `storybook.akli.dev` before this card is meaningful to ship — sequenced after the `akli-ui` PRD's milestone 5 and the `akli-infrastructure` PRD (`storybook-app-routing.md`) both land
- Prerequisite: the user must provide a Storybook screenshot as a `.webp` file

### Testing

- Component test: update the Apps page test to verify the Storybook card renders with the correct title, description, and link
- No testable logic for the `CLAUDE.md` change — documentation-only, verified by review

## Acceptance Criteria

- [ ] `CLAUDE.md`'s Conventions section includes the generic-vs-domain-specific decision rule for new components
- [ ] The convention lists the concrete v1 set of components that moved to `@akli-dev/ui`, so it's unambiguous which existing names are already "claimed" by the shared package
- [ ] Storybook is added to `APP_LINKS` (`src/constants/appLinks.ts`) and appears as a card on the Apps page with title, description, image, and link
- [ ] Card image uses `vite-imagetools` for responsive srcSet generation (matching the pokedex/sand-box pattern)
- [ ] Card links to `https://storybook.akli.dev`
- [ ] No entry is added to `personal-website`'s sitemap for Storybook (it's a separate origin — see Non-Goals)
- [ ] Apps page test updated to verify the Storybook card renders
- [ ] All tests pass (`pnpm test`)
