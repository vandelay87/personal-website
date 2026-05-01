# PRD: Images CDN — Phase 1 (Frontend Cutover to `images.akli.dev`)

> **Sibling PRD:** [`akli-infrastructure/docs/prds/images-cdn-phase-1.md`](../../../akli-infrastructure/docs/prds/images-cdn-phase-1.md) — covers standing up the `images.akli.dev` subdomain, the new CloudFront distribution, OAC for the recipe-images bucket, and the resizer key-shape change. **Must deploy before this PRD ships.**
>
> **Epic context:** PRD 2 of 4 in the unified images CDN epic.
> 1. `akli-infrastructure` phase 1 (sibling above) — subdomain + recipe-images origin.
> 2. **THIS PRD** — `personal-website` phase 1: switch the frontend over to the new URL pattern and key shape.
> 3. `akli-infrastructure` phase 2 (future) — add the blog/site bucket as a second origin under the same subdomain.
> 4. `personal-website` phase 2 (future) — migrate MDX/component image references from `akli.dev/images/blog/*` → `images.akli.dev/blog/*`.

## Overview

Cut the frontend over to load processed recipe images from `https://images.akli.dev/recipes/<id>/<file>.webp` instead of the (currently broken) `https://akli.dev/images/processed/recipes/<id>/<file>.webp`. The `key` field shape returned by the recipes API also changes (`processed/recipes/<id>/<type>` → `recipes/<id>/<type>`), so test fixtures and any code that pattern-matches on the old prefix must update in lockstep.

## Problem Statement

The recipe upload→process→serve pipeline is broken at the last hop today. Every URL the frontend constructs for a processed recipe image returns `404 NoSuchKey` from S3 because no CloudFront route serves the recipe-images bucket — verified concretely: `curl https://akli.dev/images/processed/recipes/9d904a59-…/cover-medium.webp` returns the S3 `NoSuchKey` XML.

The sibling PRD changes the production-side contract:

| | Before | After |
|---|---|---|
| Domain | `akli.dev/images/...` | `images.akli.dev/...` |
| `coverImage.key` (in API responses + DynamoDB) | `processed/recipes/<id>/cover` | `recipes/<id>/cover` |
| `step.image.key` | `processed/recipes/<id>/step-N` | `recipes/<id>/step-N` |
| Constructed URL | `https://akli.dev/images/processed/recipes/<id>/cover-medium.webp` | `https://images.akli.dev/recipes/<id>/cover-medium.webp` |

The frontend is the only consumer of this contract. There is **no backwards-compat shim** on either side — the two PRDs deploy in lockstep.

## Goals

- The four call sites of `recipeImageUrl` (RecipeCard, RecipeSteps, RecipeDetailView, ImageUpload) load images from `images.akli.dev` after the change, with no per-call-site code changes.
- The OG meta-tag URL builder in `src/meta.ts` produces the new URL via the shared helper rather than a duplicated hardcoded path — single source of truth for recipe image URLs.
- Test fixtures that hardcode the old `processed/recipes/<id>/...` key shape are updated to the new `recipes/<id>/...` shape, so tests reflect the shipped contract.
- The `recipeImageUrl` helper gains its first dedicated unit test file (currently only tested indirectly), giving the contract change a clear regression guard.
- After the cutover, refreshing the admin editor on a recipe with an uploaded cover image renders the processed variant instead of "Failed to load image".

## Non-Goals

- **Migrating blog images** to the new subdomain — phase 2 sibling PRD; blog continues to load from `akli.dev/images/blog/*` unchanged.
- **Updating the dev S3 upload proxy** (introduced on the `issue-174-manual-qa` branch as `feat(dev): proxy s3 uploads through vite to bypass cors locally`) — the proxy is for *uploads* (PUT to S3 directly via presigned URL), not *reads* (GET via CDN). The cutover doesn't affect uploads at all; the dev proxy stays unchanged whenever it merges to main.
- **Backwards compatibility** for the old URL pattern. The two PRDs deploy together. There is no period where both URLs work.
- **`recipeImageUrl` signature change** to `(recipeId, imageType, variant)` — keeping `(key, variant)` is the smaller-blast-radius choice (see Technical Considerations).
- **Image optimization, format conversion, signed URLs, watermarking, CDN-side resize** — future work.
- **Restructuring `imageStatus` map keys in DynamoDB** is out of scope for this repo (handled in the infra PRD's migration step).
- **Standardising test fixtures** across `src/api/recipes.test.ts` and `src/entry-server.test.tsx` (which currently use simple keys like `'spaghetti-cover'` rather than the realistic `recipes/<id>/cover` shape) — these tests don't assert on URLs, so they pass either way. Worth doing as a follow-up cleanup but not in scope here.

## User Stories

- **As a contributor** uploading a cover image in the admin editor, I want the preview to render the processed image after a refresh — not a "Failed to load image" overlay — so I can verify the upload worked end-to-end without bouncing through devtools.
- **As a public reader** of a published recipe, I want recipe images to load from a CDN URL that actually serves them, so the recipe page renders correctly with no broken images.
- **As a social-media-link consumer** of an OG share card, I want the `og:image` URL to resolve to a real image, so the link preview renders the recipe cover and not a broken thumbnail.
- **As a test maintainer**, I want fixtures to use the same key shape the API actually returns, so tests fail loudly if the contract drifts in either direction.

## Design & UX

Frontend behaviour does not change for the user — same components, same layout, same loading/error states. What changes is the URL the `<img>` tag points at and the shape of the `key` field stored in form state and assertions.

### URL pattern change

The single `RECIPE_IMAGE_BASE` constant in `src/types/recipe.ts` flips:
```diff
- export const RECIPE_IMAGE_BASE = 'https://akli.dev/images'
+ export const RECIPE_IMAGE_BASE = 'https://images.akli.dev'
```

`recipeImageUrl(key, variant)` returns `${RECIPE_IMAGE_BASE}/${key}-${variant}.webp` — unchanged. Combined with the new key shape (`recipes/<id>/cover` instead of `processed/recipes/<id>/cover`), the produced URL is correct without any other code change. Every call site (RecipeCard, RecipeSteps, RecipeDetailView, ImageUpload) gets the new URL transparently.

### `meta.ts` refactor (with `buildMetaTags` fix)

`src/meta.ts:143` currently bypasses the helper and builds a relative URL:
```ts
const coverMediumPath = `/images/${recipe.coverImage.key}-medium.webp`
```

The downstream `buildMetaTags` (line 90) prepends `BASE_URL` (`'https://akli.dev'`) to whatever `image` it receives. That works today because the inline URL is host-relative. **Naively refactoring to `recipeImageUrl(...)` (which returns an absolute `https://images.akli.dev/...` URL) would produce a malformed `https://akli.devhttps://images.akli.dev/...`** because of the unconditional `${BASE_URL}${image}` concat.

Two coupled changes are needed:

1. **`src/meta.ts` `buildMetaTags`** — make the BASE_URL prefix conditional on the image being relative:
   ```ts
   const fullImage = image
     ? (image.startsWith('http') ? image : `${BASE_URL}${image}`)
     : undefined
   ```
   This preserves existing behaviour for blog images (which still pass relative `/images/blog/...` paths) while correctly handling absolute URLs from `recipeImageUrl`.

2. **`src/meta.ts:143`** — switch the recipe branch to use the shared helper:
   ```ts
   const coverMediumPath = recipeImageUrl(recipe.coverImage.key, 'medium')
   ```
   Imports `recipeImageUrl` from `@models/recipe` (existing path alias to `src/types/recipe`, no circular import — `src/types/recipe.ts` has zero imports).

The result: `og:image` and `twitter:image` for recipe pages are absolute `https://images.akli.dev/recipes/<id>/cover-medium.webp` URLs (correct), and blog pages keep producing absolute `https://akli.dev/images/blog/<slug>.webp` URLs (unchanged behaviour). Single source of truth for recipe URL construction is the helper.

### Test fixtures

Two test files hardcode the old key shape and must update:
- `src/components/RecipeSteps/RecipeSteps.test.tsx` — `mockSteps[*].image.key` change from `processed/recipes/recipe-1/step-N` to `recipes/recipe-1/step-N`. Line 47 asserts on the URL produced by `recipeImageUrl` — update the expected URL.
- `src/pages/RecipeDetail/RecipeDetail.test.tsx` — `mockRecipe.coverImage.key` and `mockRecipe.steps[0].image.key` change similarly.

### States — unchanged

- **Loading** — handled by `<Image>` component, unchanged.
- **Loaded** — `<img src={recipeImageUrl(key, 'medium')}>` loads from new URL.
- **Error** — `<Image>` shows "Failed to load image" overlay (correctly sized after the QA fix on the `issue-174-manual-qa` branch; if that branch hasn't merged when this PR ships, the overlay sizing fix should be merged first or the spec amended).
- **Processing** (image uploaded, resizer hasn't completed) — `ImageUpload` shows `<ProcessingPlaceholder>` because `processedAt` is undefined; unchanged. The new URL is only ever attempted once `processedAt` is set, by which point the file definitely exists at the new key.

## Technical Considerations

### Function signature: keep `(key, variant)`, do not refactor to `(recipeId, imageType, variant)`

Two viable signatures:
1. **Keep `recipeImageUrl(key: string, variant: RecipeImageVariant)`** — `key` carries the shape `recipes/<id>/cover` (or `recipes/<id>/step-N`). The function is a pure string interpolation; only the constant changes.
2. Change to `recipeImageUrl(recipeId: string, imageType: 'cover' | 'step', variant, stepOrder?)` — semantically explicit, hides the key shape from callers.

**Pick option 1.** Reasoning:
- The `key` field still exists in the data model and on the wire — it's just shaped differently now. Removing it from the helper signature wouldn't remove it from the wire contract.
- Several call sites only have a `key` available, not the constituent parts. `ImageUpload.tsx:106` receives `currentKey` as a string prop and doesn't have `recipeId` and `imageType` at the call site without prop drilling. Forcing semantic args would push URL-construction concerns into multiple components.
- The change is a one-line constant flip plus four-character cleanup (`processed/` removed from a couple of fixtures). Smallest possible blast radius.
- If/when we want signed URLs, semantic builders, or per-variant policies, we can introduce a separate higher-level helper without breaking `recipeImageUrl`.

### `meta.ts` refactor is mandatory, not optional

Refactor is in scope because the alternative (patching the inline string) leaves a permanent landmine: a duplicated URL builder that will silently drift if we ever change `RECIPE_IMAGE_BASE` again (e.g. moving to a different CDN, adding a query param). DRY here pays for itself the next time the URL pattern changes.

### Lockstep deploy

The change must ship after the infra PRD's deploys complete (cert + ImagesStack + resizer key change). If frontend deploys first, every recipe image URL points at a domain that doesn't resolve yet → 100% broken. If infra deploys first without frontend, the frontend keeps building old URLs against the old domain that no longer has matching keys at the destination → 100% broken. There's no half-deploy state that's better than the current "all broken" state; we don't need a feature flag, just sequence the deploys.

Suggested sequence:
1. Infra PRD's CDK deploy completes (`cdk deploy --all`).
2. Run the manual cleanup steps from the infra PRD (delete old `processed/recipes/*` keys, drop stale `imageStatus` entries from DynamoDB).
3. Verify with `curl https://images.akli.dev/recipes/<id>/cover-medium.webp` after a fresh test upload.
4. Merge this PRD's PR; CI deploys the frontend to akli.dev; the loop closes.

### Dev S3 proxy is unaffected

The dev proxy (currently on the `issue-174-manual-qa` branch — `vite.config.ts` and `src/api/recipes.ts:applyDevS3Proxy`) rewrites the **upload** URL (PUT to S3 via presigned URL) so localhost can bypass S3's CORS. It only rewrites URLs whose host matches `import.meta.env.VITE_S3_BUCKET_HOST`. Reading processed images via the new `images.akli.dev` host doesn't go through the proxy, doesn't need CORS handling (regular `<img src>` doesn't trigger CORS), and works the same in dev and prod. Leave the proxy alone whenever it lands on main.

### `recipeImageUrl` deserves direct unit tests

Today the helper is tested only indirectly through component snapshots/assertions. Given that this PRD changes the contract through the helper, add a dedicated `src/types/recipe.test.ts` that asserts:
- `recipeImageUrl('recipes/abc/cover', 'medium')` returns `'https://images.akli.dev/recipes/abc/cover-medium.webp'`
- All three variants (`thumb`, `medium`, `full`) produce the expected suffix
- Key segments containing realistic UUIDs round-trip correctly (defensive against accidental URL-encoding regressions)

The existing project conventions (Vitest + Testing Library, CSS Modules per CLAUDE.md, `src/<area>/<file>.test.ts` co-location) apply.

### TDD

Per project workflow (`personal-website/CLAUDE.md` "Workflow" — `/simplify` after issue completion; existing TDD precedent in sibling repo). Write the new `recipeImageUrl` tests first (will fail), then flip the constant (passes). Update the two fixture-using test files in the same change so the suite stays green.

### ESLint / formatting

Per CLAUDE.md, run `pnpm exec eslint --fix` on changed `.tsx`/`.ts` files. The `meta.ts` refactor adds an import — auto-fix sorts imports.

## Acceptance Criteria

ACs split into Automated (TDD-able with `pnpm test` / `pnpm lint` before deploy) and Manual (post-deploy verification).

### Automated — `recipeImageUrl` helper

- [ ] `src/types/recipe.ts` `RECIPE_IMAGE_BASE` constant equals `'https://images.akli.dev'`.
- [ ] A new test file `src/types/recipe.test.ts` exists and is run by Vitest. (No existing `src/types/*.test.ts` files; this is a new precedent — fine for a pure-function unit test.)
- [ ] Test asserts `RECIPE_IMAGE_BASE === 'https://images.akli.dev'` (single explicit constant assertion).
- [ ] Test asserts `recipeImageUrl('recipes/abc-123/cover', 'medium')` returns `'https://images.akli.dev/recipes/abc-123/cover-medium.webp'`.
- [ ] Test uses `it.each` (or equivalent) to assert all three `RecipeImageVariant` values (`thumb`, `medium`, `full`) produce the correctly-suffixed URL for the same input key — one parameterized test, not three near-duplicates.
- [ ] Test asserts a UUID-shaped key segment (`recipes/9d904a59-e83f-43b8-9f40-fbdb3008974c/cover`) is preserved verbatim in the URL (no URL-encoding regression).
- [ ] Test asserts `recipeImageUrl('recipes/abc/step-1', 'thumb')` produces `'https://images.akli.dev/recipes/abc/step-1-thumb.webp'`.
- [ ] **Non-encoding contract:** test asserts the result of `recipeImageUrl('recipes/x/y/z', 'medium')` contains literal `/` characters and contains no `%2F`. (Locks down the contract that keys are passed through untouched, not URL-encoded.)
- [ ] **Type-level guard:** test file contains a `// @ts-expect-error` line asserting `recipeImageUrl('recipes/x/cover', 'large')` does NOT type-check. Mirrors the existing convention at `src/api/recipes.test.ts:51`.
- [ ] **Empty-key behaviour locked:** test asserts `recipeImageUrl('', 'medium')` returns `'https://images.akli.dev/-medium.webp'` (locks current implicit behaviour — pure interpolation, no validation). This is the simplest correct contract; if the project later wants to throw on empty keys, that's a separate change with its own AC.

### Automated — `meta.ts` refactor

- [ ] `src/meta.ts:143` no longer constructs the recipe cover URL inline. The recipe-meta branch calls `recipeImageUrl(recipe.coverImage.key, 'medium')` instead.
- [ ] `src/meta.ts` imports `recipeImageUrl` from `@models/recipe`.
- [ ] `src/meta.ts` `buildMetaTags` `fullImage` computation is changed from `image ? \`${BASE_URL}${image}\` : undefined` to a form that skips the BASE_URL prefix when `image` already starts with `http` (e.g. `image.startsWith('http') ? image : \`${BASE_URL}${image}\``). This prevents double-prefixing absolute URLs from `recipeImageUrl`.
- [ ] `src/meta.test.ts` recipe fixtures upgrade `coverImage.key` from `'spaghetti-cover'` (unrealistic) to a key matching the production shape (`'recipes/spaghetti-bolognese/cover'`).
- [ ] `src/meta.test.ts` recipe-branch ACs assert the **full** `og.image` value equals `'https://images.akli.dev/recipes/spaghetti-bolognese/cover-medium.webp'` (not a substring) — this is the regression guard that catches the double-prefix bug if the `buildMetaTags` fix is missed.
- [ ] `src/meta.test.ts` recipe-branch ACs assert `twitter.image` equals the same absolute URL.
- [ ] `src/meta.test.ts` blog-branch tests still pass — blog images continue to be served via the existing relative-path → BASE_URL-prefix flow (verified by adding/keeping a test that asserts a blog `og.image` equals `'https://akli.dev/images/blog/<slug>.webp'`).

### Automated — Test fixture updates

- [ ] `src/components/RecipeSteps/RecipeSteps.test.tsx` `mockSteps[*].image.key` values changed from `processed/recipes/recipe-1/step-N` to `recipes/recipe-1/step-N`.
- [ ] The line-47 URL assertion in `RecipeSteps.test.tsx` updated to use `expect.stringContaining('recipes/recipe-1/step-1-medium')` (matching house style) — not full-string equality, so the assertion stays loosely coupled to host changes.
- [ ] `src/pages/RecipeDetail/RecipeDetail.test.tsx` `mockRecipe.coverImage.key` and `mockRecipe.steps[0].image.key` updated from `processed/recipes/recipe-1/...` to `recipes/recipe-1/...`. **No assertion text changes needed in this file** — it asserts on rendered alt text and structural elements, not on URLs.
- [ ] Both updated test files pass `pnpm exec vitest run`.

### Automated — Quality gates

- [ ] `pnpm test` passes (all suites green).
- [ ] `pnpm lint` passes.
- [ ] `pnpm exec tsc --noEmit` produces no NEW errors. Pre-existing baseline errors (these are expected to remain unchanged by this PRD): `mdast` module resolution in `plugins/`, `AuthContext` null-typing errors, `Recipe.status` string-vs-union mismatches in `entry-server.test.tsx` and `meta.test.ts`. If any new error appears, fix it before merging.
- [ ] `pnpm build` succeeds (catches SSR build issues).

### PR review checklist (manual review during PR, not enforced by tests)

These are not committed CI checks — they are guards the reviewer should run during PR review:

- [ ] `git diff --stat` shows **zero** lines changed in `src/components/RecipeCard/RecipeCard.tsx`, `src/components/RecipeSteps/RecipeSteps.tsx`, `src/components/RecipeDetailView/RecipeDetailView.tsx`, and `src/components/ImageUpload/ImageUpload.tsx` (call sites unaffected — the helper signature is preserved).
- [ ] `grep -rn 'RECIPE_IMAGE_BASE' src/` returns exactly one match (the definition in `src/types/recipe.ts`).
- [ ] `grep -rn 'processed/recipes' src/` returns zero matches (no leftover old key shape in fixtures or assertions).
- [ ] `grep -rn 'akli.dev/images/' src/` returns zero matches in code (catches both old recipe URL hardcodes and any other stragglers; blog references in MDX/`public/` are not under `src/` so are unaffected).
- [ ] `grep -rn 'akli.dev/images/processed' src/` returns zero matches.

### Manual — Deploy lockstep verification (post-deploy)

- [ ] Sibling infra PRD has shipped: `curl -I https://images.akli.dev/recipes/<id>/cover-medium.webp` returns `HTTP/2 200` for a freshly-uploaded test recipe (verified before merging this PR).
- [ ] After this PR ships, the admin editor on a recipe with an uploaded cover image renders the processed variant after a hard refresh (no "Failed to load image" overlay).
- [ ] Network tab on the editor shows requests to `images.akli.dev/recipes/...`, status 200, content-type `image/webp`.
- [ ] No requests to `akli.dev/images/processed/...` in the network tab (regression guard against any missed call site).
- [ ] OG meta tag: `view-source:` of a published recipe page contains `<meta property="og:image" content="https://images.akli.dev/recipes/<id>/cover-medium.webp">`.
- [ ] Social-share preview check: paste a published recipe URL into a Twitter/Slack/Discord share preview and confirm the OG image renders (one-time spot check).

### Manual — Dev workflow unaffected

- [ ] Local `pnpm dev` still allows uploading a new recipe image (the dev S3 proxy still works for uploads — only relevant once the `issue-174-manual-qa` branch has merged).
- [ ] After local upload + refresh, the editor preview loads the image from `images.akli.dev` (proves dev fetches against prod CDN, which is the intended behaviour — local dev consumes prod-served images).
- [ ] DevTools network panel filtered to `images.akli.dev` shows a request returning 200 with `content-type: image/webp` after the post-upload refresh.

### Documentation

- [ ] No CLAUDE.md changes needed in this repo (the architecture section is high-level and the URL change is internal).
- [ ] If the project keeps a CHANGELOG or release notes, a one-line entry: "Recipe images now served from `images.akli.dev`."

## Open Questions

- **Branch ordering with `issue-174-manual-qa`.** That branch carries (a) the dev S3 upload proxy (`d1b1adc`) and (b) the ImageUpload preview-sizing fix (`58d5bbb`). This PRD references both as if landed. If they don't merge before this PRD ships, two follow-ups: dev uploads on localhost will still hit S3 directly (broken on dev only, prod works fine), and the error-state overlay in the editor will be visually cramped (rare path; only triggers if an image URL fails). Recommend merging the QA branch first; raise if there's a reason not to.
- **`src/api/recipes.test.ts` and `src/entry-server.test.tsx` fixture standardisation.** These use simple non-realistic keys (`'spaghetti-cover'`). They don't assert on URLs so they pass either way. The `meta.test.ts` fixtures are pulled into scope by this PRD because the ACs assert on the full URL (which catches the `buildMetaTags` double-prefix bug); the others stay deferred as a separate cleanup.
