# PRD: Subdomain Migration — Link & Sitemap Updates

> Primary/detailed PRD: `subdomain-per-app-migration.md` in `akli-infrastructure`. Sibling companion PRDs: `subdomain-migration.md` in `pokedex` and `sand-box`. This PRD covers only `personal-website`'s own side of the migration.

## Overview

Update every place in this repo that hardcodes a link to Pokedex's or Sand-box's old `akli.dev/apps/*` path — the Apps page cards, the Home page's own duplicate app-links section, and the Pokedex blog post — to point at their new dedicated subdomains (`pokedex.akli.dev`, `sandbox.akli.dev`) instead, plus the sitemap entry, once those subdomains are live per the primary PRD.

## Problem Statement

Once `akli-infrastructure`'s Deploy B removes the old path-based CloudFront routing (per the primary PRD), every hardcoded `https://akli.dev/apps/pokedex`/`https://akli.dev/apps/sand-box` link in this repo starts 404ing. That's more than just the Apps page: `src/pages/Home/Home.tsx` keeps its own separate `APPS_ROWS` array with the same two hrefs (not derived from `Apps.tsx`'s `APPS` array — the two lists are independently maintained), and `src/pages/Blog/posts/building-a-pokedex.mdx` links to `akli.dev/apps/pokedex` twice in prose. The sitemap's `/apps/pokedex` entry has the same staleness problem. All of these must be updated *before* Deploy B lands, not after, or visitors hit dead links from the homepage and a published blog post, not just the Apps page.

## Goals

- The Apps page cards link to the new subdomains
- The Home page's own app-link rows link to the new subdomains
- The Pokedex blog post's links point at `pokedex.akli.dev` instead of the old path
- The sitemap no longer lists `/apps/pokedex` as a same-origin route (it's a different origin now)

## Non-Goals

- Any change to the Apps page's layout, card component, or design — this is a data change only (hrefs), following the exact pattern already used when Pokedex was first added (`docs/prds/pokedex-integration.md`)
- Adding `sandbox.akli.dev` to the sitemap — **it was never added in the first place** (verified: only `/apps/pokedex` has an `additionalRoutes` entry in `vite.config.ts` today; Sand-box was apparently never included). No sitemap removal needed for Sand-box, only for Pokedex.
- Cleaning up the now-dead `--exclude "apps/sand-box/*" --exclude "apps/pokedex/*"` flags in this repo's own `deploy.yml` sync command — harmless once those prefixes no longer exist in `SiteBucket` (per PRD #1's and this PRD's cleanup steps), but not required for this PRD's goals. Noted as an optional follow-up, not blocking.

## User Stories

- As a visitor browsing the Apps page or homepage, I want the Pokedex and Sand-box links to point at their real current URLs, so I don't land on a 404.
- As a reader of the Pokedex blog post, I want the "try it" links to work, so a post I might revisit months later doesn't send me to a dead page.
- As a search engine crawler, I want the sitemap to only list routes that are actually part of this site, so `/apps/pokedex` (now a dead path) doesn't get crawled and reported as broken.

## Design & UX

Same card/row layout everywhere, same images/descriptions/prose — only `href` (and, in the blog post, the link text) values change. No component, layout, or content changes beyond that.

## Technical Considerations

- **Sequencing dependency**: this change should be deployed *before* `akli-infrastructure`'s Deploy B (old-behavior removal), per the primary PRD's migration sequence — step 4 happens before step 5. Deploying this too early is harmless (the new subdomains are already live and verified by that point in the sequence); deploying it too late means these links briefly point at dead URLs.
- `src/pages/Apps/Apps.tsx`: update `href: 'https://akli.dev/apps/pokedex'` → `href: 'https://pokedex.akli.dev'` and `href: 'https://akli.dev/apps/sand-box'` → `href: 'https://sandbox.akli.dev'` in the `APPS` array.
- `src/pages/Home/Home.tsx`: same two href updates in its own separate `APPS_ROWS` array (lines ~28/34) — this list is not derived from `Apps.tsx`'s `APPS`, so updating one does not update the other; both need the change independently.
- `src/pages/Blog/posts/building-a-pokedex.mdx`: two occurrences of `[akli.dev/apps/pokedex](https://akli.dev/apps/pokedex)` (intro and closing sections) → `[pokedex.akli.dev](https://pokedex.akli.dev)`, updating both the link text and the href so the displayed text doesn't say one domain while linking to another. No other blog post references either app.
- `vite.config.ts`'s sitemap plugin: remove the `{ route: '/apps/pokedex', priority: 0.7, changefreq: 'monthly' }` entry from `additionalRoutes` — it's no longer a route on this domain.

### Testing

- Component test: update the Apps page test to verify the Pokedex and Sand-box cards link to the new subdomain URLs
- Component test: add or update a Home page test verifying its app-link rows point at the new subdomain URLs — no such assertion exists today, so this is new coverage, not just an update
- Sitemap test: verify the generated sitemap no longer includes `/apps/pokedex`
- No automated test covers MDX blog post content; verify the two updated links manually (rendered blog post, both link text and href)

## Acceptance Criteria

- [ ] Pokedex card (Apps page) links to `https://pokedex.akli.dev`
- [ ] Sand-box card (Apps page) links to `https://sandbox.akli.dev`
- [ ] Home page's Pokedex row links to `https://pokedex.akli.dev`
- [ ] Home page's Sand-box row links to `https://sandbox.akli.dev`
- [ ] Both links in `building-a-pokedex.mdx` point at `https://pokedex.akli.dev`, with link text updated to match
- [ ] Sitemap no longer includes a `/apps/pokedex` entry
- [ ] Apps page test updated to verify both cards' new links
- [ ] Home page test verifies both rows' new links
- [ ] Sitemap test verifies `/apps/pokedex` is no longer present
- [ ] All tests pass (`pnpm test`)

## Open Questions

- None.
