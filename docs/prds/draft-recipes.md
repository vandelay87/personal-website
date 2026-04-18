# PRD: Draft Recipes — Frontend

> **Sibling PRD:** [`akli-infrastructure/docs/prds/draft-recipes.md`](../../../akli-infrastructure/docs/prds/draft-recipes.md) — covers the CDK, Lambda handlers, DynamoDB schema, TTL, and S3 image-swap cleanup that back the endpoints consumed here.

## Overview
The admin recipe editor becomes a drafts-first experience: opening the new-recipe page immediately creates a draft via the backend, autosaves changes every few seconds, and gates the go-live moment behind an explicit **Publish** button. Published recipes gain an **Unpublish** action to flip back to draft. The admin list shows both statuses with a reusable `StatusBadge`. This PRD is the frontend counterpart to the infrastructure PRD that defines the API shapes and server-side rules.

## Problem Statement
Admins can't upload a cover image on a new recipe — the image component passes `recipeId: id ?? ''` (`src/components/ImageUpload/ImageUpload.tsx`) and the server rejects the empty string. Admins also lose work when the tab closes mid-edit: there is no autosave, only a manual Save button guarded by `useBlocker`. And the admin recipe list shows a single pool with no way to distinguish in-progress from live content. Fixing the image bug in isolation leaves those broader UX gaps untouched; the drafts-first approach resolves all three.

## Goals
- Opening `/admin/recipes/new` produces a working editor with a real `recipeId`, so image uploads succeed without a prior manual save.
- In-progress edits persist automatically within a few seconds, surviving tab-close and refresh.
- The admin recipe list shows drafts and published together, distinguishable at a glance.
- Publish is explicit, gated by validation, and returns to edit mode in place (no navigation).
- Unpublish is available on published recipes and flushes any pending autosave before flipping status.
- Discarding a draft deletes its backing record and images atomically (via the existing delete endpoint).

## Non-Goals
- Draft diff / change history between autosaves.
- Scheduled publishing.
- Public preview URLs for drafts (preview stays at `/admin/recipes/:id/preview`).
- Multi-tab conflict detection (last-write-wins).
- Public-side changes beyond the implicit contract that `/recipes` now returns only published items. The public `Recipes` page itself is unchanged.

## User Stories
- As an admin, I want to upload a cover image as soon as I open the new-recipe editor, so I don't have to save a half-written recipe before attaching the hero image.
- As an admin, I want my in-progress recipe saved automatically as I type, so I never lose work to a closed tab.
- As an admin, I want to see my drafts and published recipes side-by-side, so I can resume in-progress work.
- As an admin, I want an explicit "Publish" button, so drafts don't go live before I'm ready.
- As an admin, I want to unpublish a published recipe back to draft, so I can temporarily take it down while reworking.
- As an admin, I want to discard a draft with confirmation, so I can abandon a false start without leaving debris.

## Design & UX

**Editor — new recipe**
On mount at `/admin/recipes/new`, the editor calls `createDraft()`, seeds the reducer from the response, and replaces the URL with `/admin/recipes/:id/edit` via `navigate(..., { replace: true })`. The existing load-by-id effect must detect the just-created state (e.g. via a `recentlyCreatedId` ref) and skip the immediate refetch that would otherwise race the `createDraft` response. A new `<AutosaveStatus>` component near the editor header shows the state: `Saving…` → `Saved · just now` → `Saved · 2m ago` (relative time updated once per minute). On failure: `Failed to save · Retry`. The region has `role="status"` and `aria-live="polite"` for state transitions; relative-time ticks are not announced. Failures use `aria-live="assertive"`. Image upload works immediately because the recipe exists. Primary button reads **Publish** (disabled until the client mirror of the server validation rules passes: title, intro, coverImage.key + coverImage.alt, ≥1 ingredient, ≥1 step with non-empty text). Disabled state uses reduced opacity + `cursor: not-allowed`; screen-reader users get the reason via `aria-describedby` pointing at a visible missing-fields list. Secondary action: **Discard draft** → destructive `ConfirmDialog` → `deleteRecipe(id)` → `navigate('/admin/recipes')`.

**Editor — existing draft or published recipe**
URL is `/admin/recipes/:id/edit`; editor fetches and derives its mode from `status`. Published mode: primary button reads **Update** (saves live, no publish gate); secondary **Unpublish** flips status back to draft. Unpublish first flushes any pending autosave, then calls `unpublishRecipe(id)`, then flips the reducer's mode so the editor re-renders as a draft in place (primary button becomes **Publish**, validation applies).

**Admin recipe list (`/admin/recipes`)**
Fetches via a new `fetchAllRecipes()` client helper that returns both statuses. Renders the existing inline badge pattern extracted into `src/components/StatusBadge/StatusBadge.tsx` — CSS migrated verbatim from `RecipeList.module.css`, no visual diff. Sorted by `updatedAt` desc, client-side. Search filters across both statuses unchanged.

**Autosave cadence**
Debounced 5s after the last *dirty* change. The reducer's existing `form.dirty` flag gates the fire — no autosave on hydration from `LOAD_RECIPE` or on an empty diff. On `visibilitychange` → `hidden` and on unmount, pending autosaves flush immediately. In-flight saves are aborted via `AbortController` when a newer save fires; the latest snapshot wins. On a 401, the existing shared `handleSessionError(err, logout, navigate)` pattern (already used at `RecipeList.tsx` and the editor's manual save path) redirects with a `redirect=` param — autosave must not silently swallow 401s. `MARK_PRISTINE` is dispatched on autosave success so `useBlocker(form.dirty)` and the existing `beforeunload` handler correctly gate navigation only when there are unflushed changes.

**States**
- Empty draft list — existing admin-empty-state component, text "No recipes yet — create your first".
- Autosave error — inline indicator with Retry; toast on the first failure only.
- Unpublish confirmation — `ConfirmDialog`.
- Discard draft confirmation — `ConfirmDialog`, destructive variant.

## Technical Considerations

**Shared API contract (repeated here so this PRD is self-contained)**

The frontend consumes these endpoints, all returning JSON. Full server-side rules in the infra PRD.

- `POST /recipes/drafts` → `{ id: string, slug: string }`. Used on new-recipe mount.
- `GET /recipes/admin` → `{ recipes: Recipe[] }` with both statuses. Used by the admin list.
- `PATCH /recipes/{id}` → `{ recipe: Recipe }`. Used by autosave and manual published-mode Update.
- `PATCH /recipes/{id}/publish` → `{ recipe: Recipe }` on success; 400 with `{ errors: Record<string, string> }` on validation failure.
- `PATCH /recipes/{id}/unpublish` → `{ recipe: Recipe }`.
- `DELETE /recipes/{id}` → 204.
- The old `POST /recipes` direct-create is gone — all call sites referencing `createRecipe()` must be removed.

The `Recipe` shape gains a `status: 'draft' | 'published'` field and an optional `ttl?: number` (ignored client-side). Types in `src/types/recipe.ts` updated accordingly.

**`src/api/recipes.ts`**
- Add `createDraft(token)` → `POST /recipes/drafts`.
- Add `fetchAllRecipes(token)` → `GET /recipes/admin`. Deliberately separate from the existing `fetchMyRecipes` (which targets `/me/recipes`) to avoid breaking that contract; the admin list page switches to `fetchAllRecipes`.
- Keep existing `updateRecipe`, `publishRecipe`, `unpublishRecipe`, `deleteRecipe`, `fetchRecipe`, `fetchMyRecipes`. These already exist and already use the correct `PATCH` routes — no churn.
- Remove `createRecipe` and every call site.

**`src/pages/admin/RecipeEditor/RecipeEditor.tsx`**
- Mount:
  - `/admin/recipes/new` → `createDraft()`, `LOAD_RECIPE` dispatch with the response, `navigate(..., { replace: true })`, set a `recentlyCreatedId` ref so the load-by-id effect skips the immediate refetch.
  - `/admin/recipes/:id/edit` → existing fetch effect; mode derived from `status`.
- New hook `useAutosave(reducerState, saveFn, { intervalMs: 5000 })`:
  - Latest-state ref to prevent stale closures.
  - `AbortController` — new fire aborts previous in-flight.
  - `document.addEventListener('visibilitychange', ...)` → flush on hidden.
  - Cleanup on unmount: flush, then clear timers.
  - Skip when `dirty === false` or the diff against last saved snapshot is empty.
  - State machine: `idle → saving → saved | error`. Returns `{ status, lastSavedAt, retry }`.
  - 401 handling delegates to `handleSessionError(err, logout, navigate)` — no silent failures.
- Reducer extension: new actions `AUTOSAVE_START`, `AUTOSAVE_SUCCESS`, `AUTOSAVE_ERROR`, `MARK_PRISTINE`, `SET_MODE`. No parallel `useState` — autosave state lives in the reducer.
- `handleSubmit` becomes mode-aware:
  - Draft → validate client-side (mirror server rules), `publishRecipe(id)`, dispatch `SET_MODE('published')` on success. No navigation.
  - Published → `updateRecipe(id, data)`, no mode change.
- Unpublish: visible only when `mode === 'published'`. Flush pending autosave first, then `unpublishRecipe(id)`, then `SET_MODE('draft')`.
- Discard: `ConfirmDialog` → `deleteRecipe(id)` → `navigate('/admin/recipes')`.

**`<AutosaveStatus>` component (new)**
- Props: `{ status, lastSavedAt, onRetry }`.
- Renders `Saving…` / `Saved · <relative-time>` / `Failed to save · Retry` with icon + text (never colour-only — WCAG 1.4.1).
- `role="status"` + `aria-live="polite"`; only transitions announced, not relative-time ticks.
- `aria-live="assertive"` on the failure variant.
- `prefers-reduced-motion: reduce` replaces any "Saving…" animation with a static dot.
- Stacks under the title on <640px to avoid collision with action buttons.

**`<StatusBadge>` component (new, extracted)**
- Props: `{ status: 'draft' | 'published' }`.
- Markup and CSS migrated verbatim from the existing inline badge in `RecipeList.module.css` (the existing selector differs only by `border-color` and text colour between statuses). No visual diff.
- Includes a visually-hidden `sr-only` prefix ("Status: ") so screen readers scanning a row get context beyond the badge text.

**`src/components/ImageUpload/ImageUpload.tsx`**
- Tighten prop type: `recipeId: string` (not `string | undefined`).
- Remove the `id ?? ''` fallback.
- All upstream callers (`RecipeEditor.tsx`, `StepList.tsx`) pass a defined id — the editor now either just created a draft or loaded one, so `id` is non-null by the time `ImageUpload` renders. The existing loading gate enforces this at runtime; the type tightening enforces it at build time.

**`src/pages/admin/RecipeList/RecipeList.tsx`**
- Swap `fetchMyRecipes` → `fetchAllRecipes`.
- Replace the inline badge `<span>` with `<StatusBadge status={recipe.status} />`.
- Sort client-side by `updatedAt` desc.

**`src/pages/Recipes/Recipes.tsx` (public page)**
- Unchanged. The backend filter on `GET /recipes` enforces `published`-only.

**CSS — neo-brutalist compliance**
- New components use `var(--radius-none)`, 2px hard border, `2px 2px 0` shadow tokens — no rounded corners, no blur.
- `<AutosaveStatus>` uses `--color-success` and `--color-error` tokens, which flip automatically in dark mode via the `data-theme="dark"` cascade.
- Publish button disabled state: reduced opacity as a literal with a comment (no `--opacity-disabled` token yet) plus `cursor: not-allowed`. Focus ring uses project-standard `:focus-visible` with `--color-primary` outline.
- `<StatusBadge>` reuses existing selectors verbatim; no new visuals.

**Testing approach (Vitest + Testing Library)**
- Autosave hook — split into two suites:
  - **State-machine** tests (no fake timers): assert `idle → saving → saved | error`, retry behaviour, abort-on-next-fire. TDD-first.
  - **Debounce-timing** integration tests: `vi.useFakeTimers()` in `beforeEach`, `vi.useRealTimers()` in `afterEach`, `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`. Covers 5s debounce, visibilitychange flush, unmount flush, stale-closure guard.
- Editor mode-switching: draft → publish transitions the UI into published mode in place; published → unpublish flushes autosave then flips to draft; 401 during autosave redirects via `handleSessionError`.
- Discard flow: `ConfirmDialog` appears, confirm calls `deleteRecipe`, cancel does nothing.
- `ImageUpload` prop tightening: TS compile check in CI enforces it (`@ts-expect-error` test on a deliberate undefined pass).
- `<StatusBadge>`: renders text label + visually-hidden prefix; `data-status` reflects prop.
- Relative-time tests stub `Date.now()` via `vi.setSystemTime`.

## Acceptance Criteria

API client (`src/api/recipes.ts`):
- [ ] `createDraft(token)` hits `POST /recipes/drafts` and returns `{ id, slug }`.
- [ ] `fetchAllRecipes(token)` hits `GET /recipes/admin` and returns both statuses.
- [ ] `createRecipe` is removed; every call site is updated (`RecipeEditor.tsx` + any tests referencing it).

Editor (`src/pages/admin/RecipeEditor/RecipeEditor.tsx`):
- [ ] Mounting at `/admin/recipes/new` calls `createDraft()` and replaces the URL with `/admin/recipes/:id/edit` without triggering a refetch against the just-created draft.
- [ ] On a new draft, the cover image uploads successfully without a prior manual save.
- [ ] Autosave debounces 5s after the last dirty change and skips saves when pristine or the diff is empty.
- [ ] An in-flight autosave is aborted via `AbortController` when a newer save fires.
- [ ] On `visibilitychange` → hidden and on unmount, pending autosaves flush immediately.
- [ ] A 401 during autosave invokes `handleSessionError(err, logout, navigate)`.
- [ ] `useBlocker(form.dirty)` and `beforeunload` gate navigation only when there are unflushed changes; `MARK_PRISTINE` is dispatched on autosave success.
- [ ] `<AutosaveStatus>` has `role="status"` and `aria-live="polite"`, announces only transitions (not relative-time ticks), and uses `aria-live="assertive"` on failure.
- [ ] Publish button is disabled until the client mirror of server validation passes; disabled state announces missing fields via `aria-describedby`.
- [ ] Publishing a draft dispatches `SET_MODE('published')` so the editor flips to published mode in place (no navigation).
- [ ] Unpublishing a published recipe flushes any pending autosave first, then transitions the editor into draft mode in place.
- [ ] **Discard draft** shows a destructive `ConfirmDialog`, calls `deleteRecipe(id)` on confirm, and navigates to `/admin/recipes`.

Admin list (`src/pages/admin/RecipeList/RecipeList.tsx`):
- [ ] Fetches via `fetchAllRecipes`.
- [ ] Renders `<StatusBadge>` per row.
- [ ] Sort by `updatedAt` desc, client-side.

Components:
- [ ] `<StatusBadge>` lives at `src/components/StatusBadge/` with CSS migrated verbatim from the existing inline badge in `RecipeList.module.css`, including a visually-hidden "Status: " prefix for screen readers.
- [ ] `<AutosaveStatus>` renders icon + text for every state, never colour-only, uses `--color-success` / `--color-error` tokens, and honours `prefers-reduced-motion: reduce`.
- [ ] `ImageUpload`'s `recipeId` prop is typed `string` (not `string | undefined`); the `id ?? ''` fallback is removed.

Tests (Vitest):
- [ ] `useAutosave` state-machine tests assert transitions (`idle → saving → saved | error`), retry, and abort-on-update without fake timers.
- [ ] `useAutosave` debounce-timing tests use `vi.useFakeTimers()` in `beforeEach` / `vi.useRealTimers()` in `afterEach` and `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`.
- [ ] Relative-time assertions use `vi.setSystemTime` to stub `Date.now()`.
- [ ] `<StatusBadge>` and `<AutosaveStatus>` have Testing Library component tests.
- [ ] Editor tests cover: draft-to-published transition in place, unpublish flushing autosave, 401 during autosave invoking `handleSessionError`, Discard → ConfirmDialog → delete.

Cross-cutting:
- [ ] All existing tests pass (`pnpm test` green).
- [ ] Lint passes with zero errors.

## Open Questions
- None.
