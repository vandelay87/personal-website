# PRD: Images CDN — Phase 2 (Blog Migration to `images.akli.dev`)

> **Sibling PRD:** [`akli-infrastructure/docs/prds/images-cdn-phase-2.md`](../../../akli-infrastructure/docs/prds/images-cdn-phase-2.md) — adds the site bucket as a second origin on `images.akli.dev` under `blog/*`. **Must deploy before this PRD ships.**
>
> **Hard dependency on:** [`images-cdn-phase-1.md`](./images-cdn-phase-1.md). That PRD adds the `buildMetaTags` fix to handle absolute image URLs (skip the unconditional `${BASE_URL}${image}` prefix when `image` already starts with `http`).
>
> **Merge blocker — verified at PRD time:** `src/meta.ts:90` on `main` today reads `const fullImage = image ? \`${BASE_URL}${image}\` : undefined` — unconditional prefix. The phase 1 fix is NOT yet on `main`. If this PRD's PR is merged before phase 1's fix lands, blog OG meta tags will produce `https://akli.devhttps://images.akli.dev/blog/...` (broken). **Phase 1 must merge first; this is non-negotiable.**
>
> **Epic context:** PRD 4 of 4 — the final piece of the unified images CDN epic.
> 1. `akli-infrastructure` phase 1 (done) — subdomain + recipe-images origin.
> 2. `personal-website` phase 1 (done) — frontend cutover for recipe URLs.
> 3. `akli-infrastructure` phase 2 (sibling above) — blog origin under same subdomain.
> 4. **THIS PRD** — `personal-website` phase 2: move blog images to `public/blog/`, update MDX/test references to `images.akli.dev/blog/*`.

## Overview

Move blog image files from `public/images/blog/` to `public/blog/` so they deploy to S3 key `blog/<file>` (matching the new URL → S3 key 1:1 mapping that phase 2 infra wires up). Update every reference across the codebase from `/images/blog/<file>` → `https://images.akli.dev/blog/<file>`. After this ships, `images.akli.dev` is the single canonical surface for every image on akli.dev.

## Problem Statement

Phase 1 of the images-CDN epic switched recipe images to `images.akli.dev`. Blog images still live at `akli.dev/images/blog/<file>` served from the site bucket via the existing `images/*` behavior. The unified images CDN is half-complete. Phase 2 finishes it: blog images need to move keys (in S3) and URLs (in MDX + meta) to live alongside recipes on `images.akli.dev`.

The migration touches a small surface (only one MDX post has blog images today — `building-a-pokedex.mdx` — plus two test files), so the implementation is mechanical. The bigger concern is sequencing: this PRD must ship after the akli-infrastructure phase 2 deploy, otherwise MDX references point at a route that doesn't exist yet.

## Goals

- Every blog-image reference in the codebase points at `https://images.akli.dev/blog/<file>.webp` after this ships.
- Blog image files live at `public/blog/<file>.webp` (Vite deploys them to S3 key `blog/<file>.webp`).
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
- **As a future blog post author**, I want the URL pattern for new blog images to follow `https://images.akli.dev/blog/<file>.webp` so the convention is consistent and obvious from the existing post.
- **As future-me** maintaining the codebase, I want a single mental model — every image on the site is at `images.akli.dev/<namespace>/<file>` — so I don't have to remember where each kind of image lives.

## Design & UX

Backend / build / deploy only. No UI changes — readers don't see anything different (same images, same layout, same loading behaviour). What changes is the URL the `<img>` tag points at.

### URL pattern transform

```diff
- /images/blog/pokedex-desktop.webp
+ https://images.akli.dev/blog/pokedex-desktop.webp
```

Applied wherever blog images are referenced.

### File move

```diff
- public/images/blog/pokedex-desktop.webp
- public/images/blog/pokedex-mobile.webp
+ public/blog/pokedex-desktop.webp
+ public/blog/pokedex-mobile.webp
```

After Vite build, files end up at S3 keys `blog/pokedex-desktop.webp` and `blog/pokedex-mobile.webp` in the site bucket. The sibling PRD's `images.akli.dev/blog/*` behavior serves them with no path rewrite.

### Why absolute URLs in MDX

Two reasons we use `https://images.akli.dev/blog/...` (absolute) rather than `/blog/...` (relative):

1. **The new files live on a different subdomain.** A relative path `/blog/foo.webp` would be interpreted by the browser as `akli.dev/blog/foo.webp` — wrong domain. The browser doesn't know to cross subdomains for an image reference.
2. **`/blog/<slug>` is already the SPA route for blog posts.** A relative `/blog/foo.webp` would conflict with React Router's catch-all in confusing ways and depend on CloudFront's behavior precedence ordering. Absolute URLs sidestep the ambiguity entirely.

### States — unchanged

Same loading, error, success states as before. Same `<Image>` component, same OG card structure. Only the URL string changes.

## Technical Considerations

### Mechanical find-replace surface

Only **one MDX file** today references blog images:

- **`src/pages/Blog/posts/building-a-pokedex.mdx`** — 3 references:
  - Line 6 (frontmatter): `image: /images/blog/pokedex-desktop.webp`
  - Line 9 (inline `<Image src=...>`): `/images/blog/pokedex-desktop.webp`
  - Line 213 (inline `<Image src=...>`): `/images/blog/pokedex-mobile.webp`

Replace each with the absolute `https://images.akli.dev/blog/<file>` form. The frontmatter `image:` value flows into `buildMetaTags(...)` for OG/Twitter meta — works correctly only after phase 1's `buildMetaTags` fix is in place.

Two test files also need updating:

- **`src/meta.test.ts`**:
  - Line 12 (mock frontmatter `image:` fixture) — change to `'https://images.akli.dev/blog/test-post-cover.jpg'` (or `.webp` to be consistent).
  - Lines 309 + 315 (assertions on `og.image` / `twitter.image`) — change expected to the new absolute URL (NOT `https://akli.devhttps://...` — relies on phase 1's `buildMetaTags` fix to produce a clean URL).
- **`src/entry-server.test.tsx:120`** — assertion `expect(html).toContain('/images/blog/pokedex-desktop.webp')` updated to `expect(html).toContain('https://images.akli.dev/blog/pokedex-desktop.webp')`.

No other surfaces are affected:
- No `BlogCard` / `BlogPost` / blog-list component constructs blog image URLs.
- Sitemap (`sitemap-plugin.ts`) doesn't reference image URLs.
- No RSS feed exists in this project.
- `vite-imagetools` is not used for blog images.

### Deploy workflow `--delete` behavior

`.github/workflows/deploy.yml:43`:
```bash
aws s3 sync ./dist/client s3://${{ secrets.S3_BUCKET_NAME }} --delete --exclude "apps/sand-box/*" --exclude "apps/pokedex/*"
```

`--delete` removes any S3 key not present in `dist/client/`. After this PRD's deploy, `dist/client/blog/*.webp` exists (from `public/blog/`), and `dist/client/images/blog/` does NOT exist (the source moved). So `--delete` will remove the old `images/blog/*.webp` keys from S3.

This is **exactly what we want** per the sibling PRD's "no redirects, accept-breakage" decision. No `--exclude` clause is needed for `images/blog/*`.

### Hard dependency on phase 1's `buildMetaTags` fix

Phase 1 personal-website PRD specifies a fix to `buildMetaTags` (`src/meta.ts:90`) that conditionally skips the `BASE_URL` prefix when the image URL is already absolute. Without that fix, the OG meta-tag URL for the blog post becomes `https://akli.devhttps://images.akli.dev/blog/pokedex-desktop.webp` (broken).

Two scenarios:
- **Phase 1 has shipped before this PRD's PR opens** (expected): `buildMetaTags` already handles absolute URLs. This PRD just changes the inputs.
- **Phase 1 has NOT shipped**: this PRD's PR cannot merge — either phase 1 ships first, or the buildMetaTags fix is added here as a duplicated change (not recommended; better to wait for phase 1).

The PRD assumes phase 1 ships first. If sequencing changes, the implementer must add the buildMetaTags fix here, but that's a deviation from the agreed plan and should be flagged in the PR description.

### Lockstep deploy ordering

```
1. akli-infrastructure phase 2 deploys
   - images.akli.dev gains blog/* behavior pointing at site bucket
   - Site bucket policy gains second statement
   - Verify: curl https://images.akli.dev/blog/anything.webp → 404 NoSuchKey

2. personal-website phase 2 deploys (THIS PRD)
   - public/images/blog/* → public/blog/*
   - building-a-pokedex.mdx updated (3 refs)
   - Tests updated
   - Vite build + s3 sync --delete removes old keys, uploads new keys

3. Verify: visit /blog/building-a-pokedex on akli.dev
   - Cover + inline images load from images.akli.dev/blog/...
   - DevTools network panel confirms 200 + image/webp responses
```

If reversed (this PRD ships before infra phase 2): MDX references `images.akli.dev/blog/...` URLs but the route doesn't exist → all blog images on `building-a-pokedex` broken. Sequence carefully.

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

- [ ] `public/images/blog/pokedex-desktop.webp` no longer exists.
- [ ] `public/images/blog/pokedex-mobile.webp` no longer exists.
- [ ] `public/blog/pokedex-desktop.webp` exists with byte content identical to the original (verify with `diff` against pre-move snapshot or `sha256sum`).
- [ ] `public/blog/pokedex-mobile.webp` exists with byte content identical to the original.
- [ ] `public/images/blog/` directory is removed.
- [ ] `public/images/` directory is removed if it has no remaining contents after the move (verified today as containing only `blog/`; running `ls public/images/` after removing `blog/` should return an empty listing, in which case `rmdir public/images/`).

### Automated — `building-a-pokedex.mdx` updates

- [ ] Frontmatter `image:` field equals `https://images.akli.dev/blog/pokedex-desktop.webp` (absolute URL, no leading `/`).
- [ ] All inline `<Image src=...>` references using the desktop image use `https://images.akli.dev/blog/pokedex-desktop.webp`.
- [ ] All inline `<Image src=...>` references using the mobile image use `https://images.akli.dev/blog/pokedex-mobile.webp`.
- [ ] No remaining `/images/blog/` references in the MDX file (`grep -c '/images/blog/' src/pages/Blog/posts/building-a-pokedex.mdx` returns 0).

### Automated — Test updates

- [ ] `src/meta.test.ts` mock blog-post frontmatter `image:` field is changed from `/images/blog/test-post-cover.jpg` to `https://images.akli.dev/blog/test-post-cover.webp` (absolute URL; also updates extension to `.webp` for fidelity).
- [ ] `src/meta.test.ts` blog-branch assertion on `meta.og.image` is updated to expect the full absolute URL `https://images.akli.dev/blog/test-post-cover.webp` (NOT `https://akli.devhttps://...` — this assertion fails without phase 1's `buildMetaTags` fix, acting as the canary).
- [ ] `src/meta.test.ts` blog-branch assertion on `meta.twitter.image` is updated equivalently.
- [ ] `src/entry-server.test.tsx` blog-branch assertion is updated to `expect(html).toContain('https://images.akli.dev/blog/pokedex-desktop.webp')`.
- [ ] `src/entry-server.test.tsx` gains a NEW assertion for the inline mobile image: `expect(html).toContain('https://images.akli.dev/blog/pokedex-mobile.webp')` (current tests only cover the cover; this PR is a good moment to close the inline-image coverage gap).
- [ ] All updated test files pass `pnpm exec vitest run`.

### Automated — Quality gates

- [ ] `pnpm test` passes (all suites green).
- [ ] `pnpm lint` passes.
- [ ] `pnpm exec tsc --noEmit` produces no NEW errors. Pre-PRD baseline (recorded at PRD time): the existing errors are `mdast` module resolution in `plugins/`, `AuthContext` null-typing errors, `Recipe.status` string-vs-union mismatches in `entry-server.test.tsx` and `meta.test.ts`. The error count after this PR's changes equals the baseline count.
- [ ] `pnpm build` succeeds.
- [ ] **Build-output check (deploy-state proxy):** `dist/client/blog/pokedex-desktop.webp` and `dist/client/blog/pokedex-mobile.webp` exist after `pnpm build`. `dist/client/images/blog/` does NOT exist after `pnpm build`. (This proves Vite's `public/` copy ran correctly and that `aws s3 sync --delete` will drop the old keys post-deploy.)

### PR review checklist (manual review during PR, not enforced by tests)

- [ ] `grep -rn 'images/blog' src/ public/` returns zero matches (catches both `/images/blog/` and `images/blog/` patterns; `public/blog/` should be the only blog-images directory after the move).
- [ ] No MDX file other than `building-a-pokedex.mdx` references `images/blog/` (re-verify in case a new post landed during the in-flight period — confirmed at PRD time as the only one).
- [ ] Phase 1 `buildMetaTags` fix is confirmed merged on `main` BEFORE this PR merges (visual check of `src/meta.ts` `buildMetaTags` body — should contain `image.startsWith('http') ?` or equivalent).
- [ ] `.github/workflows/deploy.yml` `aws s3 sync` invocation does NOT have `--exclude "images/blog/*"` or `--exclude "images/*"` added between PRD time and merge (sanity check against an unrelated workflow change that would prevent old-key deletion).

### Manual — Lockstep verification (post-deploy of sibling, before this PR ships)

- [ ] Sibling akli-infrastructure phase 2 PRD has shipped: `curl -I https://images.akli.dev/blog/anything-not-yet-uploaded.webp` returns `HTTP/2 404` with S3 NoSuchKey body (proves the route + OAC + bucket policy are functional).
- [ ] Existing `akli.dev/images/blog/<file>.webp` URLs still return 200 (regression baseline before the cutover).

### Manual — End-to-end verification (post-deploy of THIS PR)

- [ ] After this PR's deploy completes, `curl -I https://images.akli.dev/blog/pokedex-desktop.webp` returns `HTTP/2 200`, `content-type: image/webp`.
- [ ] After this PR's deploy completes, `curl -I https://images.akli.dev/blog/pokedex-mobile.webp` returns `HTTP/2 200`, `content-type: image/webp`.
- [ ] After this PR's deploy completes, `curl -I https://akli.dev/images/blog/pokedex-desktop.webp` returns 404 (confirms `--delete` removed the old keys; this is the agreed-upon broken-link outcome from the no-redirects decision).
- [ ] Visit `https://akli.dev/blog/building-a-pokedex` in a browser — both the cover image and the inline `pokedex-mobile` image load correctly. DevTools network panel shows requests to `images.akli.dev/blog/...` returning 200 with `image/webp`.
- [ ] No requests to `akli.dev/images/blog/...` in the network tab when viewing the blog post (regression guard against any missed reference).
- [ ] OG meta tag spot check: `curl https://akli.dev/blog/building-a-pokedex` and grep for `og:image` — value equals `https://images.akli.dev/blog/pokedex-desktop.webp` (verifies the `buildMetaTags` fix produces a clean URL, not double-prefixed).
- [ ] Social-share preview check: paste `https://akli.dev/blog/building-a-pokedex` into Twitter/Slack/Discord — preview card renders the cover image (one-time spot check; cached previews from before the cutover may need to be re-scraped).

### Documentation

- [ ] `CLAUDE.md` "Conventions" bullet that currently reads "Blog post images live in `public/images/blog/` — referenced by URL string in MDX, served as-is, no Vite processing. Optimise manually before adding." is updated to: "Blog post images live in `public/blog/` and are served from `https://images.akli.dev/blog/<file>` — referenced by absolute URL in MDX, served as-is, no Vite processing. Optimise manually before adding."
- [ ] No accessibility regression check needed (alt text is unchanged; image bytes are unchanged).

## Open Questions

All resolved during PRD review:

- **`public/images/` directory after the move** → resolved to **delete if empty**. Verified at PRD time that `blog/` is the only subdirectory; after moving it, `public/images/` will be empty and should be removed. AC made deterministic.
- **Test fixture extension** → resolved to **`.webp`** (matching production blog image format). ACs updated accordingly.

No remaining open questions for phase 2.
