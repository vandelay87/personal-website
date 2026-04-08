# PRD: Recipe Frontend

## Overview

Add public-facing recipe pages to akli.dev — a recipe listing page with tag filtering and client-side search, individual recipe detail pages with SSR for SEO and social sharing, and a homepage callout section. This is PRD 3 of 4 in the recipes epic, consuming the recipe API built in PRD 2.

## Problem Statement

The recipe API (PRD 2) stores and serves recipe data, but there is no way for visitors to browse or read recipes on akli.dev. Without a frontend, the recipe collection is invisible to the public.

## Goals

- Provide a browsable, filterable recipe listing page at `/recipes`.
- Display full recipe details (ingredients, steps with images, metadata) on individual recipe pages at `/recipes/{slug}`.
- SSR recipe detail pages for SEO and Open Graph social sharing (crawlers see full content in the initial HTML).
- Add a homepage callout section to surface latest recipes without adding a nav link.
- Follow the existing neo-brutalist design system, dark mode support, and accessibility standards.
- Client-side search and tag filtering on the listing page for fast, responsive browsing.

## Non-Goals

- **Recipe creation/editing UI** — covered in PRD 4 (Admin Interface).
- **Authentication** — all pages in this PRD are public. No login required.
- **Pagination** — all published recipes are loaded at once via the lightweight index endpoint. Revisit if the collection exceeds ~500 recipes.
- **Print-friendly layout** — deferred to a future iteration.
- **Comments or ratings** — not in scope.
- **Nav link** — recipes are accessed via the homepage callout and direct URLs, not the main navigation.

## User Stories

- As a visitor, I want to browse all published recipes on a listing page so that I can find something to cook.
- As a visitor, I want to filter recipes by tag (e.g. "Italian", "Quick") so that I can narrow down my options.
- As a visitor, I want to search recipes by keyword so that I can find a specific recipe or ingredient.
- As a visitor, I want to see a recipe's cover image, prep/cook time, and servings on the listing card so that I can quickly assess if it suits me.
- As a visitor, I want to view a full recipe with ingredients, step-by-step instructions (with images), and metadata so that I can follow it while cooking.
- As a visitor sharing a recipe link on social media, I want the link preview to show the recipe title, description, and cover image (Open Graph).
- As a visitor on the homepage, I want to see a "From the Kitchen" section with recent recipes so that I discover the recipe collection.

## Design & UX

### Homepage Callout — `RecipesCta`

Follow the existing `AppsCta` pattern: a `<section>` with a heading, body text, and link to `/recipes`. Display up to 3 latest recipe cards (cover image thumbnail, title, tags). Positioned after the `AppsCta` section on the homepage. If fewer than 3 published recipes exist, show however many are available (1 or 2 cards).

**States:**
- **Loading:** Show skeleton placeholders (2–3 card-shaped blocks) while the API response is pending.
- **Empty:** If no published recipes exist, hide the entire section (don't show an empty callout).
- **Error:** Hide the section silently — the homepage should not break if the recipe API is unavailable.

### Recipe Listing Page — `/recipes`

Follow the Blog page pattern with adaptations for recipe-specific content.

**Layout:**
- Page heading: "Recipes"
- Intro text below heading
- Search input: text field at the top that filters recipes by title and ingredient names as the user types (client-side, debounced)
- Tag filter bar: horizontal row of tag buttons (same toggle pattern as Blog tags via URL search params `?tag=Italian`)
- Recipe grid: responsive card grid (1 column mobile, 2 columns tablet, 3 columns desktop)

**Recipe card:**
- Cover image (thumbnail variant, `400px`)
- Recipe title (linked to detail page)
- Tags (displayed as small labels)
- Metadata row: prep time, cook time, servings (with icons or labels)

**States:**
- **Loading:** Skeleton card grid (6 placeholder cards).
- **Empty (no recipes):** "Recipes coming soon" message (same pattern as Blog empty state).
- **Empty (filter/search, no matches):** "No recipes found" with a "Clear filter" button (same pattern as Blog).
- **Error:** Error message with retry button.

### Recipe Detail Page — `/recipes/{slug}`

**Layout:**
- Cover image (hero) with `srcSet` offering medium (800w) and full (1200w) variants, constrained to `var(--max-w-site)` width, with `alt` text
- Recipe title (h1)
- Author name and date
- Metadata bar: prep time, cook time, servings
- Tags (linked back to listing with filter)
- Intro text
- Ingredients list (structured: quantity, unit, item)
- Steps: numbered list, each step with text and optional image (medium variant, `800px`)

**States:**
- **Loading:** Skeleton layout matching the content structure. Only shown on client-side navigation (SSR provides initial content).
- **Not found:** 404 page (reuse existing `NotFound` component).
- **Error:** Error message with retry button.

**Open Graph meta tags** (injected during SSR):
- `og:title` — recipe title
- `og:description` — recipe intro text (truncated to 160 chars)
- `og:image` — cover image medium variant URL
- `og:type` — "article"
- `twitter:card` — "summary_large_image"

### Responsive Behaviour

Follow the project's standard breakpoints (`sm: 640px`, `md: 768px`, `lg: 1024px`):

- **Mobile (<640px):** Single-column card grid, full-width images, stacked metadata
- **Small tablet (640–767px):** Two-column card grid
- **Large tablet (768–1023px):** Two-column card grid (same as small tablet — no layout change at `md`)
- **Desktop (1024px+):** Three-column card grid

**Homepage callout (`RecipesCta`):** On mobile (<640px), recipe cards stack vertically. On tablet+ (640px+), horizontal row.

### Dark Mode

All components must support dark mode via the existing `data-theme` attribute and design tokens. Cover images and recipe photos should not be dimmed — they should display at full brightness in both themes.

## Technical Considerations

### New Routes

Add to `src/App.tsx`:
- `/recipes` → `Recipes` page component
- `/recipes/:slug` → `RecipeDetail` page component

### New Components

Following existing conventions (`src/components/<Name>/<Name>.tsx` + barrel `index.ts` + co-located test):

- **`RecipesCta`** — Homepage callout section. Fetches 3 latest recipes from the API on mount. Renders recipe preview cards.
- **`RecipeCard`** — Reusable card for listing and homepage. Displays cover thumbnail, title, tags, metadata.
- **`RecipeSearch`** — Controlled text input for client-side keyword search. Debounced (300ms) to avoid excessive re-renders.
- **`RecipeTagFilter`** — Tag filter bar using URL search params. Same toggle pattern as Blog tags.
- **`RecipeIngredients`** — Structured ingredients list (quantity, unit, item).
- **`RecipeSteps`** — Numbered step list with optional step images.
- **`RecipeMetaBar`** — Prep time, cook time, servings display with semantic labels.

### New Pages

- **`src/pages/Recipes/Recipes.tsx`** — Listing page. Fetches lightweight recipe index from `GET https://api.akli.dev/recipes` and `GET https://api.akli.dev/recipes/tags`. Client-side filtering by tag (URL search param) and keyword search.
- **`src/pages/RecipeDetail/RecipeDetail.tsx`** — Detail page. Fetches full recipe from `GET https://api.akli.dev/recipes/{slug}`.

### API Service Layer

Create `src/api/recipes.ts` — a thin fetch wrapper for the recipe API:
- `fetchRecipes(): Promise<RecipeIndex[]>` — lightweight listing
- `fetchRecipe(slug: string): Promise<Recipe>` — full detail
- `fetchTags(): Promise<Tag[]>` — tag list with counts

Base URL: `https://api.akli.dev`. No authentication headers needed for public endpoints.

### Type Definitions

Create `src/types/recipe.ts` with TypeScript interfaces matching the API response shapes (`RecipeIndex`, `Recipe`, `Ingredient`, `Step`, `RecipeImage`, `Tag`).

### Data Fetching Pattern

This is the first runtime API integration on the site (everything else is static/build-time). Use `fetch` directly — no need for a data-fetching library at this scale.

- **Listing page:** Fetch on component mount via `useEffect`. Store in component state. No caching needed (the page re-fetches on each visit; the data is lightweight).
- **Detail page:** Needs SSR for SEO/social sharing. This requires changes to the SSR pipeline.

### SSR Changes for Recipe Detail

The current SSR pipeline (`entry-server.tsx`) renders the app synchronously — there's no async data fetching during SSR. To SSR recipe detail pages:

1. **`lambda-handler.ts`**: For paths matching `/recipes/:slug`, fetch the recipe from `https://api.akli.dev/recipes/{slug}` before calling `render()`. Pass the fetched data to the updated `render()` function. If the API returns 404, the lambda should return a 404 status code (not 200 with a loading shell).
2. **`entry-server.tsx`**: Update the `render()` signature to accept optional prefetched data: `render(url: string, data?: { recipe?: Recipe }): Promise<string>`. Wrap the `<App />` in a `RecipeDataContext.Provider` with the prefetched data. The context is created in a new `src/contexts/RecipeDataContext.ts` file.
3. **`RecipeDetail` page**: On mount, check `RecipeDataContext` first. If data is present (SSR or initial hydration), use it immediately — **do not re-fetch during hydration** to avoid React hydration mismatches. On client-side navigation (context is empty), fetch from the API.
4. **`meta.ts`**: Extend `getMetaTags()` to accept optional recipe data for dynamic Open Graph tags. The lambda handler passes the fetched recipe to `buildHeadHtml()` so meta tags are in the initial HTML.
5. **`meta.ts`**: Register `/recipes/:slug` as a known route pattern so SSR returns 200 for valid recipes (or 404 when the API confirms the slug doesn't exist).

**SSR scope note:** Only recipe detail pages are SSR'd with prefetched data. The listing page (`/recipes`) and homepage callout (`RecipesCta`) fetch client-side via `useEffect`. This means crawlers hitting `/recipes` will see the page shell without recipe content. This is an acceptable trade-off — the listing page is less important for SEO than individual recipe pages, and adding SSR data-fetching for every page adds significant complexity. Revisit if SEO for the listing page becomes a priority.

**Fallback:** If the API fetch fails during SSR, render the page with a loading state and let the client hydrate and retry. This ensures the site doesn't break if the API is temporarily down.

### Image Handling

Recipe images are served from `https://akli.dev/images/processed/recipes/{id}/...` via CloudFront (configured in PRD 2).

- Use `<img>` tags with `srcSet` for responsive images:
  - Card thumbnails: `{key}-thumb.webp 400w`
  - Step images: `{key}-medium.webp 800w`
  - Hero/cover: `{key}-medium.webp 800w, {key}-full.webp 1200w`
- Set `loading="lazy"` on all images except the hero cover image (which should be eager for LCP).
- All images require `alt` text (provided in the API response).

### Accessibility

- Recipe listing uses a `<ul>` with `<li>` items.
- Tag filter buttons use `aria-pressed` (same pattern as Blog).
- Search input has a visible `<label>` or `aria-label`.
- Ingredients list uses `<ul>`.
- Steps list uses `<ol>`.
- Images have `alt` text from the API.
- Metadata uses semantic HTML (`<time>` for dates, descriptive labels for prep/cook time).
- Keyboard navigation: all interactive elements are focusable and operable via keyboard.
- Focus styles: use `:focus-visible` with `outline: var(--border-width) solid var(--color-primary)` (consistent with existing components).
- Respect `prefers-reduced-motion`: disable hover animations/transforms when user prefers reduced motion.
- Live region: when search/tag filtering updates the recipe count, announce the result count via an `aria-live="polite"` region for screen readers.

### TDD Approach

Follow test-driven development: write component tests with Vitest + Testing Library before implementing the components. Tests should cover rendering, user interactions (filtering, searching), loading/error/empty states, and accessibility (ARIA attributes).

## Acceptance Criteria

### Homepage Callout
- [ ] A `RecipesCta` section appears on the homepage after the `AppsCta` section.
- [ ] It displays up to 3 latest published recipe cards (cover thumbnail, title, tags). If fewer than 3 exist, it shows however many are available (1 or 2 cards).
- [ ] It includes a heading ("From the Kitchen" or similar) and a link to `/recipes`.
- [ ] If no published recipes exist, the section is not rendered.
- [ ] If the API request fails, the section is not rendered (no error shown on homepage).
- [ ] Skeleton placeholders are shown while the API response is loading.

### Recipe Listing Page
- [ ] `/recipes` displays all published recipes as a responsive card grid (1 col mobile, 2 col tablet, 3 col desktop).
- [ ] Each recipe card shows: cover image thumbnail, title (linked to detail page), tags, prep time, cook time, and servings.
- [ ] A search input filters recipes by title and ingredient names as the user types (debounced, client-side).
- [ ] Tag buttons filter recipes by tag via URL search param (`?tag=Italian`). Clicking an active tag clears the filter.
- [ ] Search and tag filtering can be combined (results match both).
- [ ] When no recipes match the filter/search, a "No recipes found" message and "Clear filter" button are displayed.
- [ ] When no published recipes exist at all, a "Recipes coming soon" message is displayed.
- [ ] An error state with a retry button is displayed if the API request fails.
- [ ] Skeleton card placeholders are shown while loading.

### Recipe Detail Page
- [ ] `/recipes/{slug}` displays the full recipe: cover image (hero), title, author, date, metadata (prep/cook/servings), tags, intro, ingredients list, and numbered steps with optional images.
- [ ] The cover image uses a `srcSet` with medium (800w) and full (1200w) variants, constrained to `var(--max-w-site)`, with `loading="eager"` for LCP.
- [ ] Step images use the medium variant (`800px`) with `loading="lazy"`.
- [ ] Tags link back to the listing page with the tag filter applied (`/recipes?tag=X`).
- [ ] A 404 page is shown for non-existent slugs or draft recipes.
- [ ] An error state with a retry button is displayed if the API request fails on client-side navigation.

### SSR & SEO
- [ ] Recipe detail pages are server-side rendered with the full recipe content in the initial HTML.
- [ ] Open Graph meta tags are present in the SSR HTML: `og:title` (recipe title), `og:description` (intro, max 160 chars), `og:image` (cover medium URL), `og:type` ("article").
- [ ] Twitter card meta tags are present: `twitter:card` ("summary_large_image"), `twitter:title`, `twitter:description`, `twitter:image`.
- [ ] If the API is unavailable during SSR, the page renders with a loading state and the client retries.
- [ ] `/recipes/:slug` is registered as a known route pattern. SSR returns 200 for valid recipes, 404 when the API confirms the slug doesn't exist.

### Design & Responsiveness
- [ ] All recipe components use CSS Modules and the existing design token system.
- [ ] No rounded corners — all components use `var(--radius-none)`.
- [ ] Recipe cards use `var(--shadow-md)` at rest and `var(--shadow-lg)` on hover, consistent with the existing Card component.
- [ ] Dark mode is fully supported — all recipe components adapt via `data-theme` tokens.
- [ ] Recipe images display at full brightness in both light and dark mode.

### Accessibility
- [ ] Recipe listing uses `<ul>` / `<li>` semantics.
- [ ] Tag filter buttons have `aria-pressed` attribute.
- [ ] Search input has a visible label or `aria-label`.
- [ ] Ingredients use `<ul>`, steps use `<ol>`.
- [ ] All images have `alt` text.
- [ ] All interactive elements are keyboard-navigable.
- [ ] Focus styles use `:focus-visible` with `outline: var(--border-width) solid var(--color-primary)`.
- [ ] Hover animations on recipe cards are disabled under `prefers-reduced-motion: reduce`.
- [ ] An `aria-live="polite"` region announces the filtered recipe count when search or tag filters change.

### Testing

**Mocking strategy:** Tests mock the `src/api/recipes.ts` module (not `global.fetch`). The API module itself is tested separately with `global.fetch` mocked at the boundary. This keeps component tests focused on rendering behaviour.

- [ ] `src/api/recipes.ts` tests: successful responses, HTTP error handling (4xx, 5xx), network failures, response shape validation.
- [ ] `RecipesCta` tests: renders up to 3 latest recipes, handles 1 or 2 recipes (shows available count), handles empty state (not rendered), handles API error (not rendered), shows skeletons while loading.
- [ ] `RecipeCard` tests: renders all fields (thumbnail, title, tags, metadata), links to correct detail page.
- [ ] `Recipes` page tests: renders recipe grid, filters by tag via search params, searches by keyword, combined tag + search filtering, shows empty state, shows error state with retry (clicking retry re-fetches).
- [ ] `RecipeDetail` page tests: renders full recipe content, shows 404 for missing slug, shows error state with retry, uses SSR data from context when available, fetches from API when SSR context is absent, tag links navigate to `/recipes?tag=X`.
- [ ] `RecipeSearch` tests: debounces input using fake timers (`vi.useFakeTimers()`) — filter callback is not called until 300ms after the last keystroke.
- [ ] `RecipeTagFilter` tests: toggles tags, updates URL search params.
- [ ] Tests follow TDD — written before implementation.

