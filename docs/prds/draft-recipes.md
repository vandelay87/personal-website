# PRD: Draft Recipes

## Overview
Recipes become a first-class two-state resource — `draft` and `published`. New recipes autosave as drafts from the moment the editor opens, giving admins resume-later UX and an explicit publish gate while fixing the chicken-and-egg image-upload bug as a side effect. Also cleans up orphaned image variants left behind when an image is swapped on an existing recipe. Modelled on how Ghost, Notion, and Linear treat in-progress content.

## Problem Statement
Today, creating a new recipe requires filling out the form and clicking Save before any image can be uploaded — the presigned-URL endpoint rejects requests without a `recipeId`, so the cover and step images fail with `"recipeId and imageType are required"`. There's also no protection against lost work: if the browser closes mid-edit, everything typed is gone. And on existing recipes, swapping an image leaves orphaned `*-thumb.webp`, `*-medium.webp`, `*-full.webp` variants in S3 that are never cleaned up.

## Goals
- Admin can upload a cover image while creating a new recipe without saving first.
- Admin can close the tab mid-edit and resume from the last autosave point.
- Drafts are listable and distinguishable in the admin UI.
- Published recipes can be unpublished back to draft.
- Swapping a cover or step image on any recipe deletes the old processed variants from S3.
- Abandoned drafts are automatically cleaned up after ~30 days (DynamoDB TTL, best-effort within a 48h window per AWS docs).

## Non-Goals
- WordPress-style revisions for published recipes (post-publish edits save directly to the live recipe).
- Conflict detection between multiple tabs editing the same draft (last-write-wins).
- Soft-delete / trash bin for recipes (delete remains immediate).
- Multi-author drafts or draft ownership (`authorId` model). The existing `authorId-createdAt-index` GSI stays in place but remains unused by this feature; removal is a separate follow-up.
- Fixing the pre-existing unsigned-JWT check in `isAdmin` helper. The API Gateway Cognito authoriser is the real gate; the helper's signature check gap is tracked separately. Every new route in this PRD must be attached to the existing authoriser (hard AC).
- Public preview URLs for unpublished drafts (preview stays at `/admin/recipes/:id/preview`).
- Scheduled publishing (no `publishAt` field).
- Draft diff / change history between autosaves.

## User Stories
- As an admin, I want to upload a cover image as soon as I open the new-recipe editor, so I don't have to save a half-written recipe before attaching the hero image.
- As an admin, I want my in-progress recipe saved automatically as I type, so I never lose work to a closed tab.
- As an admin, I want to see my drafts and published recipes side-by-side, so I can resume in-progress work.
- As an admin, I want an explicit "Publish" button, so drafts don't go live before I'm ready.
- As an admin, I want to unpublish a published recipe back to draft, so I can temporarily take it down while reworking.
- As an admin, I want old image variants deleted when I swap a cover, so the S3 bucket stays clean.

## Design & UX

**Editor — new recipe**
On mount in new mode, the editor calls `POST /recipes/drafts`, receives `{ id, slug }`, seeds the reducer from the response, and replaces the URL with `/admin/recipes/:id/edit` (via `navigate(..., { replace: true })`). The existing load-by-id effect must detect that the draft was just created in this session and skip the immediate refetch (otherwise it races the `createDraft` response). A status indicator near the editor header shows autosave state: `Saving…` → `Saved · just now` → `Saved · 2m ago` (relative time updating every minute). On failure: `Failed to save · Retry`. The indicator has `role="status"` and `aria-live="polite"` for state transitions; relative-time ticks are not announced. Failures render `aria-live="assertive"` so screen-reader users hear them. Image-upload components work immediately because the recipe exists. Primary button reads **Publish** (disabled until server-side validation rules pass: title, intro, coverImage.key + coverImage.alt, ≥1 ingredient, ≥1 step with non-empty text). Disabled state visually uses reduced opacity plus `cursor: not-allowed`; screen-reader users get the reason via `aria-describedby` pointing at a visible missing-fields list. Secondary action: **Discard draft** — deletes the draft and its images after a `ConfirmDialog` (destructive variant, focus trap, Esc-to-cancel, focus restoration).

**Editor — existing draft or published recipe**
URL is `/admin/recipes/:id/edit`; editor fetches the recipe and derives its mode from `status`. Published mode: primary button reads **Update** (saves live, no publish gate); secondary action **Unpublish** flips status back to draft and the recipe disappears from public `/recipes`. Unpublishing mid-edit flushes any pending autosave first, then transitions the editor into draft mode in place (primary button becomes **Publish** again, validation kicks in on any missing fields).

**Admin recipe list (`/admin/recipes`)**
Single list showing both drafts and published, fetched via the existing `fetchMyRecipes` client helper pointed at an endpoint that returns both statuses. Each row renders the existing inline badge pattern, extracted into a new `StatusBadge` component (see CSS section). Sort by `updatedAt` desc, client-side (the list is small). Search filters across both statuses. The admin list also filters out rows where `ttl <= now` so recently-expired-but-not-yet-deleted drafts do not appear (DynamoDB TTL deletion is best-effort within 48h of expiry).

**Public `/recipes` page**
Only shows `status = 'published'`. Drafts are never in the public API response. Delivered by server-side filter, not client trust.

**Autosave cadence**
Debounced 5s after the last *dirty* change (form field edit, image upload, tag add/remove, step reorder, step image upload). The reducer already tracks `form.dirty`; autosave must only fire when `dirty === true` and skip the initial hydration from `LOAD_RECIPE` / `createDraft`. On `visibilitychange` → `hidden` and on unmount, pending autosaves flush immediately. In-flight saves are aborted via `AbortController` when a newer save fires; the latest snapshot wins. On a 401 during autosave, the shared `handleSessionError(err, logout, navigate)` pattern redirects to login with a `redirect=` param — the same handling already used elsewhere in the editor. Network failures (non-auth) surface in the status indicator and do not block further edits; the next successful autosave persists the accumulated changes. `MARK_PRISTINE` is dispatched on each autosave success so `useBlocker(form.dirty)` and the `beforeunload` handler correctly gate navigation only when there are unflushed changes.

**States**
- Empty draft list — existing admin-empty-state component shows "No recipes yet — create your first".
- Autosave error — inline indicator with Retry button (first failure only triggers a toast so it's not over-noisy for transient blips).
- Unpublish confirmation — `ConfirmDialog`.
- Discard draft confirmation — `ConfirmDialog`, destructive variant.

## Technical Considerations

**Data model (DynamoDB `recipes` table — note: the actual table name is `recipes`, not `akli-recipes`)**
- New attribute `status: 'draft' | 'published'` (required on all items going forward; existing items backfilled to `'published'`).
- New attribute `ttl: number` (unix seconds) — set on drafts to `updatedAt + 30 days`, cleared on publish via UpdateExpression `REMOVE ttl` (not `SET ttl = null` — DynamoDB TTL ignores null values).
- Existing `updatedAt` is bumped on every write; autosave PATCHes that change nothing still bump it (the autosave hook skips empty diffs before hitting the network, so this is not a no-op concern in practice).
- The existing `status-createdAt-index` GSI (defined in `lib/recipe-stack.ts`) is used by the public `GET /recipes` endpoint and by the admin list (two queries per call — one per status — then merge client-side). Table-level scans are avoided.
- The existing `authorId-createdAt-index` GSI is unused by this feature and not removed in this PRD (out of scope).

**Backfill / migration**
- One-off script `akli-infrastructure/scripts/backfill-recipe-status.ts`. Hard requirements on the script:
  - **Account guard** — errors out if `AWS_ACCOUNT_ID` env var is unset or doesn't match the current caller identity (`sts:GetCallerIdentity`).
  - **Dry-run mode** — `--dry-run` flag logs the items that would change without writing.
  - **Idempotency** — each update uses `ConditionExpression: attribute_not_exists(#s)`, so re-running the script is a safe no-op on already-migrated items.
  - **Run log** — prints affected ids and final count to stdout; failures do not halt the whole run (collect into an error summary).
- Run sequence: deploy infra (TTL enabled) → run backfill → start using new endpoints.

**DynamoDB TTL config (CDK)**
- Enable TTL on the `recipes` table by adding `timeToLiveAttribute: 'ttl'` to the existing L2 `dynamodb.Table` construct in `lib/recipe-stack.ts`. No other schema change.
- CDK assertion test: template contains `Match.objectLike({ TimeToLiveSpecification: { AttributeName: 'ttl', Enabled: true } })` on `AWS::DynamoDB::Table`. Also assert `ttl` is NOT declared in `AttributeDefinitions` (TTL attributes are metadata, not key schema).
- TTL semantics must be documented in code comments where relevant: DynamoDB deletes expired items on a best-effort basis, typically within 48h. Downstream code (admin list filter, public list filter) must not assume an expired item is gone at T+30d exactly.

**Recipe handler (`akli-infrastructure/lambda/recipe-handler.ts`)**

Route design — reconciling the existing routes:
- Existing `PATCH /recipes/{id}/publish` and `PATCH /recipes/{id}/unpublish` are **kept** (already wired in CDK and handler). They move to admin-only authorisation (drop the `isOwnerOrAdmin` check on these two routes — publish/unpublish is an admin action, not an author action).
- Existing `PATCH /recipes/{id}` is **extended** to handle both draft and published recipes (single endpoint, no `/drafts/:id` fork) and picks up image-swap cleanup logic.
- New endpoints added:
  - `POST /recipes/drafts` — admin JWT. Creates a minimal draft. Returns `{ id, slug }`. Writes `status: 'draft'`, `ttl: now + 30d`. Slug generation: if no title provided, fall back to `draft-<uuid>` to avoid empty-slug collisions across concurrent empty drafts.
  - `GET /recipes/admin` — admin JWT. Returns both statuses by querying `status-createdAt-index` twice (once per status) and merging. Filters out `ttl <= now` on the client of this query (DDB doesn't auto-hide expired items).
- `GET /recipes` (public, unauthenticated) — uses `status-createdAt-index` with PK `status = 'published'`. Already implemented this way per existing handler; PRD only requires a review to confirm no leakage path (e.g., direct `GetItem` on a draft id must return 404 to unauthenticated callers — add a status check on the single-item public GET).
- Old `POST /recipes` direct-create path is removed. All creation goes through `POST /recipes/drafts` → edit → `PATCH /recipes/{id}/publish`.
- `DELETE /recipes/:id` — unchanged (already cleans up `processed/recipes/<id>/`). Called by the Discard flow.

Image-swap cleanup (on `PATCH /recipes/{id}`):
- Use `ReturnValues: 'ALL_OLD'` on the `UpdateCommand` to get the atomic prior snapshot — **do not** pre-read with a separate `GetItem` (races against a concurrent autosave).
- Compute the set of old-vs-new image keys:
  - Cover: compare `old.coverImage?.key` vs `new.coverImage?.key` — if different, schedule the old key's three variants for deletion.
  - Steps: compare **by set** of `step.image?.key` values on the old item vs the new item (reorder-safe). Any key present in old but not new → schedule its variants for deletion.
- Delete the union of scheduled keys with `DeleteObjectsCommand`. Handle partial failures: `DeleteObjects` returns per-object errors in the response body (does not throw on partial). Log failed deletions, do not fail the PATCH, do not retry the DDB write. Surfacing the failure via CloudWatch logs is acceptable.
- If the DDB update fails, no S3 delete is attempted (the `ALL_OLD` snapshot is only available after success).

Idempotency on state transitions:
- `PATCH /recipes/{id}/publish` on an already-published recipe → 200 no-op (re-apply validation to guard against publishing a recipe that somehow lost required fields; fail with 400 if validation now fails).
- `PATCH /recipes/{id}/unpublish` on an already-draft recipe → 200 no-op.

Auth:
- Every new and modified admin route must be attached to the existing Cognito JWT authoriser in CDK (`lib/recipe-stack.ts`). This is verified by a CDK assertion test: each route in the admin set has `AuthorizationType: JWT`.
- Route-level admin check: the handler's `isAdmin` helper runs on top of the authoriser. Publish/unpublish drop the `isOwnerOrAdmin` branch — admin-only.

IAM:
- `s3:DeleteObject` on the image bucket is already granted to the recipe-handler role (used by `handleDeleteRecipe`). The CDK assertion test includes a grep-equivalent: role policy contains `s3:DeleteObject` action for the image bucket ARN. No new IAM statements needed.

**Image handler (`akli-infrastructure/lambda/recipe-image-handler.ts`)**
No change. The existing presigned-PUT works once the client always sends a real `recipeId`.

**Frontend — `src/api/recipes.ts`**
- Add: `createDraft()` → `POST /recipes/drafts`.
- Add: `fetchAllRecipes()` (admin, returns both statuses) → `GET /recipes/admin`. Deliberately named separately from the existing `fetchMyRecipes` to avoid breaking that contract; the admin list page switches to `fetchAllRecipes`.
- Keep existing: `updateRecipe`, `publishRecipe`, `unpublishRecipe`, `deleteRecipe`, `fetchRecipe`, `fetchMyRecipes`. These already exist and already use the correct PATCH routes — no churn.
- Remove: `createRecipe` (the old direct-create path). All call sites updated in the same commit.

**Frontend — RecipeEditor (`src/pages/admin/RecipeEditor/RecipeEditor.tsx`)**
- Mount logic:
  - Route `/admin/recipes/new` → call `createDraft()`, dispatch `LOAD_RECIPE` with the returned minimal draft, `navigate('/admin/recipes/' + id + '/edit', { replace: true })`. The existing load-by-id effect must detect the just-created state (e.g., guard by a `recentlyCreatedId` ref) and skip the immediate refetch to avoid racing.
  - Route `/admin/recipes/:id/edit` → existing fetch effect runs; mode derived from `status`.
- Autosave: new `useAutosave(reducerState, saveFn, { intervalMs: 5000 })` hook, implemented with:
  - A ref holding the latest state (prevents stale closures in the debounce callback).
  - `AbortController` — any new fire aborts the previous in-flight request.
  - `document.addEventListener('visibilitychange', ...)` — on hidden, flush immediately.
  - Cleanup on unmount: flush, then clear timers.
  - Guard: skip when `dirty === false` or the diff against the last saved snapshot is empty.
  - State machine: `idle → saving → saved | error`. Returns `{ status, lastSavedAt, retry }`. `retry` calls the last-attempted save.
  - The reducer is extended with `AUTOSAVE_START`, `AUTOSAVE_SUCCESS`, `AUTOSAVE_ERROR`, `MARK_PRISTINE` actions. Parallel `useState` is not introduced.
  - 401 handling: calls the existing `handleSessionError(err, logout, navigate)` — same pattern as `RecipeList.tsx` and the existing editor save path.
- `handleSubmit` becomes two status-aware handlers:
  - Draft → validate client-side (mirror the server rules), then `publishRecipe(id)`. On success, flip mode to `published` in place (the recipe now has `status: 'published'`; no redirect needed).
  - Published → `updateRecipe(id, data)`; no status flip.
- Unpublish: visible only when `status === 'published'`. Flushes any pending autosave first, then calls `unpublishRecipe(id)`, then flips mode to `draft` in the reducer.
- Discard draft: `ConfirmDialog` → `deleteRecipe(id)` → `navigate('/admin/recipes')`.
- Autosave status indicator: new component `<AutosaveStatus status={status} lastSavedAt={lastSavedAt} onRetry={retry} />` positioned in the editor header. `Date.now()` is stubbed in tests that assert relative-time labels.

**Frontend — RecipeList (`src/pages/admin/RecipeList/RecipeList.tsx`)**
- Swap `fetchMyRecipes` → `fetchAllRecipes` (returns both statuses).
- Extract the existing inline badge pattern (current `<span className={styles.badge} data-status={...}>`) into `src/components/StatusBadge/StatusBadge.tsx`. Migrate the CSS verbatim from `RecipeList.module.css` into the new module. One call site changes at first; existing styling is preserved exactly (no visual diff).
- Sort by `updatedAt` desc, client-side.

**Frontend — ImageUpload (`src/components/ImageUpload/ImageUpload.tsx`)**
- Tighten prop type: `recipeId: string` (not `string | undefined`). Remove the `id ?? ''` fallback.
- All upstream callers (`RecipeEditor.tsx`, `StepList.tsx`) now pass a defined `id` — in both cases the editor has either just created a draft or loaded one by id, so `id` is non-null by the time `ImageUpload` renders. The existing loading gate in the editor ensures this; a non-null assertion is not required but the TS types enforce the contract.

**Frontend — public `Recipes` page**
- Unchanged. The backend filter enforces `published`-only.

**CSS (reuse-first, neo-brutalist compliance)**
- `StatusBadge`: extracted from the existing `RecipeList.module.css` badge selector. No new visuals introduced; "Draft = muted outline, Published = filled" language from earlier drafts of this PRD is superseded — the badge uses the existing styles which differ only in `border-color` and text colour. Both variants already comply with `var(--radius-none)` and the 2px border.
- `AutosaveStatus`: inline in the editor header (stacks under the title on <640px to avoid collision with action buttons). Uses semantic tokens `--color-success` / `--color-error` which flip automatically in dark mode. States are differentiated by both colour *and* an icon + text label (never colour-only — WCAG 1.4.1). Any "Saving…" animation respects `prefers-reduced-motion: reduce` and falls back to a static dot.
- Publish/Update button disabled state: reduced opacity (literal value with a comment — no `--opacity-disabled` token yet) plus `cursor: not-allowed`. Focus ring uses the project-standard `:focus-visible` with `--color-primary` outline.
- Accessibility: `StatusBadge` renders a visually-hidden prefix (`sr-only` "Status: ") so screen readers scanning a row get context beyond the badge text.

**Testing approach (TDD where it pays, integration where it doesn't)**

Backend (Jest + `aws-sdk-client-mock` — already in the stack):
- Unit tests for each new/modified handler path written first. Cover the happy path, auth-failure (401/403 for missing/non-admin JWT) on every admin route, and image-swap cases (cover swap, step swap, step reorder, multi-image swap in one PATCH).
- Assert S3 vs DDB call ordering using `ddbMock.calls()` and `s3Mock.calls()` comparison — not just "both happened".
- Idempotency test: re-publish of a published recipe is a 200 no-op; re-unpublish of a draft is a 200 no-op.
- Test that `DeleteObjectsCommand` partial failures are logged, do not throw, and do not roll back the DDB write.
- Test that autosave-target `PATCH /recipes/{id}` called on a recipe with `status === 'draft'` refreshes `ttl`; same call on `'published'` does NOT set `ttl`.
- Test that `POST /recipes/drafts` with no title falls back to `draft-<uuid>` slug.
- Test that `handleDeleteRecipe` still works unchanged.

Frontend (Vitest + Testing Library):
- Autosave hook — split into two test suites:
  - **State-machine** tests (no fake timers; assert transitions `idle → saving → saved | error`, retry behaviour, abort-on-subsequent-change). Written first, TDD.
  - **Debounce-timing** integration tests (fake timers; `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`; `vi.useFakeTimers()` in `beforeEach` / `vi.useRealTimers()` in `afterEach`). Covers 5s-debounce correctness, visibilitychange flush, unmount flush, stale-closure guard.
- Editor mode-switching tests: draft → publish transitions UI into published mode in place; published → unpublish transitions into draft mode; unpublish flushes pending autosave first; 401 during autosave redirects via `handleSessionError`.
- Discard draft: `ConfirmDialog` appears, confirm calls `deleteRecipe(id)`, cancel does nothing.
- `ImageUpload` type tightening: TS compile failure is asserted via a `@ts-expect-error` test or covered by the existing TS check in CI.
- `StatusBadge` component test: renders text label + visually-hidden prefix; `data-status` attribute reflects prop.
- Relative-time tests stub `Date.now()` / use `vi.setSystemTime` for determinism.

CDK (Jest + `aws-cdk-lib/assertions`):
- Assert `recipes` table has `TimeToLiveSpecification: { AttributeName: 'ttl', Enabled: true }`.
- Assert `ttl` is NOT in `AttributeDefinitions` of the `recipes` table.
- Assert every new / modified admin route (`POST /recipes/drafts`, `GET /recipes/admin`, `PATCH /recipes/{id}`, `PATCH /recipes/{id}/publish`, `PATCH /recipes/{id}/unpublish`, `DELETE /recipes/{id}`) has `AuthorizationType: JWT` on its `AWS::ApiGatewayV2::Route` resource.
- Assert the recipe-handler role policy contains `s3:DeleteObject` on the image bucket ARN (regression guard; this was already present for `handleDeleteRecipe`).

Backfill script:
- Dry-run test against a local DynamoDB (or moto) table with a mix of pre-migrated and unmigrated items; assert no-op on the pre-migrated, `status: 'published'` set on the unmigrated.
- Account-guard test: script exits non-zero when `AWS_ACCOUNT_ID` is unset or mismatched.

**Security / auth**
- All draft / publish / unpublish / admin-list endpoints are behind the existing Cognito JWT authoriser at API Gateway, confirmed by a CDK assertion test.
- Public `GET /recipes` stays unauthenticated; draft items are filtered server-side via the GSI query key.
- Single-item public `GET /recipes/{id}` must return 404 (not 200) if the item's `status !== 'published'`. Tested explicitly.

**Performance**
- Autosave at 5s debounce → ~12 writes/minute of active editing. DDB on-demand pricing absorbs this.
- Admin list issues two GSI queries (one per status) + client-side merge; both queries are cheap at current scale.
- Public list is a single GSI query on `status = 'published'` — no table scan.

## Acceptance Criteria

Infrastructure (CDK):
- [ ] DynamoDB TTL is enabled on the `recipes` table with `AttributeName: 'ttl'`, and `ttl` is not declared in `AttributeDefinitions` — both asserted by `aws-cdk-lib/assertions` template tests.
- [ ] Every admin route (`POST /recipes/drafts`, `GET /recipes/admin`, `PATCH /recipes/{id}`, `PATCH /recipes/{id}/publish`, `PATCH /recipes/{id}/unpublish`, `DELETE /recipes/{id}`) has `AuthorizationType: JWT` on its API Gateway route resource — asserted by template test.
- [ ] The recipe-handler role policy grants `s3:DeleteObject` on the image bucket ARN — asserted by template test.

Backfill:
- [ ] `akli-infrastructure/scripts/backfill-recipe-status.ts` exits non-zero when `AWS_ACCOUNT_ID` is unset or doesn't match caller identity.
- [ ] The script supports `--dry-run` and logs the items that would change without writing.
- [ ] The script uses `ConditionExpression: attribute_not_exists(#s)` per update so re-runs are safe no-ops on already-migrated items.

Handler — new endpoints:
- [ ] `POST /recipes/drafts` requires admin JWT, returns `{ id, slug }`, writes `status: 'draft'` and `ttl = now + 30d`. Slug falls back to `draft-<uuid>` when no title is provided.
- [ ] `GET /recipes/admin` requires admin JWT, returns both drafts and published by querying `status-createdAt-index` twice (once per status) and merging, and filters out items where `ttl <= now`.

Handler — modified endpoints:
- [ ] `PATCH /recipes/{id}` accepts partial updates for both draft and published items. On a draft, bumps `updatedAt` and refreshes `ttl`. On a published, bumps `updatedAt` and does NOT set `ttl`.
- [ ] `PATCH /recipes/{id}` uses `ReturnValues: 'ALL_OLD'` to compute image-key diffs atomically (no pre-read `GetItem`).
- [ ] Cover image key change deletes the old `-thumb.webp`, `-medium.webp`, `-full.webp` variants from S3 after the DDB write succeeds.
- [ ] Step image changes are diffed by the set of `step.image.key` values (reorder-safe); keys present only in the old set have their variants deleted.
- [ ] `DeleteObjectsCommand` partial failures are logged and do not cause the PATCH to fail or the DDB write to roll back.
- [ ] `PATCH /recipes/{id}/publish` runs server-side validation (title, intro, coverImage.key, coverImage.alt, ≥1 ingredient, ≥1 non-empty step) and returns 400 with field-level errors on failure; on success flips `status` to `'published'` and removes the `ttl` attribute via UpdateExpression `REMOVE`.
- [ ] `PATCH /recipes/{id}/unpublish` sets `status: 'draft'` and `ttl = now + 30d`.
- [ ] Publish on an already-published recipe and unpublish on an already-draft recipe return 200 no-op (validation still runs on publish and can return 400).
- [ ] Publish/unpublish use admin-only authorisation (the `isOwnerOrAdmin` branch is removed for these routes).
- [ ] `GET /recipes` (public) returns only `status = 'published'` via the GSI; there is no code path that can leak a draft.
- [ ] `GET /recipes/{id}` (public, unauthenticated) returns 404 when the item's `status !== 'published'`.
- [ ] The old `POST /recipes` direct-create route is removed from both the CDK routes and the handler.

Handler call-ordering:
- [ ] Tests assert that in the image-swap PATCH flow, `DDB UpdateCommand` is called before `S3 DeleteObjectsCommand` (via `ddbMock.calls()` vs `s3Mock.calls()` ordering).

Frontend — editor:
- [ ] Mounting at `/admin/recipes/new` calls `createDraft()` and replaces the URL with `/admin/recipes/:id/edit` without triggering a refetch against the just-created draft.
- [ ] On a new draft, the cover image uploads successfully without a prior manual save.
- [ ] Autosave debounces at 5s after the last dirty change and skips saves when the state is pristine or the diff is empty.
- [ ] An in-flight autosave is aborted via `AbortController` when a newer save fires.
- [ ] On `visibilitychange` → hidden and on unmount, any pending autosave flushes immediately.
- [ ] A 401 during autosave is handled by `handleSessionError(err, logout, navigate)` (no silent failure, no data loss indication missing).
- [ ] `useBlocker(form.dirty)` and the `beforeunload` handler continue to gate navigation when there are unflushed changes; `MARK_PRISTINE` is dispatched on autosave success.
- [ ] `<AutosaveStatus>` has `role="status"` and `aria-live="polite"`, announces only the transitions (Saving…, Saved, Failed) — not the relative-time ticks — and uses `aria-live="assertive"` on the failure variant.
- [ ] Publish button is disabled until server-side validation rules would pass; disabled state announces the missing fields via `aria-describedby`.
- [ ] Publishing a draft flips the editor into published mode in place (primary button becomes **Update**, Unpublish becomes visible) without a full navigation.
- [ ] Unpublishing a published recipe flushes pending autosave first, then transitions the editor into draft mode in place.
- [ ] **Discard draft** shows a destructive `ConfirmDialog`, calls `deleteRecipe(id)` on confirm, and navigates to `/admin/recipes`.

Frontend — list:
- [ ] `/admin/recipes` fetches via `fetchAllRecipes` (returns both statuses) and sorts client-side by `updatedAt` desc.
- [ ] Each row renders a `StatusBadge` component extracted from the existing inline badge markup, with CSS migrated verbatim.
- [ ] `StatusBadge` includes a visually-hidden "Status: " prefix for screen readers.

Frontend — component typing:
- [ ] `ImageUpload`'s `recipeId` prop is typed `string` (not `string | undefined`); the `id ?? ''` fallback is removed; no call site passes `undefined`.

Frontend — tests:
- [ ] `useAutosave` state-machine tests assert `idle → saving → saved | error` transitions, retry, and abort-on-update without fake timers.
- [ ] `useAutosave` debounce-timing integration tests use `vi.useFakeTimers()` in `beforeEach`, `vi.useRealTimers()` in `afterEach`, and `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`.
- [ ] Relative-time assertions in editor tests use `vi.setSystemTime` to stub `Date.now()`.

Cross-cutting:
- [ ] All existing tests pass (`pnpm test` green in both `personal-website` and `akli-infrastructure`).
- [ ] Lint passes with zero errors in both repos.

## Open Questions
- None — all design decisions resolved in clarification and technical-review rounds. Follow-up items (unsigned-JWT helper fix, unused `authorId-createdAt-index` GSI removal) are tracked explicitly as non-goals.
