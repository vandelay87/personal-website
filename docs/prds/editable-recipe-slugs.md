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
- The upload-URL endpoint stops returning `key` — image keys are now derived from `(recipe.slug, imageType[, stepId])` on the frontend.
- **Each step gains a stable `stepId`** (UUID, generated client-side) so step image URLs survive reordering: `recipes/<slug>/step-<stepId>-medium.webp` is anchored to the step's identity, not its position.

This PRD wires that contract change into the admin UI and the rendering call sites.

## Goals

- New slug input in `RecipeEditor` (admin), positioned alongside the title field.
- Slug auto-fills from the title via a sluggify helper as the user types — until the user manually edits the slug, after which auto-fill stops (so the user's manual choice isn't overwritten).
- Live URL preview below the field: **"Public URL: `akli.dev/recipes/<current-slug-value>`"**.
- Slug-lock UI: read-only with a hint when any recipe image is present.
- `recipeImageUrl(slug, imageType, variant)` signature: derive the URL from primitives instead of consuming a pre-built `key`.
- **Each step has a stable `stepId` UUID** (generated client-side via `crypto.randomUUID()` when the step is added). Step image URLs use `recipes/<slug>/step-<stepId>-<variant>.webp`, so reordering steps after upload doesn't break image references.
- Drop reads of `coverImage.key` and `step.image.key` from every call site (RecipeCard, RecipeSteps, RecipeDetailView, ImageUpload, `meta.ts`, fixtures, tests).
- Tests cover: slug input behaviour, lock state, validation, the new URL builder, the meta-tag flow, **and step-reorder-with-images** (no broken images after drag-and-drop).

## Non-Goals

- **Slug changes after first image upload.** Backend rejects with `409 slug_locked`; the frontend disables the input pre-emptively. UX hint guides users to delete the image to unlock.
- **Custom URL slugs for blog posts.** Phase 2 sibling PRD; blog posts already use slugs in their route, but image migration is separate.
- **Slug-history / redirects.** If a user changes a draft slug repeatedly before publish, only the final value is persisted. We do not maintain a redirect table for old slugs after publish (that's a different feature: changing the slug after publish requires unpublishing → no images → edit slug → re-publish, same flow).
- **i18n / non-ASCII slugs.** Validation rejects (lowercase ASCII + digits + hyphens only).
- **Pretty step image URLs.** Step image URLs include a UUID (`recipes/<slug>/step-<uuid>-medium.webp`) rather than a sequential index, deliberately trading URL aesthetics for reorder-stability. Cover images keep their pretty `cover` token because there's only one per recipe.
- **`stepId` as user-visible identity.** The UUID is internal — the editor still shows "Step 1, Step 2…" to the user; only the URL contains the UUID.
- **Backwards compatibility** with the UUID-based image URLs. Phase 1.5 deploys in lockstep with the sibling PRD; clean cutover.

## User Stories

- As an admin creating a recipe titled "Beans on Toast", I want the slug to auto-fill as `beans-on-toast` and the URL preview to show `akli.dev/recipes/beans-on-toast` immediately so I can see what the public URL will be.
- As an admin who wants a custom URL, I want to override the auto-generated slug (e.g. type `bot` for a short URL) and have the URL preview update live so I can confirm what I'll publish at.
- As an admin who has uploaded a cover image, I want the slug field to be read-only with a clear hint about why, so I don't accidentally break my image URLs.
- As an admin who picks a slug another recipe has, I want an inline error on the slug field telling me which slug is taken so I can pick a different one.
- As an admin re-typing the title after manually editing the slug, I want my custom slug to **stay put** rather than being overwritten — the auto-fill is opt-in until I touch the field.
- As an admin who has uploaded images for steps 1, 2, and 3 and then drags step 3 to first position, I want all three images to **stay attached to their original steps** — step 3's image remains "step 3's image" even though it's now displayed first.

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
+   imageType: 'cover' | `step-${string}`,
+   variant: RecipeImageVariant,
+ ): string => `${RECIPE_IMAGE_BASE}/recipes/${slug}/${imageType}-${variant}.webp`
```

Call sites change:

```diff
- recipeImageUrl(recipe.coverImage.key, 'medium')
+ recipeImageUrl(recipe.slug, 'cover', 'medium')

- recipeImageUrl(step.image.key, 'thumb')
+ recipeImageUrl(recipe.slug, `step-${step.stepId}`, 'thumb')
```

The `imageType` parameter uses a template literal type — `'cover' | \`step-${string}\`` — so a typo like `'cover2'` or `'step_1'` fails at compile time. The `string` template parameter accepts the UUID shape (`step-9d904a59-e83f-43b8-9f40-fbdb3008974c`) at runtime; we trust callers to pass a valid stepId since UUID-shape validation belongs to the runtime layer (server-side or `crypto.randomUUID()` output).

### Recipe data model

| Field | Before | After |
|---|---|---|
| `coverImage.key` | `string` | **dropped** — derive from `(recipe.slug, 'cover')` |
| `coverImage.alt` | `string` | unchanged |
| `coverImage.processedAt` | `number?` | unchanged (composed server-side) |
| `step.stepId` | (did not exist) | `string` (UUID) — **new, required** |
| `step.order` | `number` | unchanged — sort metadata only; does NOT participate in image keys |
| `step.image.key` | `string` | **dropped** — derive from `(recipe.slug, \`step-${step.stepId}\`)` |
| `step.image.alt` | `string` | unchanged |
| `step.image.processedAt` | `number?` | unchanged |

`src/types/recipe.ts` interfaces:
- `RecipeImage` loses the `key` field.
- `Step` loses the `image.key` field and **gains a required `stepId: string` field**.

### `stepId` lifecycle

- **Created**: when the user clicks "Add step" in `RecipeEditor`, the frontend assigns `stepId: crypto.randomUUID()` immediately. The new step is `{ stepId, order, text: '' }` in form state.
- **Persisted**: PATCH /recipes/{id} sends the steps array with stepIds. Server validates each `stepId` is a UUID and that they're unique within the recipe.
- **Loaded**: `recipeToFormState` reads `recipe.steps` as-is — every step is expected to carry a `stepId` from the server.
- **Reordered**: drag-and-drop changes only `step.order`; stepIds stay put. Image URLs are unchanged.
- **Deleted**: dropping a step from the array → server detects the missing `stepId` on the next PATCH and runs the image-cleanup flow (see sibling PRD).

### Image upload flow

`POST /recipes/images/upload-url` no longer returns `key`. The frontend now:

1. Sends `{ recipeId, imageType, stepId? }`. For step uploads, `stepId` is the target step's UUID (already in form state). Cover uploads omit `stepId`.
2. Receives `{ uploadUrl }`.
3. Uploads to S3 via the presigned URL.
4. Updates form state to mark the image as "uploading" (no `key` to store — derive from `(slug, 'cover')` or `(slug, \`step-${stepId}\`)` when needed).
5. Polls the recipe via `GET /recipes/{id}` until `coverImage.processedAt` (or the matching `step.image.processedAt`) is populated.
6. Renders the image via `recipeImageUrl(recipe.slug, imageType, variant)` where `imageType` is `'cover'` or `\`step-${step.stepId}\``.

**Pre-upload constraint**: a step image upload requires that the step has been saved (or at minimum, the step exists with a stepId in the recipe document on the server). The autosave debounce ensures any newly-added step has been PATCHed within ~2 s; the upload UI disables the per-step "Choose file" button until the step's stepId is present in the last-saved server state to prevent a 404.

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

The reducer (`RecipeEditor.tsx`) uses a single `SET_FIELD` action keyed by field name (not per-field action types). This PRD:

- **Removes `slug` from the `SettableField` exclusion** at line 53 so `SET_FIELD` can set it.
- **Drops the `coverImageKey` field** from `FormState` entirely. Image identity is now derived from `(form.slug, 'cover')` and `(form.slug, \`step-${stepId}\`)`. Step images lose their `image.key` field for the same reason.
- **Adds `form.slugManuallyEdited: boolean`** to `FormState`, defaulting to `false`.
- **Steps in form state always carry a `stepId`** (UUID). The "Add step" handler in `RecipeEditor` (currently appends `{ order: N+1, text: '' }`) is updated to also assign `stepId: crypto.randomUUID()`.
- **Reducer logic** for `SET_FIELD`:
  - If `field === 'slug'` → set `slug` value AND flip `slugManuallyEdited` to true. Mark dirty.
  - If `field === 'title'` AND `slugManuallyEdited === false` → set title AND auto-derive slug as `sluggify(value)`. Mark dirty (single dirty flag, not two).
  - If `field === 'steps'` → set the new array. New steps (those without a stepId in the input) get a fresh `crypto.randomUUID()` assigned in the reducer (defensive — the UI should always pass stepIds, but the reducer enforces).
  - Otherwise → existing behaviour (set field, mark dirty).
- **`recipeToFormState`** drops the `coverImageKey` line and adds `slugManuallyEdited: true` (loaded recipes are assumed to have a manually-set slug). Loaded steps are assumed to carry stepIds from the server; if any are missing (defence in depth), the reducer assigns one and the next autosave PATCH writes it back.
- **`buildPatchPayload`** sends `coverImage: { alt: form.coverImageAlt }` (no `key` field) and `steps: form.steps` with each step's `stepId` and `order` preserved.
- **`applyImageStatusUpdates`** changes input shape: `IMAGE_STATUS_UPDATE` action carries `imageStatus` keys directly (e.g. `recipes/<slug>/cover`, `recipes/<slug>/step-<stepId>`) and the reducer derives the per-image processedAt by comparing those keys against the slug+stepId-derived expected keys.
- **Server validation errors**: on `409 slug_taken` from PATCH, set `form.errors.slug = response.message`. On `409 slug_locked` (should be unreachable given the UI lock), surface as a generic recipe-level error. On `400 invalid_stepId` or `400 duplicate_stepId` (also unreachable in practice — frontend always generates valid UUIDs), surface as a generic recipe-level error so the bug is visible.

The settable-field exclusion list shrinks from `'dirty' | 'mode' | 'id' | 'slug' | 'coverImageProcessedAt'` to `'dirty' | 'mode' | 'id' | 'coverImageProcessedAt' | 'slugManuallyEdited'` — `slugManuallyEdited` is set by the reducer's slug-handling branch, not via `SET_FIELD`.

**Slug derivation does not PATCH until the user types into a field.** The autosave is gated on `form.dirty`. Initial mount `LOAD_RECIPE` resets `dirty` to false, so the auto-derived slug from a server-supplied placeholder is never PATCHed unless the user actually edits something.

### Step reordering UX

The editor currently lets users reorder steps via drag-and-drop / arrow buttons. With the stepId-keyed image scheme, reorder is a free operation:

- Drag step 3 to position 1 → form state mutates: each step's `order` field is renumbered, but every `stepId` stays put.
- Autosave PATCH fires with the new array.
- Server diff: same set of `stepId`s, different `order` values → no S3 / `imageStatus` changes (this is asserted in the sibling backend PRD).
- Image URLs remain stable because they're keyed off `stepId`, not `order`.

### `useImageProcessingPoll` hook (existing — must change)

The hook (`src/hooks/useImageProcessingPoll.ts`) reads `coverImage.key` and `step.image.key` to identify in-flight images. Once those fields are dropped from the data model, the hook **must** change:

- `collectImages` and `unreadyKeysOf` switch from "extract `image.key`" to "compute the expected key from `(recipe.slug, imageType[, step.stepId])`".
- The hook's emitted `ImageReadyUpdate` shape changes from `{ key, processedAt }` to `{ imageType: 'cover' | \`step-${string}\`, processedAt }`. The editor's `IMAGE_STATUS_UPDATE` reducer action then matches by `imageType` (which embeds the stepId for step images), not by raw key.
- The reducer's match-by-imageType MUST use the stepId from the recipe, not the step's order — order changes on reorder; stepId doesn't.
- All hook tests update accordingly.

### Slug input lock signal

The frontend computes `slugLocked` from the editor state:

```ts
const slugLocked =
  form.coverImageProcessedAt !== undefined
  || form.steps.some((s) => s.image?.processedAt !== undefined)
  || isAnyImageUploading  // pessimistic — lock as soon as user clicks "Choose file"
```

`isAnyImageUploading` is **new local component state** in `RecipeEditor` — it does not exist today. The current `ImageUpload` component manages upload-in-flight state internally (`ImageUpload.tsx` line ~50) and exposes only an `onUpload(key)` callback. This PRD changes the contract:

- `ImageUpload` accepts `slug` and `imageType` (`'cover'` or `\`step-${stepId}\``) as props, plus the existing `recipeId` and other props.
- `ImageUpload`'s callbacks become `onUploadStarted()` and `onUploadCompleted()` (no `key` — the parent already knows `slug + imageType`).
- `RecipeEditor` tracks `isCoverUploading: boolean` and `uploadingStepIds: Set<string>` (set of stepIds whose uploads are in flight) as local React state via `useState` — not the reducer (transient UI-only state, not persisted).
- `isAnyImageUploading = isCoverUploading || uploadingStepIds.size > 0`.

This catches the race window between "user clicks upload" and "server's `imageStatus` map gets populated, then poll fires, then `processedAt` is set".

### `sluggify` helper

```ts
export const sluggify = (input: string): string =>
  input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')   // strip combining diacritic marks (U+0300–U+036F)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')       // non-alphanumeric → '-'
    .replace(/-+/g, '-')               // collapse runs of '-'
    .replace(/^-+|-+$/g, '')           // trim leading/trailing '-'
    .slice(0, 100)                     // length cap
```

The diacritic regex uses an **explicit Unicode escape (`̀-ͯ`)** rather than embedded literal combining marks. Embedded combining marks render as invisible characters in the source file and are fragile under copy/paste, prettier reformatting, or editor encoding mismatches. Implementers must use the escaped form.

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
- [ ] `Step` interface gains a required `stepId: string` field.
- [ ] `recipeImageUrl(slug, imageType, variant)` takes three arguments and returns `https://images.akli.dev/recipes/${slug}/${imageType}-${variant}.webp`. The `imageType` parameter type is `'cover' | \`step-${string}\``.
- [ ] `recipeImageUrl('beans-on-toast', 'cover', 'medium')` returns exactly `'https://images.akli.dev/recipes/beans-on-toast/cover-medium.webp'`.
- [ ] `recipeImageUrl('beans-on-toast', 'step-9d904a59-e83f-43b8-9f40-fbdb3008974c', 'thumb')` returns exactly `'https://images.akli.dev/recipes/beans-on-toast/step-9d904a59-e83f-43b8-9f40-fbdb3008974c-thumb.webp'`.
- [ ] Type-level guard: `// @ts-expect-error` on `recipeImageUrl('s', 'cover2', 'thumb')` and `recipeImageUrl('s', 'stepX', 'thumb')` — both fail the template literal type. Mirrors the existing pattern at `src/types/recipe.test.ts`.
- [ ] `sluggify('Beans on Toast')` returns `'beans-on-toast'`.
- [ ] `sluggify('  Café Crème  ')` returns `'cafe-creme'` (diacritic stripping).
- [ ] `sluggify('Crème Brûlée!')` returns `'creme-brulee'` (combined diacritic + special-char path).
- [ ] `sluggify('A!@#B')` returns `'a-b'` (non-alphanumeric runs collapse to single `-`).
- [ ] `sluggify('---a---')` returns `'a'` (leading/trailing trim).
- [ ] `sluggify('a'.repeat(150))` returns a string of length 100 (cap).
- [ ] `sluggify('123')` returns `'123'` (numeric-only).
- [ ] `sluggify('Ñ')` returns `'n'` (pure-diacritic).
- [ ] `sluggify('')` returns `''`.
- [ ] The `sluggify` source uses the explicit Unicode escape `̀-ͯ` for the diacritic range — assertable via `String(sluggify).includes('\\u0300-\\u036f')` (or simply by reading the source).

### Automated — `RecipeEditor` slug input

- [ ] Slug `<input>` is rendered with an associated `<label htmlFor>` (testable via `getByLabelText('Slug')`).
- [ ] On title input change, slug auto-fills as `sluggify(title)` until the user has typed in the slug field.
- [ ] After the user types in the slug field, subsequent title changes do **not** modify the slug.
- [ ] A "Reset to title slug" button is rendered; clicking it re-derives slug from the current title and re-enables auto-fill on subsequent title edits.
- [ ] The "Reset to title slug" button is **hidden or disabled** when `slugLocked === true` (clicking it after lock would otherwise mutate the slug and trigger an autosave PATCH that the server rejects with `slug_locked`).
- [ ] URL preview text contains `akli.dev/recipes/<slug>`, where `<slug>` is the current `form.slug` value, and updates on slug change.
- [ ] When `form.coverImageProcessedAt !== undefined`, the slug input has `readOnly` set and `aria-disabled="true"` (preserves focusability + screen-reader announcement) and the lock hint is rendered as visible text.
- [ ] When at least one step has `image.processedAt !== undefined`, the slug input is also locked (same UI shape).
- [ ] When `isAnyImageUploading === true` (an upload is in flight, before processedAt arrives), the slug input is also locked.
- [ ] When the API responds `409 slug_taken`, the inline error renders below the slug field with the server's `message` (testable via `findByText`).
- [ ] Save / publish button is disabled when the slug fails the validation regex.
- [ ] Auto-derived slug on initial mount (after `LOAD_RECIPE` from a fresh draft) does **not** trigger an autosave PATCH until the user types into a field — `form.dirty` remains `false` until the first user action.

### Automated — call-site sweep

- [ ] `src/components/RecipeCard/RecipeCard.tsx` calls `recipeImageUrl(recipe.slug, 'cover', variant)` and does not read `coverImage.key`.
- [ ] `src/components/RecipeSteps/RecipeSteps.tsx` calls `recipeImageUrl(recipe.slug, \`step-${step.stepId}\`, variant)` for each step image.
- [ ] `src/components/RecipeDetailView/RecipeDetailView.tsx` calls `recipeImageUrl(recipe.slug, 'cover', variant)`.
- [ ] `src/components/ImageUpload/ImageUpload.tsx` accepts `slug` + `imageType` (cover or `step-${stepId}`) as props; its callback contract is `onUploadStarted()` and `onUploadCompleted()` (no `key` argument). It no longer reads `coverImage.key`.
- [ ] `src/meta.ts` calls `recipeImageUrl(recipe.slug, 'cover', 'medium')`.
- [ ] `RecipeEditor.buildPatchPayload` sends `coverImage: { alt: form.coverImageAlt }` (no `key` field) and includes `stepId` on every step in the steps array.
- [ ] `RecipeEditor.draftFromCreated` no longer initialises `coverImage.key`.
- [ ] `RecipeEditor.computeMissingFields` no longer references `coverImageKey`; "cover image present" is signalled by `coverImageProcessedAt !== undefined` (or `isCoverUploading` for the in-flight window).
- [ ] `RecipeEditor` "Add step" handler assigns `stepId: crypto.randomUUID()` to every newly-added step.
- [ ] `RecipeEditor` reordering steps (drag/arrow buttons) preserves each step's `stepId` and only mutates `step.order` values.
- [ ] `grep -rn 'coverImage.key\|coverImage\\.key' src/` returns zero matches in production code (test scaffolding asserting absence is allowed).
- [ ] `grep -rn 'image.key\|\\.image\\.key' src/components/RecipeSteps/ src/components/ImageUpload/ src/pages/admin/RecipeEditor/` returns zero matches.
- [ ] `grep -rn 'step-\${.*order}\|step-\${order}' src/` returns zero matches (no order-based step image keys remain in production code).

### Automated — fixture sweep

- [ ] All component / page test fixtures drop `coverImage.key` and `step.image.key`.
- [ ] All step fixtures across the codebase carry a `stepId` (UUID-shaped) — sample known UUIDs in fixtures (e.g. `'9d904a59-e83f-43b8-9f40-fbdb3008974c'`) so URL assertions are deterministic.
- [ ] Fixtures use realistic slug values (e.g. `'beans-on-toast'`, `'spaghetti-bolognese'`) — not placeholders.
- [ ] `meta.test.ts` recipe-branch full-URL assertions still pass against the new builder signature.
- [ ] The `loadedRecipe` fixture inside `RecipeEditor.tsx` is updated.
- [ ] Test-utility recipe factories (e.g. anything under `src/test-utils/`, if present) are updated.
- [ ] Component test for `RecipeSteps`: full-URL assertion uses the fixture's stepId, e.g. `https://images.akli.dev/recipes/spaghetti-bolognese/step-<known-uuid>-medium.webp`.

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
- [ ] **Step reorder smoke test**: add 3 steps, upload images to all 3, drag step 3 to first position. After save and refresh, each step still displays its original image (the image originally uploaded for "step 3 in the array" is still attached to that step, now displayed at position 1). Network panel confirms image URLs are unchanged.

### Process

- [ ] Tests are written before implementation (TDD) for new components/helpers.
- [ ] `/simplify` is run on the PR diff before opening (per `CLAUDE.md`).
- [ ] Lockstep deploy with sibling backend PRD.

