# PRD: Subdomain Migration — Apps Page & Sitemap Update

> Primary/detailed PRD: `subdomain-per-app-migration.md` in `akli-infrastructure`. Sibling companion PRDs: `subdomain-migration.md` in `pokedex` and `sand-box`. This PRD covers only `personal-website`'s own side of the migration.

## Overview

Update the Apps page cards and sitemap to point at Pokedex's and Sand-box's new dedicated subdomains (`pokedex.akli.dev`, `sandbox.akli.dev`) instead of their old `akli.dev/apps/*` paths, once those subdomains are live per the primary PRD.

## Problem Statement

Once `akli-infrastructure`'s Deploy B removes the old path-based CloudFront routing (per the primary PRD), the hardcoded hrefs in `src/pages/Apps/Apps.tsx` (`https://akli.dev/apps/pokedex`, `https://akli.dev/apps/sand-box`) and the sitemap's `/apps/pokedex` entry would point at URLs that now 404. This must be updated *before* Deploy B lands, not after, or the Apps page briefly links to dead URLs.

## Goals

- The Apps page cards link to the new subdomains
- The sitemap no longer lists `/apps/pokedex` as a same-origin route (it's a different origin now)

## Non-Goals

- Any change to the Apps page's layout, card component, or design — this is a data change only (hrefs), following the exact pattern already used when Pokedex was first added (`docs/prds/pokedex-integration.md`)
- Adding `sandbox.akli.dev` to the sitemap — **it was never added in the first place** (verified: only `/apps/pokedex` has an `additionalRoutes` entry in `vite.config.ts` today; Sand-box was apparently never included). No sitemap removal needed for Sand-box, only for Pokedex.
- Cleaning up the now-dead `--exclude "apps/sand-box/*" --exclude "apps/pokedex/*"` flags in this repo's own `deploy.yml` sync command — harmless once those prefixes no longer exist in `SiteBucket` (per PRD #1's and this PRD's cleanup steps), but not required for this PRD's goals. Noted as an optional follow-up, not blocking.

## User Stories

- As a visitor browsing the Apps page, I want the Pokedex and Sand-box cards to link to their real current URLs, so I don't land on a 404.
- As a search engine crawler, I want the sitemap to only list routes that are actually part of this site, so `/apps/pokedex` (now a dead path) doesn't get crawled and reported as broken.

## Design & UX

Same card layout, same images/descriptions — only the `href` values change in the `APPS` array in `src/pages/Apps/Apps.tsx`.

## Technical Considerations

- **Sequencing dependency**: this change should be deployed *before* `akli-infrastructure`'s Deploy B (old-behavior removal), per the primary PRD's migration sequence — step 4 happens before step 5. Deploying this too early is harmless (the new subdomains are already live and verified by that point in the sequence); deploying it too late means the Apps page briefly links to dead URLs.
- `src/pages/Apps/Apps.tsx`: update `href: 'https://akli.dev/apps/pokedex'` → `href: 'https://pokedex.akli.dev'` and `href: 'https://akli.dev/apps/sand-box'` → `href: 'https://sandbox.akli.dev'` in the `APPS` array.
- `vite.config.ts`'s sitemap plugin: remove the `{ route: '/apps/pokedex', priority: 0.7, changefreq: 'monthly' }` entry from `additionalRoutes` — it's no longer a route on this domain.

### Testing

- Component test: update the Apps page test to verify the Pokedex and Sand-box cards link to the new subdomain URLs
- Sitemap test: verify the generated sitemap no longer includes `/apps/pokedex`

## Acceptance Criteria

- [ ] Pokedex card links to `https://pokedex.akli.dev`
- [ ] Sand-box card links to `https://sandbox.akli.dev`
- [ ] Sitemap no longer includes a `/apps/pokedex` entry
- [ ] Apps page test updated to verify both cards' new links
- [ ] Sitemap test verifies `/apps/pokedex` is no longer present
- [ ] All tests pass (`pnpm test`)

## Open Questions

- None.
