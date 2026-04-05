# PRD: Pokedex Integration

## Overview

Add the Pokedex app to the personal-website Apps page as a new card, and include it in the site's sitemap. This is the final epic for the Pokedex project — it connects the finished app to the portfolio site so visitors can discover and access it.

## Problem Statement

The Pokedex app is deployed at `akli.dev/apps/pokedex` but is not discoverable from the main site. Visitors browsing the Apps page won't know it exists, and search engines won't index it via the sitemap.

## Goals

- The Pokedex appears as a card on the Apps page alongside sand-box
- The card links to `https://akli.dev/apps/pokedex`
- The Pokedex URL is included in the site's sitemap for SEO

## Non-Goals

- Changes to the Pokedex app itself — that's handled in the pokedex repo
- Changes to the Apps page layout or design — just adding a card
- CloudFront or S3 deployment config for the Pokedex — that's handled in akli-infrastructure

## User Stories

- As a visitor browsing the Apps page, I want to see the Pokedex listed so I can click through to it.
- As a search engine crawler, I want the Pokedex URL in the sitemap so it gets indexed.

## Design & UX

The new card follows the exact same pattern as the existing sand-box card:

- Card image: a screenshot of the finished Pokedex app (provided as a `.webp` asset)
- Card title: "Pokedex"
- Card description: "A searchable encyclopedia of Gen 1 Pokemon, styled after the classic Game Boy Color Pokedex."
- Card link: `https://akli.dev/apps/pokedex`

The card is added to the `CARDS` array in `src/pages/Apps/Apps.tsx` **before** the sand-box card (most recent app first). Follows the same `CardProps` structure as sand-box.

## Technical Considerations

### Card image

- The screenshot must be provided by the user as a `.webp` file and placed in `src/assets/` (e.g., `src/assets/pokedex.webp`)
- Use `vite-imagetools` for responsive srcSet generation, matching the sand-box pattern:
  ```typescript
  import imgSrc from '../../assets/pokedex.webp'
  import imgSrcSet from '../../assets/pokedex.webp?w=320;640;768;1024;1280;1536;1920&format=webp&as=srcset'
  ```

### Sitemap

The Pokedex is a standalone app (not a page in personal-website), so it won't be auto-discovered by the sitemap plugin. Add a manual entry to the `sitemapPlugin` config in `vite.config.ts`:

- Add `/apps/pokedex` to the `routeConfig` with `priority: 0.7` and `changefreq: 'monthly'`
- The sitemap plugin's `discoverRoutes` function only finds files in `src/pages/`. A manual route needs to be added — either by extending the plugin to accept static routes, or by adding a dummy page file. The simplest approach is to extend the plugin's options to accept an `additionalRoutes` array.

### Prerequisites

- The Pokedex app must be built, deployed, and accessible at `akli.dev/apps/pokedex`
- The user must provide a screenshot of the finished Pokedex as a `.webp` file

### Testing

- **Component test**: update the Apps page test to verify the Pokedex card renders with correct title, description, and link
- **Sitemap test**: verify the generated sitemap includes `/apps/pokedex` with correct priority and changefreq

## Acceptance Criteria

- [ ] Pokedex card is added to the Apps page with title, description, image, and link
- [ ] Card image uses `vite-imagetools` for responsive srcSet generation (matching sand-box pattern)
- [ ] Card links to `https://akli.dev/apps/pokedex`
- [ ] Pokedex card appears before the sand-box card (most recent first)
- [ ] `/apps/pokedex` is included in the sitemap with `priority: 0.7` and `changefreq: 'monthly'`
- [ ] Apps page test updated to verify the Pokedex card renders
- [ ] Sitemap test verifies the Pokedex URL is included
- [ ] All tests pass (`pnpm test`)

## Open Questions

None — all resolved.
