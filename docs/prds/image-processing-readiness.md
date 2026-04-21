# PRD: Image Processing Readiness — Frontend

> **Sibling PRD:** [`akli-infrastructure/docs/prds/image-processing-readiness.md`](../../../akli-infrastructure/docs/prds/image-processing-readiness.md) — covers the resizer Lambda write-back, `imageStatus` DynamoDB attribute, `GET /recipes/admin/{id}` endpoint, and the server-side publish guard consumed here.
>
> **Context:** Follow-up to [`draft-recipes.md`](./draft-recipes.md), which shipped the async image-upload flow without a readiness signal.

## Overview
Admin surfaces (editor, preview, card thumbnails) must stop assuming an uploaded image is immediately servable. The frontend gates rendering of processed image variants on a per-image `processedAt` timestamp, shows a "Processing…" skeleton while the resizer is still running, polls for readiness, and disables publish until every image on the recipe is ready.

## Problem Statement
On the admin recipe preview page, a just-uploaded cover image 404s: `GET https://akli.dev/images/processed/recipes/<id>/cover-{medium,full}.webp`. `ImageUpload.tsx:75` calls `onUpload(key)` the instant the raw PUT to S3 resolves, autosave persists the processed `key` to DynamoDB within 2s (`RecipeEditor.tsx:272`), and any surface that renders `recipeImageUrl(key, variant)` — including `RecipeDetailView.tsx:27-28`, `RecipeSteps.tsx:19`, `RecipeCard.tsx:17`, and `ImageUpload.tsx:106` — hits S3 before the image-resizer Lambda has written the variants. The render-loop symptoms in the console (deep `hf @ Ka` stack frames) are React commit noise, not a real loop, but the 404s themselves are real and user-visible on the preview page.

## Goals
- Every surface that renders a recipe image tolerates `processedAt` being absent by showing a skeleton, not a broken image or a 404.
- The editor reflects readiness in real time: a fresh upload flips from "Processing…" to the processed variant within seconds, without a manual refresh.
- Publish is blocked — client-side, in sync with the server — while any image on the recipe is still processing; the blocking reason appears in the existing missing-fields list.
- Polling stops cleanly on unmount and does not leak intervals, requests, or state updates after unmount.

## Non-Goals
- Retry UI for a stuck / failed resizer run. If processing doesn't complete in 60s the user sees a "Processing is taking longer than expected — try refreshing" message; there's no explicit retry button. Tracked as a possible follow-up.
- Real-time signalling via WebSocket or SSE. Fixed-interval polling is sufficient at this scale.
- Client-side image resize before upload.
- Readiness UX on public surfaces. The public `Recipes` page and public recipe detail only render `published` recipes, which are guaranteed ready by the server-side publish guard — no client logic needed.

## User Stories
- As an admin, when I upload a cover image, I want the preview page to show a "Processing…" skeleton rather than a broken image, so I know the image is on the way and I'm not staring at a 404.
- As an admin, I want the preview to auto-update to the real image within a few seconds of uploading, so I can sanity-check what I uploaded without refreshing the page.
- As an admin, I want the Publish button to stay disabled until every image is ready, so I can't accidentally publish a recipe whose images will 404 for public readers.
- As an admin, if processing stalls, I want a clear message telling me to refresh, so I'm not stuck watching a spinner forever.

## Design & UX

**Editor (`/admin/recipes/:id/edit`)**
- `ImageUpload` gains a new prop `processedAt?: number`. Render order:
  1. If `preview` (local blob URL) is set → render the blob. Unchanged.
  2. Else if `currentKey && processedAt` → render `recipeImageUrl(currentKey, 'medium')` via `<Image>`. Unchanged semantics, but now gated.
  3. Else if `currentKey && !processedAt` → render a "Processing…" skeleton: an inset box matching the `<Image>` component's placeholder styling, a pulsing dot (honouring `prefers-reduced-motion: reduce`), and the text "Processing image…". `role="status"` with `aria-live="polite"`.
  4. Else → no preview, the Upload button shows. Unchanged.
- When polling flips `processedAt` from undefined to a number, the form state updates via reducer and the skeleton branch gives way to the `<Image>`. The `aria-live` region announces "Image ready" once.
- Publish button (`RecipeEditor.tsx:526`) is already disabled by `computeMissingFields`. Extend that function to also check `coverImage.key && !coverImage.processedAt` → push "Cover image still processing"; same per step with a key but no processedAt → "Step N image still processing". These appear in the existing missing-fields `<ul>` with `aria-describedby` wiring intact.

**Preview page (`/admin/recipes/:id/preview`, via `RecipeDetailView`)**
- When `recipe.coverImage.processedAt` is absent, render the skeleton + "Processing…" treatment in place of the `<img>` + srcSet (current lines 25-31 of `RecipeDetailView.tsx`). The surrounding layout (title, meta) is unaffected — the skeleton fills the same aspect-ratio box.
- The `RecipePreview` page already fetches via `fetchMyRecipes` on mount. Hoist polling into the shared hook `useImageProcessingPoll` so the page auto-refreshes the recipe while any image lacks `processedAt`.

**Step images (`RecipeSteps`)**
- Same skeleton treatment per step image lacking `processedAt`. The step's text and number render normally; only the image slot shows the skeleton.

**Admin list (`RecipeList`) and `RecipeCard` thumbnails**
- `RecipeCard.tsx:17` uses the `'thumb'` variant. In practice, an admin hits the list only after processing has completed (list fetches are not during upload flows), so the only way to see an unready thumb is if the admin re-enters the list while an upload is still in flight in another tab. Render the skeleton there too for consistency — trivial to add and defensive against the corner case.

**Timeout state**
- If polling runs for 60s without all images becoming ready, the editor banner shows: "Processing is taking longer than expected — try refreshing the page." `role="status"`, `aria-live="polite"` — informational, not urgent; `assertive` would interrupt other announcements unnecessarily. The Publish button stays disabled. Polling stops.

**States**
- Ready (all images have `processedAt`) — normal render, no polling.
- Processing (one or more images lack `processedAt`) — skeleton per unready image, 1500ms polling, Publish disabled with "still processing" reasons.
- Timeout — skeleton + banner "taking longer than expected", polling stopped, Publish disabled.
- Error (polling request itself 401s) — delegate to `handleSessionError` per existing pattern.

## Technical Considerations

**Shared API contract (repeated from the sibling infra PRD so this PRD is self-contained):**

`RecipeImage` gains an optional field:
```ts
interface RecipeImage {
  key: string
  alt: string
  processedAt?: number // unix ms; absent = still processing
}
```

Every recipe response — `GET /recipes`, `GET /recipes/{slug}`, `GET /me/recipes`, `GET /recipes/admin`, `GET /recipes/admin/{id}`, `PATCH /recipes/{id}`, `PATCH /recipes/{id}/publish`, `PATCH /recipes/{id}/unpublish` — includes `processedAt` on each image where it's available.

New endpoint:
- `GET /recipes/admin/{id}` → admin JWT. Response: the full `Recipe`. Used for single-recipe polling.

Modified endpoint:
- `PATCH /recipes/{id}/publish` → may return 400 with `errors.coverImage.processedAt = 'Cover image still processing'` or, for step images, `errors.stepImages = [{ order, processedAt: 'Step image still processing' }, ...]`. Distinct from the existing `errors.steps` (empty-text check), which keeps its current shape.

**Type changes (`src/types/recipe.ts`)**
- `RecipeImage.processedAt?: number`.
- No other type changes.

**API client (`src/api/recipes.ts`)**
- Add `fetchRecipeByIdAdmin(token: string, id: string): Promise<Recipe>` → `GET /recipes/admin/{id}`. Throws on non-2xx; identical error shape to existing helpers.
- No other API changes.

**New hook (`src/hooks/useImageProcessingPoll.ts`)**
- Signature: `useImageProcessingPoll(recipe: Recipe | null, onReady: (updates: ImageReadyUpdate[]) => void, { intervalMs = 1500, timeoutMs = 60000 } = {}): { timedOut: boolean }`.
- `ImageReadyUpdate = { key: string; processedAt: number }` — the hook emits per-image readiness keyed by the image's S3 key (not step order), so the reducer can match against the current form state and ignore stale updates if the user has since swapped the image.
- Polling starts when the recipe has at least one image with a `key` but no `processedAt`. The trigger is derived inside the hook via `useMemo` over `recipe.id` + the set of unready keys, so a new recipe object reference with the same id + same unready set does not restart polling.
- **Recipe identity change**: when `recipe?.id` changes between renders, the hook aborts any in-flight request, resets the 60s timeout, and re-evaluates readiness from scratch against the new recipe. A long-running poll against recipe A cannot invoke `onReady` after recipe B has mounted.
- On each tick, calls `fetchRecipeByIdAdmin(token, recipe.id)`; on success, diffs the response's image `processedAt` values against what the hook last emitted and calls `onReady` with only the newly-ready entries.
- Stops when the most recently observed recipe shows every image with a key has a `processedAt`, or when `timeoutMs` elapses from the current recipe's first tick.
- Cleanup on unmount aborts in-flight requests via `AbortController` (mirroring `useAutosave.ts:75-76`) and clears the interval.
- 401 handling delegates to `handleSessionError` (existing pattern in `useAutosave.ts:90` and `RecipeList.tsx`). A 404 mid-poll (recipe was deleted) stops polling silently.
- Reads the token via `useAuth().getAccessToken`, so consumers don't pass a token explicitly.

**Reducer extension (`RecipeEditor.tsx`)**
- New action `IMAGE_STATUS_UPDATE` with payload `ImageReadyUpdate[]` — each entry is `{ key: string; processedAt: number }`. The reducer matches each entry by `key`:
  - If `key === form.coverImageKey` → set `form.coverImageProcessedAt = processedAt`.
  - For each `step` where `step.image?.key === key` → set `step.image.processedAt = processedAt`.
  - Entries whose `key` no longer matches any image on the form (user has swapped or removed it) are ignored — no stale skeleton-to-image flip on a superseded key.
- The reducer does **not** mark the form dirty (readiness updates are server-originated, not user edits). `useAutosave`'s existing `if (!state.dirty) return` gate at `useAutosave.ts:105` means readiness updates won't trigger a spurious PATCH even though they do mutate the form state.
- New form field: `coverImageProcessedAt?: number`. `Step.image` already carries `processedAt?` after the type change.
- `recipeToFormState` pulls `processedAt` off the incoming recipe.
- `buildPatchPayload` currently does not serialise nested image objects (it reads `form.coverImageKey` and `form.coverImageAlt` separately) so `processedAt` cannot leak client-side today. This is noted as future-proofing: if `buildPatchPayload` is ever refactored to send `coverImage` as an object, it must omit `processedAt`. The server strips client-supplied readiness fields regardless per the sibling PRD.

**Editor wiring**
- `RecipeEditor` calls `useImageProcessingPoll(loadedRecipe, (updates) => dispatch({ type: 'IMAGE_STATUS_UPDATE', updates }))` where `loadedRecipe` is the last recipe pulled from the server. The hook returns `{ timedOut }`; the editor renders the timeout banner when true.
- Once readiness flips, the editor calls the existing `announce()` helper (`RecipeEditor.tsx:358-360`, piped through the page-level `<div role="status" aria-live="polite">` at `RecipeEditor.tsx:575-577`) to announce "Image ready". This is a single live region for the whole editor — individual placeholders do **not** carry their own `aria-live` to avoid multi-placeholder chatter when several step images process concurrently.
- `ImageUpload` gets `processedAt={form.coverImageProcessedAt}` (cover) / `processedAt={step.image?.processedAt}` (each step).
- `computeMissingFields` in `RecipeEditor.tsx:123` gains:
  ```
  if (form.coverImageKey && !form.coverImageProcessedAt) missing.push('Cover image still processing')
  form.steps.forEach((s, i) => {
    if (s.image?.key && !s.image.processedAt) missing.push(`Step ${i + 1} image still processing`)
  })
  ```

**`<ProcessingPlaceholder>` component (new, `src/components/ProcessingPlaceholder/`)**
- Sibling component to `<Image>` — keeps `<Image>` focused and the processing skeleton styleable independently. Callers pick one based on readiness.
- Props: `{ aspectRatio?: string; caption?: string; className?: string }`. Caption defaults to "Processing image…".
- Renders a div with 2px hard border, `var(--radius-none)`, no rounded corners. Pulsing overlay uses a 1.6s ease-in-out opacity animation; `@media (prefers-reduced-motion: reduce)` swaps to a static muted background.
- **No `aria-live` on the placeholder itself.** With multiple unready step images, per-placeholder live regions would all chatter on mount. The editor routes the "Image ready" announcement through its existing single page-level `aria-live="polite"` region (`RecipeEditor.tsx:575-577`) via the `announce()` helper. The placeholder's visible caption ("Processing image…") is sufficient for sighted users; screen-reader users get the single-announcement treatment on state change, not on every placeholder mount.

**`RecipeDetailView.tsx` changes**
- Wrap the current `<Image>` render in a conditional: if `recipe.coverImage.processedAt` absent → `<ProcessingPlaceholder aspectRatio="16/9" />`. Otherwise existing render unchanged.

**`RecipeSteps.tsx` changes**
- Same pattern per step image.

**`RecipeCard.tsx` changes**
- Same pattern for the `'thumb'` variant render.

**`StepList.tsx` changes**
- Currently passes `currentKey={step.image?.key}` to each `<ImageUpload>` (`StepList.tsx:77`). Add `processedAt={step.image?.processedAt}` alongside, so the per-step upload component can render the correct branch (blob preview / processing skeleton / ready image). No other changes to `StepList` are needed — step text, reordering, and removal are untouched.

**`RecipePreview` page**
- Currently fetches the full admin list via `fetchMyRecipes` and scans for the id. Switch to a single-recipe fetch via `fetchRecipeByIdAdmin(token, id)` on mount — cheaper, and lets `useImageProcessingPoll(recipe, (updates) => setRecipe(mergeReadiness(recipe, updates)))` drive auto-updates without a second fetch path. A small helper `mergeReadiness(recipe, updates)` applies the same key-matching rules as the editor reducer.

**CSS (neo-brutalist compliance)**
- Skeleton placeholder uses `var(--radius-none)`, 2px hard border, no rounded corners, per existing conventions in `Image.module.css`.
- Pulsing animation uses a 1.6s ease-in-out opacity animation; `@media (prefers-reduced-motion: reduce)` swaps to a static muted background.
- "Processing…" caption uses existing typography tokens, no new colours.

**Testing approach (Vitest + Testing Library)**
- `useImageProcessingPoll` — two suites per the established pattern in `useAutosave.test.ts`:
  - State-machine tests: starts polling when state has unready images; stops when all ready; stops on timeout; aborts in-flight on unmount; invokes `onStatusUpdate` on each tick; delegates 401 to `handleSessionError`. No fake timers needed for most.
  - Timing tests: `vi.useFakeTimers()` in `beforeEach`, `vi.useRealTimers()` in `afterEach`. Assert 1500ms interval, 60s timeout, stop-on-ready transitions.
- `ImageUpload` — three branches rendered: blob preview, processing skeleton, ready image. `processedAt` prop drives the skeleton→image swap.
- `RecipeDetailView`, `RecipeSteps`, `RecipeCard` — processing skeleton renders when `processedAt` absent.
- `ProcessingPlaceholder` — renders caption, has `role="status"`, honours `prefers-reduced-motion` (assert the class/style switch, not the animation itself).
- `RecipeEditor` — Publish button disabled when cover image or any step image has `key` but no `processedAt`; missing-fields list contains "Cover image still processing" / "Step N image still processing"; `IMAGE_STATUS_UPDATE` merges without marking dirty.
- Timeout banner — polling that never resolves reaches the 60s timeout and shows the banner.
- TDD-first: write the hook and component tests before implementation.

## Acceptance Criteria

Types (`src/types/recipe.ts`):
- [ ] `RecipeImage.processedAt?: number` is added; no other interfaces change.

API client (`src/api/recipes.ts`):
- [ ] `fetchRecipeByIdAdmin(token, id)` hits `GET /recipes/admin/{id}` and returns a `Recipe`; throws on non-2xx.

Polling hook (`src/hooks/useImageProcessingPoll.ts`):
- [ ] Under fake timers, given a recipe with one unready image, exactly N fetches fire after N×1500ms have elapsed.
- [ ] Stops polling once the most recent response shows every image with a key has a `processedAt`.
- [ ] Stops polling after 60s of continuous processing and reports `timedOut: true`.
- [ ] Aborts the in-flight request and clears the interval on unmount via `AbortController`.
- [ ] When `recipe.id` changes between renders, the hook aborts the in-flight request, resets the 60s timeout, and re-evaluates readiness against the new recipe — no `onReady` callback for recipe A can fire after recipe B has mounted.
- [ ] Delegates 401 responses to `handleSessionError(err, logout, navigate)` — no silent failures.
- [ ] A 404 mid-poll stops polling silently (recipe was deleted).
- [ ] Never fires when the recipe is `null` (not yet loaded).
- [ ] Invokes `onReady` with `{ key, processedAt }` entries only for images that flipped from unready to ready on that tick (no duplicate emissions).

`ImageUpload` (`src/components/ImageUpload/ImageUpload.tsx`):
- [ ] Accepts a new prop `processedAt?: number`.
- [ ] When `preview` is set → renders the blob preview. Unchanged.
- [ ] When `currentKey && processedAt` → renders the processed image via `<Image>`.
- [ ] When `currentKey && !processedAt && !preview` → renders `<ProcessingPlaceholder>`.

`StepList` (`src/components/StepList/StepList.tsx`):
- [ ] Passes `processedAt={step.image?.processedAt}` to each per-step `<ImageUpload>` alongside the existing `currentKey`.

`RecipeDetailView` (`src/components/RecipeDetailView/RecipeDetailView.tsx`):
- [ ] Renders `<ProcessingPlaceholder>` in place of the cover `<img>` when `recipe.coverImage.processedAt` is absent.

`RecipeSteps` (`src/components/RecipeSteps/RecipeSteps.tsx`):
- [ ] Renders `<ProcessingPlaceholder>` per step image when `step.image.processedAt` is absent.

`RecipeCard` (`src/components/RecipeCard/RecipeCard.tsx`):
- [ ] Renders `<ProcessingPlaceholder>` in place of the `'thumb'` variant when `recipe.coverImage.processedAt` is absent.

`RecipeEditor` (`src/pages/admin/RecipeEditor/RecipeEditor.tsx`):
- [ ] Form state gains `coverImageProcessedAt?: number`; reducer accepts an `IMAGE_STATUS_UPDATE` action with payload `{ key, processedAt }[]` that merges by matching `key` against `form.coverImageKey` and each `step.image?.key` — entries with no match are ignored.
- [ ] The reducer does not mark the form dirty on `IMAGE_STATUS_UPDATE`; autosave's existing dirty-gate at `useAutosave.ts:105` ensures no spurious PATCH fires.
- [ ] `recipeToFormState` hydrates `processedAt` from both `coverImage` and each `step.image`.
- [ ] The editor wires `useImageProcessingPoll` against the loaded recipe and dispatches `IMAGE_STATUS_UPDATE` from the `onReady` callback.
- [ ] On a readiness flip (one or more images transition from unready to ready), the editor calls the existing `announce('Image ready')` helper once per transition; individual `<ProcessingPlaceholder>` components do not carry `aria-live`.
- [ ] `computeMissingFields` adds "Cover image still processing" when a cover key is present but `processedAt` is absent; same per step image with a key.
- [ ] The Publish button is disabled while any image is still processing; the missing-fields `<ul>` linked by `aria-describedby` lists the reasons.
- [ ] When polling reaches the 60s timeout, a banner with `role="status"` / `aria-live="polite"` appears: "Processing is taking longer than expected — try refreshing the page."

`RecipePreview` (`src/pages/admin/RecipePreview/RecipePreview.tsx`):
- [ ] Fetches via `fetchRecipeByIdAdmin(token, id)` on mount (instead of the full `fetchMyRecipes` list + find).
- [ ] Uses `useImageProcessingPoll` on the loaded recipe with an `onReady` callback that merges readiness into local state by `key`, so the preview auto-updates when processing completes.

`<ProcessingPlaceholder>` component (new, `src/components/ProcessingPlaceholder/`):
- [ ] Renders a skeleton with 2px hard border, `var(--radius-none)`, pulsing overlay honouring `prefers-reduced-motion: reduce`, and a visible caption ("Processing image…" by default, overrideable via prop).
- [ ] Does **not** carry `aria-live` — the editor routes the ready-state announcement through a single page-level region.
- [ ] Accepts `aspectRatio` prop so callers can match the surrounding layout.

Tests (Vitest + Testing Library):
- [ ] `useImageProcessingPoll` state-machine tests (no fake timers) assert start/stop conditions, unmount cleanup, and 401 delegation.
- [ ] `useImageProcessingPoll` timing tests use `vi.useFakeTimers()` / `vi.useRealTimers()` and assert 1500ms cadence and 60s timeout.
- [ ] `ImageUpload` tests cover all three branches.
- [ ] `RecipeDetailView`, `RecipeSteps`, `RecipeCard`, and `ProcessingPlaceholder` have component tests for the processing branch.
- [ ] `RecipeEditor` tests cover: Publish disabled while unready; missing-fields list contains the processing reasons; timeout banner appears after 60s of unresolved polling; `IMAGE_STATUS_UPDATE` merges without marking dirty.

Cross-cutting:
- [ ] All existing tests pass (`pnpm test` green).
- [ ] Lint passes with zero errors (`pnpm exec eslint --fix` applied to changed TSX files).
- [ ] No TypeScript errors.
