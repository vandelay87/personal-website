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
>
> **Scope note (2026-09, third update):** responsive image sizing (thumb/medium/full variants, `srcSet`) already landed in [PR #445](https://github.com/vandelay87/personal-website/pull/445), deliberately kept on the *current* live `/images/blog/` path since this PRD's CDN domain isn't deployed yet. Each of the six images is now three files (`<file>-thumb.webp`, `<file>-medium.webp`, `<file>-full.webp`), not one — see "Responsive sizing already landed" in Technical Considerations. This PRD's remaining scope is narrower than originally written: move the 18 already-sized files into `public/blog/<post-slug>/` and switch the already-wired `src`/`srcSet` URLs to the `images.akli.dev` domain. No new resizing, no new MDX authoring.

## Overview

Move blog image files from `public/images/blog/` to `public/blog/<post-slug>/` — nested by the owning post's slug, not flat — so they deploy to S3 key `blog/<post-slug>/<file>` (the sibling PRD's `blog/*` CloudFront behavior already matches nested paths, so no infra change is needed for this). Update every reference across the codebase from `/images/blog/<file>` → `https://images.akli.dev/blog/<post-slug>/<file>`. After this ships, `images.akli.dev` is the single canonical surface for every image on akli.dev.

**Design note (2026-09):** this PRD originally specified a flat `blog/<file>` namespace. Changed to per-post nesting before implementation started — see "Image organization: nested by post slug" in Technical Considerations for why. Separately, each logical image is now three sized files, not one — see "Responsive sizing already landed" below.

## Problem Statement

Phase 1 of the images-CDN epic switched recipe images to `images.akli.dev`. Blog images still live at `akli.dev/images/blog/<file>` served from the site bucket via the existing `images/*` behavior. The unified images CDN is half-complete. Phase 2 finishes it: blog images need to move keys (in S3) and URLs (in MDX + meta) to live alongside recipes on `images.akli.dev`.

The migration touches a small surface — three MDX posts reference blog images today (`building-a-pokedex.mdx`, plus `from-draft-to-published-recipe.mdx` and `akli-ui-storybook.mdx`, both shipped after this PRD was originally written — see Technical Considerations), each already wired with `src`/`srcSet` for sized variants by PR #445, plus one test assertion — so the remaining implementation (move 18 files, switch a domain in already-existing URLs) is even more mechanical than originally scoped. The bigger concern is still sequencing: this PRD must ship after the akli-infrastructure phase 2 deploy, otherwise MDX references point at a route that doesn't exist yet.

## Goals

- Every blog-image reference in the codebase (already sized `-thumb`/`-medium`/`-full` variants, per PR #445) points at `https://images.akli.dev/blog/<post-slug>/<file>-<size>.webp` after this ships.
- Blog image files live at `public/blog/<post-slug>/<file>-<size>.webp` (Vite deploys them to matching S3 keys).
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
- /images/blog/pokedex-desktop-full.webp
+ https://images.akli.dev/blog/building-a-pokedex/pokedex-desktop-full.webp
```

Applied to all three sized variants of all six images (18 URLs total). The `blog/` prefix is always followed by the owning post's slug — see "Image organization: nested by post slug" below. Filenames (including the `-thumb`/`-medium`/`-full` suffix) are unchanged from PR #445 — only the domain and directory move.

### File move

18 files (six images × three sizes each — see "Responsive sizing already landed" in Technical Considerations), e.g.:

```diff
- public/images/blog/pokedex-desktop-thumb.webp
- public/images/blog/pokedex-desktop-medium.webp
- public/images/blog/pokedex-desktop-full.webp
+ public/blog/building-a-pokedex/pokedex-desktop-thumb.webp
+ public/blog/building-a-pokedex/pokedex-desktop-medium.webp
+ public/blog/building-a-pokedex/pokedex-desktop-full.webp
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

### Responsive sizing already landed (PR #445) — changes the file inventory below

**Landed 2026-09, before this migration.** Each of the six blog images now exists as three sized variants — `<file>-thumb.webp` (400w, q80), `<file>-medium.webp` (800w, q85), `<file>-full.webp` (1200w, q90) — matching the size/quality scheme the recipe `ImageResizer` Lambda uses, generated by `scripts/resize-blog-images.ts` (sharp-based, guards against upscaling narrower sources via `withoutEnlargement`, which the Lambda it mirrors doesn't). The original single-file-per-image (`pokedex-desktop.webp`, etc.) no longer exists — it was replaced, not kept alongside the variants.

Every MDX `<Image>` already carries `src`/`srcSet` pointing at two of the three variants (`medium`+`full` for full-width images, `thumb`+`medium` for the one image explicitly capped at 400px display width) — the same pattern `RecipeDetailView` uses for its hero image. Frontmatter `image:` (used for OG/Twitter meta) points at the `-full` variant.

**This was deliberately kept on the current live `/images/blog/` path**, not this PRD's `images.akli.dev` domain — switching domains before the sibling akli-infrastructure PRD deploys would have 404'd immediately. That means this PRD's actual remaining work is: move the 18 already-sized files into their post-slug subdirectories, and update the `src`/`srcSet` URLs already wired in MDX from `/images/blog/<file>-<size>.webp` to `https://images.akli.dev/blog/<post-slug>/<file>-<size>.webp`. No resizing, no new `<Image>` props, no new test coverage — those are all already done.

### Mechanical find-replace surface

**Three MDX files** reference blog images today, each already updated by PR #445 to reference sized variants with `src`/`srcSet` (re-verify this list at implementation time in case more posts landed since):

- **`src/pages/Blog/posts/building-a-pokedex.mdx`** (slug `building-a-pokedex`) — frontmatter `image:` (→ `-full`) + two inline `<Image>` tags (cover: `medium`+`full` srcSet; mobile screenshot, capped at 400px: `thumb`+`medium` srcSet).
- **`src/pages/Blog/posts/from-draft-to-published-recipe.mdx`** (slug `from-draft-to-published-recipe`) — frontmatter `image:` (→ `-full`) + two inline `<Image>` tags, both `medium`+`full` srcSet.
- **`src/pages/Blog/posts/akli-ui-storybook.mdx`** (slug `akli-ui-storybook`) — frontmatter `image:` (→ `-full`) + two inline `<Image>` tags, both `medium`+`full` srcSet.

Six logical images, eighteen actual files (three sized variants each), each variant replaced with its post-nested absolute URL — domain and directory change only, filenames unchanged:

| Current (`/images/blog/`) | New (`https://images.akli.dev/blog/<post-slug>/`) |
|---|---|
| `pokedex-desktop-thumb.webp` / `-medium.webp` / `-full.webp` | `building-a-pokedex/pokedex-desktop-{thumb,medium,full}.webp` |
| `pokedex-mobile-thumb.webp` / `-medium.webp` / `-full.webp` | `building-a-pokedex/pokedex-mobile-{thumb,medium,full}.webp` |
| `recipes-thumb.webp` / `-medium.webp` / `-full.webp` | `from-draft-to-published-recipe/recipes-{thumb,medium,full}.webp` |
| `recipe-editor-thumb.webp` / `-medium.webp` / `-full.webp` | `from-draft-to-published-recipe/recipe-editor-{thumb,medium,full}.webp` |
| `storybook-button-docs-thumb.webp` / `-medium.webp` / `-full.webp` | `akli-ui-storybook/storybook-button-docs-{thumb,medium,full}.webp` |
| `storybook-header-public-variant-thumb.webp` / `-medium.webp` / `-full.webp` | `akli-ui-storybook/storybook-header-public-variant-{thumb,medium,full}.webp` |

Each frontmatter `image:` value (pointing at the `-full` variant) flows into `buildMetaTags(...)` for OG/Twitter meta — works correctly because phase 1's `buildMetaTags` fix (absolute-URL passthrough) is already merged, see banner at top of this PRD.

One test file needs updating as part of THIS PRD's remaining scope:

- **`src/entry-server.test.tsx`** — already updated by PR #445 to assert `expect(html).toContain('/images/blog/pokedex-desktop-full.webp')`. This migration only needs to switch that to the full CDN URL: `expect(html).toContain('https://images.akli.dev/blog/building-a-pokedex/pokedex-desktop-full.webp')`.

`src/meta.test.ts` uses a fictional mock fixture (`test-post-cover.jpg`/`.webp`) unrelated to the real filenames above — it was already updated by an earlier refresh of this PRD (nested, absolute form) and needs no further change here.

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
   - public/images/blog/*-{thumb,medium,full}.webp → public/blog/<post-slug>/*-{thumb,medium,full}.webp (18 files, nested by owning post — already sized by PR #445, this step only moves+renames the directory)
   - building-a-pokedex.mdx, from-draft-to-published-recipe.mdx, akli-ui-storybook.mdx: existing src/srcSet URLs switched to the images.akli.dev domain (no new refs, no new sizes — both already landed in PR #445)
   - entry-server.test.tsx assertion switched to the new domain
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

- [ ] None of the 18 sized-variant images (`<file>-thumb.webp`, `<file>-medium.webp`, `<file>-full.webp` for each of the six logical images) remain under `public/images/blog/`.
- [ ] Each of the 18 exists under its post-slug subdirectory in `public/blog/` (e.g. `public/blog/building-a-pokedex/pokedex-desktop-thumb.webp`, `-medium.webp`, `-full.webp`, and the equivalent five sets for the other two posts) — with byte content identical to the pre-move file (verify with `diff` or `sha256sum`).
- [ ] `public/images/blog/` directory is removed.
- [ ] `public/images/` directory is removed if it has no remaining contents after the move.

### Automated — MDX post updates

Each of the three posts already has `src`/`srcSet` pointing at sized variants (PR #445) — this migration only changes the domain/directory those URLs resolve to, not which variants are referenced or which `<Image>` props are set.

- [ ] **`building-a-pokedex.mdx`**: frontmatter `image:` and both inline `<Image>` tags' `src`/`srcSet` URLs point at `https://images.akli.dev/blog/building-a-pokedex/...` (same filenames as today, domain/path changed only).
- [ ] **`from-draft-to-published-recipe.mdx`**: same, pointing at `https://images.akli.dev/blog/from-draft-to-published-recipe/...`.
- [ ] **`akli-ui-storybook.mdx`**: same, pointing at `https://images.akli.dev/blog/akli-ui-storybook/...`.
- [ ] No remaining `/images/blog/` references in any of the three MDX files (`grep -rc '/images/blog/' src/pages/Blog/posts/*.mdx` returns 0 for each).
- [ ] No MDX post other than these three references `images/blog/` (re-verify at implementation time in case a new post landed since this refresh).
- [ ] Each post's images live under a subdirectory matching its own slug — no post's images reference another post's slug directory.

### Automated — Test updates

- [ ] `src/entry-server.test.tsx` assertion is switched from `expect(html).toContain('/images/blog/pokedex-desktop-full.webp')` (PR #445's already-landed form) to `expect(html).toContain('https://images.akli.dev/blog/building-a-pokedex/pokedex-desktop-full.webp')`.
- [ ] `src/meta.test.ts` needs no further change — its mock fixture is fictional and was already updated to the nested absolute form in an earlier refresh of this PRD.
- [ ] All updated test files pass `pnpm exec vitest run`.

### Automated — Quality gates

- [ ] `pnpm test` passes (all suites green — 790 tests as of PR #445's baseline).
- [ ] `pnpm lint` passes.
- [ ] `pnpm exec tsc --noEmit` produces no new errors.
- [ ] `pnpm build:client` succeeds (verify against a machine with Playwright browsers installed for `rehype-mermaid` — this fails in any environment missing them, unrelated to this PRD; see PR #445's test plan).
- [ ] **Build-output check (deploy-state proxy):** `dist/client/blog/building-a-pokedex/pokedex-desktop-full.webp` (and the other 17 sized variants) exist after build. `dist/client/images/blog/` does NOT exist. (Proves Vite's `public/` copy preserved the nested directory structure and that `aws s3 sync --delete` will drop the old keys post-deploy.)

### PR review checklist (manual review during PR, not enforced by tests)

- [ ] `grep -rn 'images/blog' src/ public/` returns zero matches.
- [ ] No MDX post other than the three listed in Technical Considerations references `images/blog/`.
- [ ] Phase 1 `buildMetaTags` fix is confirmed present on `main` (already merged; `src/meta.ts:91-92` contains `image.startsWith('http') ?`).
- [ ] `.github/workflows/deploy.yml`'s `aws s3 sync` invocation does NOT have `--exclude "images/blog/*"` or `--exclude "images/*"` added.

### Manual — Lockstep verification (post-deploy of sibling, before this PR ships)

- [ ] Sibling akli-infrastructure phase 2 PRD has shipped: `curl -I https://images.akli.dev/blog/any-slug/anything-not-yet-uploaded.webp` returns `HTTP/2 404` with S3 NoSuchKey body.
- [ ] Existing `akli.dev/images/blog/<file>-<size>.webp` URLs still return 200 (regression baseline before the cutover).

### Manual — End-to-end verification (post-deploy of THIS PR)

- [ ] After this PR's deploy completes, all 18 sized-variant URLs return `HTTP/2 200`, `content-type: image/webp` (e.g. `curl -I https://images.akli.dev/blog/building-a-pokedex/pokedex-desktop-full.webp`, and the equivalent for every other file).
- [ ] After this PR's deploy completes, the old `https://akli.dev/images/blog/<file>-<size>.webp` URL for each of the 18 returns 404 (confirms `--delete` removed the old keys).
- [ ] Visit each of the three blog posts (`/blog/building-a-pokedex`, `/blog/from-draft-to-published-recipe`, `/blog/akli-ui-storybook`) in a browser — all images load correctly. DevTools network panel shows requests to `images.akli.dev/blog/...` returning 200 with `image/webp`, and the requested variant (`-medium`/`-full`/`-thumb`) matches what the browser's `srcSet` selection would be expected to pick for the viewport/DPR in use (unchanged behavior from PR #445 — only the domain moved).
- [ ] No requests to `akli.dev/images/blog/...` in the network tab when viewing any of the three posts (regression guard against any missed reference).
- [ ] OG meta tag spot check on each of the three posts: `curl https://akli.dev/blog/<slug>` and grep for `og:image` — value equals the post's `https://images.akli.dev/blog/<cover-file>` (verifies the `buildMetaTags` fix produces a clean URL, not double-prefixed).
- [ ] Social-share preview check: paste one of the three post URLs into Twitter/Slack/Discord — preview card renders the cover image (one-time spot check; cached previews from before the cutover may need to be re-scraped).

### Documentation

- [ ] `CLAUDE.md` "Conventions" bullet updated to describe the full current state: images live in `public/blog/<post-slug>/` (nested by slug, matching the `recipes/<id>/` convention), each as `-thumb`/`-medium`/`-full` sized variants generated by `scripts/resize-blog-images.ts`, referenced via `src`/`srcSet` on `<Image>`, served from `https://images.akli.dev/blog/<post-slug>/<file>-<size>.webp`.
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

### 2026-09 third refresh note — responsive sizing landed ahead of the migration

[PR #445](https://github.com/vandelay87/personal-website/pull/445) (the same PR carrying this PRD's own doc updates) implemented responsive image sizing for all six blog images — `-thumb`/`-medium`/`-full` webp variants matching the recipe `ImageResizer` Lambda's scheme, generated by the new `scripts/resize-blog-images.ts`, wired into MDX via `src`/`srcSet`. This was **not** originally part of this PRD's scope (which only ever covered the path/domain migration) — it was done proactively, deliberately kept on the current live `/images/blog/` path rather than the not-yet-deployed CDN domain, so it shipped safely without depending on the sibling PRD.

Effect on this PRD: every "one file per image" assumption throughout (Goals, Design & UX, Technical Considerations, Acceptance Criteria) has been updated to "three sized files per image, only the domain/directory changes." No new design work, no new resizing, no new `<Image>` props needed at migration time — that's all already done. GitHub issues #439, #440, #442, and #443 (personal-website) were updated to match; see each issue for its reduced remaining scope.
