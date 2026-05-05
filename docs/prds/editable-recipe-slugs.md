# PRD: Editable Recipe Slugs (Frontend)

> **Sibling PRD:** [`akli-infrastructure/docs/prds/editable-recipe-slugs.md`](../../../akli-infrastructure/docs/prds/editable-recipe-slugs.md) — covers the API contract changes (slug acceptance on draft + PATCH, server-side uniqueness + lock enforcement), the Lambda/resizer changes, the new `slug-index` GSI, and the data model change that drops `coverImage.key`. **Must deploy in lockstep with this PRD.**
>
> **Epic context:** "Phase 1.5" between [`images-cdn-phase-1.md`](./images-cdn-phase-1.md) (just shipped) and the planned phase 2 (blog images). Adds a slug input to the recipe editor with a lock-on-first-image-upload rule, drops the stored `coverImage.key`/`step.image.key` fields, and changes `recipeImageUrl`'s signature so URLs are derived from the recipe's slug rather than a stored key.

## Overview

Expose the recipe slug as a user-editable input in the admin recipe editor (auto-filled from the title, with manual override and a live URL preview). Lock the slug field once any image has been uploaded. Change `recipeImageUrl` to take `(slug, imageType, variant)` and remove the `coverImage.key`/`step.image.key` reads from every call site.

## Problem Statement

Today, the slug is server-assigned at draft creation (`createDraft` returns `{id, slug}`) and the frontend has **no UI to edit it**. Users have zero say in their recipe URL.

Combined with the current image URL shape — `https://images.akli.dev/recipes/<uuid>/cover-medium.webp` — this means recipe images carry an opaque 36-character identifier in the URL, even though the public recipe page already uses a slug (`/recipes/spaghetti-bolognese`).

The sibling backend PRD changes the API contract so:
- Draft creation accepts an optional slug (or returns a `draft-<8chars>` placeholder).
- PATCH accepts slug; server returns `409` if it's taken or if the recipe already has uploaded images.
- The upload-URL endpoint stops returning `key` — image keys are now derived from `(recipe.slug, imageType[, stepOrder])` on the frontend.

This PRD wires that contract change into the admin UI and the rendering call sites.

## Goals

- New slug input in `RecipeEditor` (admin), positioned alongside the title field.
- Slug auto-fills from the title via a sluggify helper as the user types — until the user manually edits the slug, after which auto-fill stops (so the user's manual choice isn't overwritten).
- Live URL preview below the field: **"Public URL: `akli.dev/recipes/<current-slug-value>`"**.
- Slug-lock UI: read-only with a hint when any recipe image is present.
- `recipeImageUrl(slug, imageType, variant)` signature: derive the URL from primitives instead of consuming a pre-built `key`.
- Drop reads of `coverImage.key` and `step.image.key` from every call site (RecipeCard, RecipeSteps, RecipeDetailView, ImageUpload, `meta.ts`, fixtures, tests).
- Tests cover: slug input behaviour, lock state, validation, the new URL builder, and the meta-tag flow.

## Non-Goals

- **Slug changes after first image upload.** Backend rejects with `409 slug_locked`; the frontend disables the input pre-emptively. UX hint guides users to delete the image to unlock.
- **Custom URL slugs for blog posts.** Phase 2 sibling PRD; blog posts already use slugs in their route, but image migration is separate.
- **Slug-history / redirects.** If a user changes a draft slug repeatedly before publish, only the final value is persisted. We do not maintain a redirect table for old slugs after publish (that's a different feature: changing the slug after publish requires unpublishing → no images → edit slug → re-publish, same flow).
- **i18n / non-ASCII slugs.** Validation rejects (lowercase ASCII + digits + hyphens only).
- **Backwards compatibility** with the UUID-based image URLs. Phase 1.5 deploys in lockstep with the sibling PRD; clean cutover.

## User Stories

- As an admin creating a recipe titled "Beans on Toast", I want the slug to auto-fill as `beans-on-toast` and the URL preview to show `akli.dev/recipes/beans-on-toast` immediately so I can see what the public URL will be.
- As an admin who wants a custom URL, I want to override the auto-generated slug (e.g. type `bot` for a short URL) and have the URL preview update live so I can confirm what I'll publish at.
- As an admin who has uploaded a cover image, I want the slug field to be read-only with a clear hint about why, so I don't accidentally break my image URLs.
- As an admin who picks a slug another recipe has, I want an inline error on the slug field telling me which slug is taken so I can pick a different one.
- As an admin re-typing the title after manually editing the slug, I want my custom slug to **stay put** rather than being overwritten — the auto-fill is opt-in until I touch the field.

## Design & UX

### Slug input — placement and behaviour

In `RecipeEditor` (`src/pages/admin/RecipeEditor/RecipeEditor.tsx`), insert the slug input directly below the title field. Reuse the existing form styling (`Input` component or matching pattern from the title field).

```
┌──────────────────────────────────────────────────────┐
│ Title                                                │
│ ┌────────────────────────────────────────────────┐   │
│ │ Beans on Toast                                  │   │
│ └────────────────────────────────────────────────┘   │
│                                                       │
│ Slug                                                 │
│ ┌────────────────────────────────────────────────┐   │
│ │ beans-on-toast                                  │   │
│ └────────────────────────────────────────────────┘   │
│ Public URL: akli.dev/recipes/beans-on-toast          │
└──────────────────────────────────────────────────────┘
```

When locked (after image upload):

```
│ Slug                                                 │
│ ┌────────────────────────────────────────────────┐   │
│ │ beans-on-toast                          🔒      │   │
│ └────────────────────────────────────────────────┘   │
│ Slug is locked — uploaded images are tied to it.     │
│ Delete uploaded images to unlock.                    │
```

When validation error from server:

```
│ Slug                                                 │
│ ┌────────────────────────────────────────────────┐   │
│ │ beans-on-toast                                  │   │
│ └────────────────────────────────────────────────┘   │
│ ⚠ Slug "beans-on-toast" is already in use.          │
```

### Auto-fill rules

- On each keystroke in the **title** field, if the user has **not** manually edited the slug, recompute slug as `sluggify(title)` and update form state.
- The first time the user types into the **slug** field directly, set a `slugManuallyEdited: true` flag. After that, title changes don't touch the slug.
- A small **"Reset to title slug"** button next to the slug field clears the manual-edit flag and re-derives from the current title — useful if the user changed their mind.

### Lock states

| Recipe state | Slug input behaviour |
|---|---|
| New draft, no images | Editable; auto-fills from title until manually edited |
| Draft with uploaded image (cover or any step) | Read-only; lock icon + hint shown |
| Recipe being patched, server returns `slug_taken` | Editable; inline error |
| Recipe being patched, server returns `slug_locked` | Should never happen (frontend lock prevents the PATCH) — surface as a generic error if it does |

### Validation (client-side, mirrors server)

- Regex: `^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$` (1–100 chars; lowercase + digits + hyphens; no leading/trailing hyphen).
- Reserved words: `new`, `admin`, `drafts`, `images` — disallowed.
- Show inline error as the user types (debounced 200ms).
- Save button disabled when slug is invalid.

### `recipeImageUrl` signature change

```diff
- export const recipeImageUrl = (key: string, variant: RecipeImageVariant): string =>
-   `${RECIPE_IMAGE_BASE}/${key}-${variant}.webp`
+ export const recipeImageUrl = (
+   slug: string,
+   imageType: 'cover' | `step-${number}`,
+   variant: RecipeImageVariant,
+ ): string => `${RECIPE_IMAGE_BASE}/recipes/${slug}/${imageType}-${variant}.webp`
```

Call sites change:

```diff
- recipeImageUrl(recipe.coverImage.key, 'medium')
+ recipeImageUrl(recipe.slug, 'cover', 'medium')

- recipeImageUrl(step.image.key, 'thumb')
+ recipeImageUrl(recipe.slug, `step-${step.order}`, 'thumb')
```

The `imageType` parameter uses a template literal type for steps (`step-1`, `step-2`, ...) so a typo like `'step1'` fails at compile time.

### Recipe data model

| Field | Before | After |
|---|---|---|
| `coverImage.key` | `string` | **dropped** — derive from `(recipe.slug, 'cover')` |
| `coverImage.alt` | `string` | unchanged |
| `coverImage.processedAt` | `number?` | unchanged (composed server-side) |
| `step.image.key` | `string` | **dropped** — derive from `(recipe.slug, \`step-${step.order}\`)` |
| `step.image.alt` | `string` | unchanged |
| `step.image.processedAt` | `number?` | unchanged |

`src/types/recipe.ts` interfaces `RecipeImage` and `Step` lose the `key` field.

### Image upload flow

`POST /recipes/images/upload-url` no longer returns `key`. The frontend now:

1. Sends `{ recipeId, imageType, stepOrder? }` as before.
2. Receives `{ uploadUrl }`.
3. Uploads to S3 via the presigned URL.
4. Updates form state to mark the image as "uploading" (no `key` to store — derive from slug + imageType when needed).
5. Polls the recipe via `GET /recipes/{id}` until `coverImage.processedAt` (or `step.image.processedAt`) is populated.
6. Renders the image via `recipeImageUrl(recipe.slug, imageType, variant)`.

### `meta.ts` (OG tag builder)

```diff
- recipeImageUrl(recipe.coverImage.key, 'medium')
+ recipeImageUrl(recipe.slug, 'cover', 'medium')
```

Single line change. Existing `buildMetaTags` `startsWith('http')` guard from #184 keeps working.

### `ProcessingPlaceholder` integration

Today `RecipeDetailView` renders `<ProcessingPlaceholder />` when `coverImage.processedAt` is undefined. That logic is unchanged — `processedAt` is still composed server-side, just from a derived key. The placeholder UX continues to work without modification.

## Technical Considerations

### Stack

- React 19 + TypeScript + Vite (existing).
- Vitest + Testing Library for unit + component tests.
- No new dependencies. The `sluggify` helper is small enough to inline (~10 lines) — strip diacritics, lowercase, replace non-alphanumeric with `-`, collapse runs of `-`, trim leading/trailing `-`.

### Form state in `RecipeEditor`

The reducer (`RecipeEditor.tsx`) gains:

- `form.slug: string`
- `form.slugManuallyEdited: boolean`
- New action: `EDIT_SLUG` — sets `slug` and flips `slugManuallyEdited` to true.
- Existing `EDIT_TITLE` action: when `slugManuallyEdited === false`, also derive a new slug from the new title.
- Server validation errors: handled in the existing PATCH error path. On `409 slug_taken`, set `form.errors.slug = '...'`; on `409 slug_locked`, set a generic recipe-level error (this should never happen given the frontend lock).

### `useImageProcessingPoll` hook (existing)

The hook polls the recipe endpoint until `processedAt` is set. It currently keys off `coverImage.key` to identify which image to wait for. After this PRD, it derives the expected `imageStatus` key from `(recipe.slug, imageType)`.

Since `imageStatus` is stripped server-side and the hook only consumes `coverImage.processedAt` / `step.image.processedAt` (which are composed by the server), the hook signature might not need changes — verify during implementation.

### Slug input lock signal

The frontend computes `slugLocked` from the recipe state:

```ts
const slugLocked =
  recipe.coverImage?.processedAt !== undefined
  || recipe.steps?.some((s) => s.image?.processedAt !== undefined)
  || isUploading  // pessimistic — lock as soon as user clicks "upload"
```

`isUploading` is local upload-in-flight state. This catches the race window between "user clicks upload" and "server's `imageStatus` map gets populated".

### `sluggify` helper

```ts
export const sluggify = (input: string): string =>
  input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')           // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')                // non-alphanumeric → '-'
    .replace(/-+/g, '-')                        // collapse runs of '-'
    .replace(/^-+|-+$/g, '')                    // trim leading/trailing '-'
    .slice(0, 100)                              // length cap
```

Lives in `src/types/recipe.ts` (alongside `recipeImageUrl`) and is exported.

### TDD approach

Per `CLAUDE.md` and Phase 1 precedent:

- New `src/types/recipe.test.ts` tests gain cases for the new `recipeImageUrl` signature, the `sluggify` helper, and (optionally) a small set of edge cases for the new template-literal `imageType` parameter type.
- New tests in `src/pages/admin/RecipeEditor/RecipeEditor.test.tsx`:
  - Slug input renders alongside title.
  - Auto-fill from title until user types in slug.
  - "Reset to title slug" clears the manual-edit flag.
  - Live URL preview reflects the current slug value.
  - Slug field is read-only when `coverImage.processedAt !== undefined` and shows the lock hint.
  - On `409 slug_taken` from server, inline error renders.
  - Save button disabled on invalid slug.
- Component tests for `RecipeCard`, `RecipeSteps`, `RecipeDetailView`, `ImageUpload`, `RecipePreview` updated to drop `coverImage.key`/`step.image.key` from fixtures and assert URLs are constructed from `recipe.slug`.
- `meta.test.ts` recipe-branch fixtures drop `coverImage.key`. Full-URL assertions stay; updated to use `'beans-on-toast'` as the realistic slug.
- Existing test fixtures swept across:
  - `src/components/RecipeCard/RecipeCard.test.tsx`
  - `src/components/RecipeSteps/RecipeSteps.test.tsx`
  - `src/components/RecipeDetailView/RecipeDetailView.test.tsx`
  - `src/components/ImageUpload/ImageUpload.test.tsx`
  - `src/pages/RecipeDetail/RecipeDetail.test.tsx`
  - `src/pages/admin/RecipeEditor/RecipeEditor.test.tsx`
  - `src/pages/admin/RecipePreview/RecipePreview.test.tsx`
  - `src/api/recipes.test.ts`
  - `src/entry-server.test.tsx`

### Accessibility

- The slug `<input>` has a visible `<label>` and a programmatic `aria-describedby` pointing at the URL-preview text and the error/lock hint when present.
- The lock state uses both visual (lock icon) and textual (hint paragraph) cues so screen-reader users aren't relying on the icon alone.
- The "Reset to title slug" control is a `<button>`, focusable and labelled.

### Performance

- `sluggify` is O(n) on title length, capped at 100 chars. Negligible.
- The auto-fill effect runs on every title keystroke; it's a string transform on form state, no I/O.
- Server validation (uniqueness check) only fires on save / PATCH — not on every keystroke. (A live debounced uniqueness check is a future polish — open as a follow-up if the UX warrants.)

## Acceptance Criteria

### Automated — `src/types/recipe.ts` + `src/types/recipe.test.ts`

- [ ] `RecipeImage` interface no longer has a `key` field.
- [ ] `Step.image` (when present) no longer has a `key` field.
- [ ] `recipeImageUrl(slug, imageType, variant)` takes three arguments and returns `https://images.akli.dev/recipes/${slug}/${imageType}-${variant}.webp`.
- [ ] `recipeImageUrl('beans-on-toast', 'cover', 'medium')` returns exactly `'https://images.akli.dev/recipes/beans-on-toast/cover-medium.webp'`.
- [ ] `recipeImageUrl('beans-on-toast', 'step-3', 'thumb')` returns exactly `'https://images.akli.dev/recipes/beans-on-toast/step-3-thumb.webp'`.
- [ ] Type-level guard: `recipeImageUrl('s', 'step-bad' as never, 'thumb')` is rejected by TS via `// @ts-expect-error`. (Mirrors the existing pattern at `src/types/recipe.test.ts`.)
- [ ] `sluggify('Beans on Toast')` returns `'beans-on-toast'`.
- [ ] `sluggify('  Café Crème  ')` returns `'cafe-creme'` (diacritic stripping).
- [ ] `sluggify('A!@#B')` returns `'a-b'` (non-alphanumeric runs collapse to single `-`).
- [ ] `sluggify('---a---')` returns `'a'` (leading/trailing trim).
- [ ] `sluggify('a'.repeat(150))` returns a string of length 100 (cap).
- [ ] `sluggify('')` returns `''`.

### Automated — `RecipeEditor` slug input

- [ ] Slug `<input>` is rendered with an associated `<label>`.
- [ ] On title input change, slug auto-fills as `sluggify(title)` until the user has typed in the slug field.
- [ ] After the user types in the slug field, subsequent title changes do **not** modify the slug.
- [ ] A "Reset to title slug" button is rendered; clicking it re-derives slug from the current title and re-enables auto-fill on subsequent title edits.
- [ ] URL preview text contains the literal `akli.dev/recipes/${currentSlug}` and updates on slug change.
- [ ] When `coverImage.processedAt !== undefined`, the slug input has the `readonly` attribute and the lock hint is rendered.
- [ ] When at least one step has `image.processedAt !== undefined`, the slug input is also locked.
- [ ] When the API responds `409 slug_taken`, the inline error renders below the slug field with the server's `message`.
- [ ] Save / publish button is disabled when the slug fails the validation regex.

### Automated — call-site sweep

- [ ] `src/components/RecipeCard/RecipeCard.tsx` calls `recipeImageUrl(recipe.slug, 'cover', variant)` and does not read `coverImage.key`.
- [ ] `src/components/RecipeSteps/RecipeSteps.tsx` calls `recipeImageUrl(recipe.slug, \`step-${step.order}\`, variant)` for each step image.
- [ ] `src/components/RecipeDetailView/RecipeDetailView.tsx` calls `recipeImageUrl(recipe.slug, 'cover', variant)`.
- [ ] `src/components/ImageUpload/ImageUpload.tsx` no longer reads `coverImage.key` for preview rendering — derives from props (`slug`, `imageType`).
- [ ] `src/meta.ts` calls `recipeImageUrl(recipe.slug, 'cover', 'medium')`.
- [ ] `grep -rn 'coverImage.key\|coverImage\\.key' src/` returns zero matches in production code (test scaffolding asserting absence is allowed).
- [ ] `grep -rn 'image.key\|\\.image\\.key' src/components/RecipeSteps/ src/components/ImageUpload/` returns zero matches.

### Automated — fixture sweep

- [ ] All component / page test fixtures drop `coverImage.key` and `step.image.key`.
- [ ] Fixtures use realistic slug values (e.g. `'beans-on-toast'`, `'spaghetti-bolognese'`) — not placeholders.
- [ ] `meta.test.ts` recipe-branch full-URL assertions still pass against the new builder signature.

### Automated — quality gates

- [ ] `pnpm test` passes (all suites green, no skips).
- [ ] `pnpm lint` passes.
- [ ] `pnpm exec tsc --noEmit` produces no NEW errors (pre-existing baseline allowed).
- [ ] `pnpm build:prod` succeeds.

### Manual — Post-deploy

- [ ] Lockstep gate: sibling backend PRD has shipped (verified via `aws dynamodb describe-table` showing the new `slug-index` GSI).
- [ ] Creating a recipe titled "Beans on Toast" in the admin auto-fills slug as `beans-on-toast`. URL preview reads `akli.dev/recipes/beans-on-toast`.
- [ ] Manually editing the slug to `bot` updates the URL preview live; further title edits don't overwrite.
- [ ] Uploading a cover image succeeds; image renders at `https://images.akli.dev/recipes/bot/cover-medium.webp`.
- [ ] After upload, the slug field is read-only and shows the lock hint.
- [ ] Attempting to use a slug already taken by another recipe shows the inline `slug_taken` error.
- [ ] Deleting the cover image unlocks the slug field; re-editing + re-uploading produces images at the new slug.

### Process

- [ ] Tests are written before implementation (TDD) for new components/helpers.
- [ ] `/simplify` is run on the PR diff before opening (per `CLAUDE.md`).
- [ ] Lockstep deploy with sibling backend PRD.

## Open Questions

All resolved during design discussion:

- **Slug input position** → directly below title in `RecipeEditor`.
- **Auto-fill semantics** → opt-out: auto-fills until user types in slug, then stops (manual override sticks).
- **"Reset to title slug" button** → included; useful affordance, low cost.
- **Lock signal source** → `processedAt !== undefined` on cover or any step image; pessimistic `isUploading` overlay covers the upload race window.
- **Slug-collision UX** → inline error on the slug field, server returns `409 slug_taken`.
- **Live debounced uniqueness check** → out of scope; saves are validated server-side. Open as a polish follow-up if UX feedback warrants.
