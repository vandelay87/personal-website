# PRD: Images CDN — Phase 2 (Blog Migration to `images.akli.dev`)

> **Sibling PRD:** [`akli-infrastructure/docs/prds/images-cdn-phase-2.md`](../../../akli-infrastructure/docs/prds/images-cdn-phase-2.md) — adds the site bucket as a second origin on `images.akli.dev` under `blog/*`. **Must deploy before this PRD ships.**
>
> **Hard dependency on:** [`images-cdn-phase-1.md`](./images-cdn-phase-1.md). That PRD adds the `buildMetaTags` fix to handle absolute image URLs (skip the unconditional `${BASE_URL}${image}` prefix when `image` already starts with `http`).
>
> **Dependency status (2026-09, PRD refresh): satisfied.** `src/meta.ts:91-92` already reads `image.startsWith('http') ? image : \`${BASE_URL}${image}\`` — phase 1's fix is merged on `main`. The original "merge blocker" language below described the state at PRD-writing time; it's no longer a blocker, kept for context.
>
> **Epic context:** PRD 4 of 4 — the final piece of the unified images CDN epic.
> 1. `akli-infrastructure` phase 1 (done) — subdomain + recipe-images origin.
> 2. `personal-website` phase 1 (done) — frontend cutover for recipe URLs.
> 3. `akli-infrastructure` phase 2 (sibling above) — blog origin under same subdomain.
> 4. **THIS PRD** — `personal-website` phase 2: move blog images to `public/blog/<post-slug>/`, update MDX/test references to `images.akli.dev/blog/<post-slug>/*`.

## Overview

Move blog image files from `public/images/blog/` to `public/blog/<post-slug>/` — nested by the owning post's slug, not flat — so they deploy to S3 key `blog/<post-slug>/<file>` (the sibling PRD's `blog/*` CloudFront behavior already matches nested paths, so no infra change is needed for this). Update every reference across the codebase from `/images/blog/<file>` → `https://images.akli.dev/blog/<post-slug>/<file>`. After this ships, `images.akli.dev` is the single canonical surface for every image on akli.dev.

**Design note (2026-09):** this PRD originally specified a flat `blog/<file>` namespace. Changed to per-post nesting before implementation started — see "Image organization: nested by post slug" in Technical Considerations for why.

## Problem Statement

Phase 1 of the images-CDN epic switched recipe images to `images.akli.dev`. Blog images still live at `akli.dev/images/blog/<file>` served from the site bucket via the existing `images/*` behavior. The unified images CDN is half-complete. Phase 2 finishes it: blog images need to move keys (in S3) and URLs (in MDX + meta) to live alongside recipes on `images.akli.dev`.

The migration touches a small surface — three MDX posts reference blog images today (`building-a-pokedex.mdx`, plus `from-draft-to-published-recipe.mdx` and `akli-ui-storybook.mdx`, both shipped after this PRD was originally written — see Technical Considerations) plus two test files — so the implementation is mechanical. The bigger concern is sequencing: this PRD must ship after the akli-infrastructure phase 2 deploy, otherwise MDX references point at a route that doesn't exist yet.

## Goals

- Every blog-image reference in the codebase points at `https://images.akli.dev/blog/<post-slug>/<file>.webp` after this ships.
- Blog image files live at `public/blog/<post-slug>/<file>.webp` (Vite deploys them to S3 key `blog/<post-slug>/<file>.webp`).
- OG/Twitter meta tags for blog posts emit absolute `https://images.akli.dev/blog/...` URLs (correct, not double-prefixed) — depends on phase 1's `buildMetaTags` fix.
- After deploy, the deploy workflow's `aws s3 sync --delete` removes the old `images/blog/<file>.webp` keys from S3, completing the cutover. No orphaned files.
- The unified images CDN is now the single canonical image-serving surface for the site.

## Non-Goals

- **The `images.akli.dev/blog/*` route or origin wiring.** Covered by the sibling akli-infrastructure phase 2 PRD; must ship first.
- **301 redirects from old `akli.dev/images/blog/*` URLs.** Explicitly rejected in the sibling PRD (keeps legacy URL patterns out of IaC; trade-off accepted that any previously-shared social links break). This PRD's deploy actively deletes the old keys via `--delete`.
- **Recipe URL changes.** Handled by [`images-cdn-phase-1.md`](./images-cdn-phase-1.md).
- **Adding new blog images, new posts, or unrelated content.** Pure migration.
- **Touching `vite-imagetools` config.** Blog images are intentionally served as-is per the project convention; no Vite processing for blog images.
- **Changing the MDX `<Image>` component itself.** It accepts an `src` string; the migration is at the call sites.
- **Backwards compatibility.** Old URLs WILL break after this ships. That's the agreed trade-off from the sibling PRD's "no redirects" decision.
- **`buildMetaTags` modification.** That fix is owned by phase 1; this PRD relies on it being in place.

## User Stories

- **As a public reader** of a blog post, I want every image on the page to load (cover + inline images), so the post reads correctly with no broken images.
- **As a social-share consumer** clicking a freshly-shared blog post link on Twitter/Slack/LinkedIn after the cutover, I want the OG card preview to render the cover image, so the link looks legitimate.
- **As a future blog post author**, I want the URL pattern for new blog images to follow `https://images.akli.dev/blog/<post-slug>/<file>.webp` so I never have to invent a collision-free filename — the post-slug directory does that job.
- **As future-me** maintaining the codebase, I want a single mental model — every image on the site is at `images.akli.dev/<namespace>/<entity>/<file>` — so I don't have to remember where each kind of image lives, and it matches the `recipes/<id>/<file>` pattern already established.

## Design & UX

Backend / build / deploy only. No UI changes — readers don't see anything different (same images, same layout, same loading behaviour). What changes is the URL the `<img>` tag points at.

### URL pattern transform

```diff
- /images/blog/pokedex-desktop.webp
+ https://images.akli.dev/blog/building-a-pokedex/pokedex-desktop.webp
```

Applied wherever blog images are referenced. The `blog/` prefix is always followed by the owning post's slug — see "Image organization: nested by post slug" below.

### File move

```diff
- public/images/blog/pokedex-desktop.webp
- public/images/blog/pokedex-mobile.webp
- public/images/blog/recipes.webp
- public/images/blog/recipe-editor.webp
- public/images/blog/storybook-button-docs.webp
- public/images/blog/storybook-header-public-variant.webp
+ public/blog/building-a-pokedex/pokedex-desktop.webp
+ public/blog/building-a-pokedex/pokedex-mobile.webp
+ public/blog/from-draft-to-published-recipe/recipes.webp
+ public/blog/from-draft-to-published-recipe/recipe-editor.webp
+ public/blog/akli-ui-storybook/storybook-button-docs.webp
+ public/blog/akli-ui-storybook/storybook-header-public-variant.webp
```

Each image moves into a subdirectory named after its post's slug — the same string used in the post's `/blog/<slug>` route. After Vite build, files end up at S3 keys `blog/<post-slug>/<file>.webp` in the site bucket. The sibling PRD's `images.akli.dev/blog/*` CloudFront behavior already matches nested paths (`*` matches everything after `blog/`, slashes included), so it serves them with no path rewrite and no infra-side change.

### Why absolute URLs in MDX

Two reasons we use `https://images.akli.dev/blog/...` (absolute) rather than `/blog/...` (relative):

1. **The new files live on a different subdomain.** A relative path `/blog/foo.webp` would be interpreted by the browser as `akli.dev/blog/foo.webp` — wrong domain. The browser doesn't know to cross subdomains for an image reference.
2. **`/blog/<slug>` is already the SPA route for blog posts.** A relative `/blog/foo.webp` would conflict with React Router's catch-all in confusing ways and depend on CloudFront's behavior precedence ordering. Absolute URLs sidestep the ambiguity entirely.

### States — unchanged

Same loading, error, success states as before. Same `<Image>` component, same OG card structure. Only the URL string changes.

## Technical Considerations

### Image organization: nested by post slug, not flat

**Changed 2026-09, before implementation started.** This PRD originally specified a flat `blog/<file>.webp` namespace — one directory holding every blog image regardless of which post it belongs to. Revised to nest by post slug (`blog/<post-slug>/<file>.webp`) instead, for three reasons:

1. **Consistency.** The recipes namespace this CDN already ships uses `recipes/<recipe-id>/<variant>.webp` — image scoped under its owning entity. A flat `blog/<file>.webp` broke that pattern for no reason.
2. **Collision avoidance.** Flat naming forces every filename to be globally unique across all posts forever, which is why the current six files already have post-specific prefixes baked in (`pokedex-desktop.webp`, `storybook-button-docs.webp`) — manually doing the job a directory should do. Nesting means a future post can use `cover.webp` without checking every other post's filenames first.
3. **Scoped cleanup.** Deleting or renaming a post's images is `rm -rf public/blog/<slug>/`, not "find every loose file that happens to belong to this post."

No infra-side change was needed for this: the sibling akli-infrastructure PRD's `blog/*` CloudFront path pattern already matches nested paths (`*` matches everything after the prefix, slashes included), so `blog/<slug>/<file>.webp` routes correctly with the existing behavior as originally designed.

### Mechanical find-replace surface

**Three MDX files** reference blog images today (updated 2026-09 — two of these shipped after this PRD was originally written, when only `building-a-pokedex.mdx` existed; re-verify this list at implementation time in case more posts landed since):

- **`src/pages/Blog/posts/building-a-pokedex.mdx`** (slug `building-a-pokedex`) — 3 references:
  - Line 6 (frontmatter): `image: /images/blog/pokedex-desktop.webp`
  - Line 9 (inline `<Image src=...>`): `/images/blog/pokedex-desktop.webp`
  - Line 213 (inline `<Image src=...>`): `/images/blog/pokedex-mobile.webp`
- **`src/pages/Blog/posts/from-draft-to-published-recipe.mdx`** (slug `from-draft-to-published-recipe`) — 3 references:
  - Line 6 (frontmatter): `image: /images/blog/recipes.webp`
  - Line 9 (inline `<Image src=...>`): `/images/blog/recipes.webp`
  - Line 94 (inline `<Image src=...>`): `/images/blog/recipe-editor.webp`
- **`src/pages/Blog/posts/akli-ui-storybook.mdx`** (slug `akli-ui-storybook`) — 3 references:
  - Line 6 (frontmatter): `image: /images/blog/storybook-button-docs.webp`
  - Line 9 (inline `<Image src=...>`): `/images/blog/storybook-button-docs.webp`
  - Line 27 (inline `<Image src=...>`): `/images/blog/storybook-header-public-variant.webp`

Six distinct image files in total, each replaced with its post-nested absolute URL:

| File | New URL |
|---|---|
| `pokedex-desktop.webp` | `https://images.akli.dev/blog/building-a-pokedex/pokedex-desktop.webp` |
| `pokedex-mobile.webp` | `https://images.akli.dev/blog/building-a-pokedex/pokedex-mobile.webp` |
| `recipes.webp` | `https://images.akli.dev/blog/from-draft-to-published-recipe/recipes.webp` |
| `recipe-editor.webp` | `https://images.akli.dev/blog/from-draft-to-published-recipe/recipe-editor.webp` |
| `storybook-button-docs.webp` | `https://images.akli.dev/blog/akli-ui-storybook/storybook-button-docs.webp` |
| `storybook-header-public-variant.webp` | `https://images.akli.dev/blog/akli-ui-storybook/storybook-header-public-variant.webp` |

Each frontmatter `image:` value flows into `buildMetaTags(...)` for OG/Twitter meta — works correctly because phase 1's `buildMetaTags` fix (absolute-URL passthrough) is already merged, see banner at top of this PRD.

Two test files also need updating:

- **`src/meta.test.ts`**:
  - Line 12 (mock frontmatter `image:` fixture) — change to `'https://images.akli.dev/blog/test-post/test-post-cover.webp'` (nested to match production shape; extension changed to `.webp` for fidelity).
  - Lines 309 + 315 (assertions on `og.image` / `twitter.image`) — change expected to the new absolute URL (NOT `https://akli.devhttps://...` — relies on phase 1's `buildMetaTags` fix to produce a clean URL).
- **`src/entry-server.test.tsx:120`** — assertion `expect(html).toContain('/images/blog/pokedex-desktop.webp')` updated to `expect(html).toContain('https://images.akli.dev/blog/building-a-pokedex/pokedex-desktop.webp')`.

No other surfaces are affected:
- No `BlogCard` / `BlogPost` / blog-list component constructs blog image URLs.
- Sitemap (`sitemap-plugin.ts`) doesn't reference image URLs.
- No RSS feed exists in this project.
- `vite-imagetools` is not used for blog images.

### Deploy workflow `--delete` behavior

`.github/workflows/deploy.yml:45` (updated 2026-09 — the PRD-time command had `--exclude` flags for `apps/sand-box/*`/`apps/pokedex/*` and read the bucket name from `secrets.S3_BUCKET_NAME`; both apps moved to their own buckets/deploy roles since, via the akli-infrastructure per-app-buckets-and-OIDC migration, so the excludes are gone and the bucket name is now a non-sensitive repo variable):
```bash
aws s3 sync ./dist/client s3://${{ vars.AWS_S3_BUCKET_NAME }} --delete
```

`--delete` removes any S3 key not present in `dist/client/`. After this PRD's deploy, `dist/client/blog/<post-slug>/*.webp` exists (from `public/blog/<post-slug>/`), and `dist/client/images/blog/` does NOT exist (the source moved). So `--delete` will remove the old `images/blog/*.webp` keys from S3.

This is **exactly what we want** per the sibling PRD's "no redirects, accept-breakage" decision. No `--exclude` clause is needed for `images/blog/*`.

### Dependency on phase 1's `buildMetaTags` fix — already satisfied

Phase 1 personal-website PRD specified a fix to `buildMetaTags` that conditionally skips the `BASE_URL` prefix when the image URL is already absolute. Without that fix, the OG meta-tag URL for a blog post would become `https://akli.devhttps://images.akli.dev/blog/pokedex-desktop.webp` (broken).

**Status (2026-09, PRD refresh): confirmed merged.** `src/meta.ts:91-92` reads `image.startsWith('http') ? image : \`${BASE_URL}${image}\`` — this PRD's inputs (absolute `images.akli.dev` URLs) are already handled correctly. The scenario analysis below described the risk at PRD-writing time; it's resolved, kept for context.

- **Phase 1 had shipped before this PRD's PR opens** — confirmed: this is the actual outcome. `buildMetaTags` already handles absolute URLs; this PRD just changes the inputs.

### Lockstep deploy ordering

```
1. akli-infrastructure phase 2 deploys
   - images.akli.dev gains blog/* behavior pointing at site bucket
   - Site bucket policy gains second statement
   - Verify: curl https://images.akli.dev/blog/anything.webp → 404 NoSuchKey

2. personal-website phase 2 deploys (THIS PRD)
   - public/images/blog/* → public/blog/<post-slug>/* (all 6 images, nested by owning post)
   - building-a-pokedex.mdx, from-draft-to-published-recipe.mdx, akli-ui-storybook.mdx updated (3 refs each, 9 total)
   - Tests updated
   - Vite build + s3 sync --delete removes old keys, uploads new keys

3. Verify: visit all three blog posts on akli.dev
   - Cover + inline images load from images.akli.dev/blog/...
   - DevTools network panel confirms 200 + image/webp responses
```

If reversed (this PRD ships before infra phase 2): MDX references `images.akli.dev/blog/...` URLs but the route doesn't exist → all blog images across all three posts broken. Sequence carefully.

### Test maintenance (Update mode, not Write mode)

Per project convention (Vitest + Testing Library). The migration is purely path/URL string changes — no new behaviour to test beyond what's already covered. Existing tests (`meta.test.ts`, `entry-server.test.tsx`) are updated in **Update mode** (not Write mode). TDD-first stub-and-fail ceremony is not meaningful for mechanical find-replace; the implementer makes the source change and updates the matching test assertion in the same change.

The `--delete` cleanup verification is a manual / runbook check, not a unit test (post-deploy AWS state). A pre-deploy proxy is included as an automated build-output assertion (see ACs).

### Latent footgun (out of scope, flagged for future)

`src/components/Image/Image.tsx`'s `placeholder='blur'` path uses `generateBlurDataURL(src)` which appends a `vite-imagetools`-style query string (`?w=10&h=10&blur=10&q=1`) to the image URL. That works for site assets processed by `vite-imagetools`; it's meaningless on the CDN (CloudFront ignores the query for cache key purposes only because the policy is query-string-aware — but the bytes returned are unchanged regardless of query). Today no blog image uses `placeholder='blur'`, so this isn't exercised. If a future blog post opts into blur placeholders, the blur generation will silently no-op. Flag only — out of scope for this migration.

### ESLint / formatting

Per CLAUDE.md, run `pnpm exec eslint --fix` on changed `.ts(x)` files. MDX files don't need linting (no ESLint config for `.mdx` in this project).

## Acceptance Criteria

ACs split into Automated (TDD-able with `pnpm test` / `pnpm lint` before deploy) and Manual (post-deploy verification, runbook).

### Automated — File move

- [ ] None of the six source images remain under `public/images/blog/`: `pokedex-desktop.webp`, `pokedex-mobile.webp`, `recipes.webp`, `recipe-editor.webp`, `storybook-button-docs.webp`, `storybook-header-public-variant.webp`.
- [ ] Each of the six exists under its post-slug subdirectory in `public/blog/` — `public/blog/building-a-pokedex/pokedex-desktop.webp`, `public/blog/building-a-pokedex/pokedex-mobile.webp`, `public/blog/from-draft-to-published-recipe/recipes.webp`, `public/blog/from-draft-to-published-recipe/recipe-editor.webp`, `public/blog/akli-ui-storybook/storybook-button-docs.webp`, `public/blog/akli-ui-storybook/storybook-header-public-variant.webp` — with byte content identical to the original (verify with `diff` against a pre-move snapshot or `sha256sum`).
- [ ] `public/images/blog/` directory is removed.
- [ ] `public/images/` directory is removed if it has no remaining contents after the move (re-verify at implementation time that `blog/` is still the only subdirectory; if so, `ls public/images/` after removing `blog/` should return an empty listing, in which case `rmdir public/images/`).

### Automated — MDX post updates

- [ ] **`building-a-pokedex.mdx`**: frontmatter `image:` and both inline `<Image src=...>` references use `https://images.akli.dev/blog/building-a-pokedex/pokedex-desktop.webp` and `https://images.akli.dev/blog/building-a-pokedex/pokedex-mobile.webp` respectively.
- [ ] **`from-draft-to-published-recipe.mdx`**: frontmatter `image:` and both inline `<Image src=...>` references use `https://images.akli.dev/blog/from-draft-to-published-recipe/recipes.webp` and `https://images.akli.dev/blog/from-draft-to-published-recipe/recipe-editor.webp` respectively.
- [ ] **`akli-ui-storybook.mdx`**: frontmatter `image:` and both inline `<Image src=...>` references use `https://images.akli.dev/blog/akli-ui-storybook/storybook-button-docs.webp` and `https://images.akli.dev/blog/akli-ui-storybook/storybook-header-public-variant.webp` respectively.
- [ ] No remaining `/images/blog/` references in any of the three MDX files (`grep -rc '/images/blog/' src/pages/Blog/posts/*.mdx` returns 0 for each).
- [ ] No MDX post other than these three references `images/blog/` (re-verify at implementation time in case a new post landed since this refresh — same check the original PRD ran, now against three known files instead of one).
- [ ] Each post's images live under a subdirectory matching its own slug — no post's images reference another post's slug directory (catches copy-paste mistakes across the three near-identical find-replace edits).

### Automated — Test updates

- [ ] `src/meta.test.ts` mock blog-post frontmatter `image:` field is changed from `/images/blog/test-post-cover.jpg` to `https://images.akli.dev/blog/test-post/test-post-cover.webp` (absolute, nested to match production shape; extension also updated to `.webp` for fidelity).
- [ ] `src/meta.test.ts` blog-branch assertion on `meta.og.image` is updated to expect the full absolute URL `https://images.akli.dev/blog/test-post/test-post-cover.webp` (NOT `https://akli.devhttps://...` — this assertion fails without phase 1's `buildMetaTags` fix, acting as the canary).
- [ ] `src/meta.test.ts` blog-branch assertion on `meta.twitter.image` is updated equivalently.
- [ ] `src/entry-server.test.tsx` blog-branch assertion is updated to `expect(html).toContain('https://images.akli.dev/blog/building-a-pokedex/pokedex-desktop.webp')`.
- [ ] `src/entry-server.test.tsx` gains a NEW assertion for the inline mobile image: `expect(html).toContain('https://images.akli.dev/blog/building-a-pokedex/pokedex-mobile.webp')` (current tests only cover the cover; this PR is a good moment to close the inline-image coverage gap).
- [ ] All updated test files pass `pnpm exec vitest run`.

### Automated — Quality gates

- [ ] `pnpm test` passes (all suites green).
- [ ] `pnpm lint` passes.
- [ ] `pnpm exec tsc --noEmit` produces no NEW errors. Pre-PRD baseline (recorded at PRD time): the existing errors are `mdast` module resolution in `plugins/`, `AuthContext` null-typing errors, `Recipe.status` string-vs-union mismatches in `entry-server.test.tsx` and `meta.test.ts`. The error count after this PR's changes equals the baseline count.
- [ ] `pnpm build` succeeds.
- [ ] **Build-output check (deploy-state proxy):** `dist/client/blog/building-a-pokedex/pokedex-desktop.webp` and `dist/client/blog/building-a-pokedex/pokedex-mobile.webp` exist after `pnpm build`. `dist/client/images/blog/` does NOT exist after `pnpm build`. (This proves Vite's `public/` copy preserved the nested directory structure and that `aws s3 sync --delete` will drop the old keys post-deploy.)

### PR review checklist (manual review during PR, not enforced by tests)

- [ ] `grep -rn 'images/blog' src/ public/` returns zero matches (catches both `/images/blog/` and `images/blog/` patterns; `public/blog/` should be the only blog-images directory after the move).
- [ ] No MDX post other than the three listed in Technical Considerations references `images/blog/` (re-verify in case a new post landed during the in-flight period).
- [ ] Phase 1 `buildMetaTags` fix is confirmed present on `main` (already merged as of this PRD's refresh — `src/meta.ts:91-92` contains `image.startsWith('http') ?`; re-confirm it hasn't regressed before merging).
- [ ] `.github/workflows/deploy.yml` `aws s3 sync` invocation does NOT have `--exclude "images/blog/*"` or `--exclude "images/*"` added between PRD time and merge (sanity check against an unrelated workflow change that would prevent old-key deletion).

### Manual — Lockstep verification (post-deploy of sibling, before this PR ships)

- [ ] Sibling akli-infrastructure phase 2 PRD has shipped: `curl -I https://images.akli.dev/blog/any-slug/anything-not-yet-uploaded.webp` returns `HTTP/2 404` with S3 NoSuchKey body (proves the route + OAC + bucket policy are functional for nested paths too, not just flat ones).
- [ ] Existing `akli.dev/images/blog/<file>.webp` URLs still return 200 (regression baseline before the cutover).

### Manual — End-to-end verification (post-deploy of THIS PR)

- [ ] After this PR's deploy completes, each of the six images returns `HTTP/2 200`, `content-type: image/webp` at its nested URL: `curl -I https://images.akli.dev/blog/building-a-pokedex/pokedex-desktop.webp` (and the equivalent for the other five).
- [ ] After this PR's deploy completes, the old `https://akli.dev/images/blog/<file>` URL for each of the six returns 404 (confirms `--delete` removed the old keys; this is the agreed-upon broken-link outcome from the no-redirects decision).
- [ ] Visit each of the three blog posts (`/blog/building-a-pokedex`, `/blog/from-draft-to-published-recipe`, `/blog/akli-ui-storybook`) in a browser — all images load correctly. DevTools network panel shows requests to `images.akli.dev/blog/...` returning 200 with `image/webp`.
- [ ] No requests to `akli.dev/images/blog/...` in the network tab when viewing any of the three posts (regression guard against any missed reference).
- [ ] OG meta tag spot check on each of the three posts: `curl https://akli.dev/blog/<slug>` and grep for `og:image` — value equals the post's `https://images.akli.dev/blog/<cover-file>` (verifies the `buildMetaTags` fix produces a clean URL, not double-prefixed).
- [ ] Social-share preview check: paste one of the three post URLs into Twitter/Slack/Discord — preview card renders the cover image (one-time spot check; cached previews from before the cutover may need to be re-scraped).

### Documentation

- [ ] `CLAUDE.md` "Conventions" bullet that currently reads "Blog post images live in `public/images/blog/` — referenced by URL string in MDX, served as-is, no Vite processing. Optimise manually before adding." is updated to: "Blog post images live in `public/blog/<post-slug>/` (nested by the post's slug, matching the `recipes/<id>/` CDN convention) and are served from `https://images.akli.dev/blog/<post-slug>/<file>` — referenced by absolute URL in MDX, served as-is, no Vite processing. Optimise manually before adding."
- [ ] No accessibility regression check needed (alt text is unchanged; image bytes are unchanged).

## Open Questions

All resolved during PRD review:

- **`public/images/` directory after the move** → resolved to **delete if empty**. Verified at PRD time that `blog/` is the only subdirectory; after moving it, `public/images/` will be empty and should be removed. AC made deterministic.
- **Test fixture extension** → resolved to **`.webp`** (matching production blog image format). ACs updated accordingly.

No remaining open questions for phase 2.

### 2026-09 refresh note

This PRD sat unimplemented long enough that the codebase moved under it. Re-verified against current `main` and updated: scope expanded from 1 to 3 MDX posts / 6 images (two posts shipped after this PRD was written), phase 1's `buildMetaTags` dependency is now confirmed merged, and the quoted `deploy.yml` command was updated to match its current form. No design decisions changed — same URL scheme, same file-move approach, same no-redirects trade-off. Re-verify the MDX file list again at implementation time in case further posts have shipped since this refresh.

### 2026-09 second refresh note — nested path structure

Changed the S3 key / URL scheme from flat (`blog/<file>.webp`) to per-post-nested (`blog/<post-slug>/<file>.webp`) before implementation started — no PR had opened yet, so no live migration cost. Reason: flat naming was inconsistent with the already-shipped `recipes/<id>/<file>.webp` convention, forced manual collision-avoidance in filenames, and made per-post cleanup impossible without tracking which loose files belonged to which post. No infra-side change needed — the sibling akli-infrastructure PRD's `blog/*` CloudFront path pattern already matches nested paths. See "Image organization: nested by post slug" in Technical Considerations for full rationale. GitHub issues #440 and #443 (personal-website) were updated to match.
