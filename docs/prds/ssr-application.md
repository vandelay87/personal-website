# PRD: SSR Application

## Overview

Implement server-side rendering in the personal-website repo so that every page request returns fully rendered HTML with correct per-page meta tags. The infrastructure (Lambda, API Gateway, CloudFront origin failover) is already deployed via the akli-infrastructure repo. This PRD covers the application-side changes: Vite SSR build config, server and client entry points, the Lambda handler, per-page meta tags (title, description, Open Graph, Twitter Card), and CI/CD updates to deploy the server bundle.

## Problem Statement

akli.dev is a client-side rendered SPA. Search engines and social media crawlers that don't execute JavaScript see only the generic `<title>Akli Aissat</title>` and `<meta name="description" content="I'm Akli Aissat and welcome to my personal website." />` from `index.html`, regardless of which page is being visited. This produces poor Google search results and blank link previews on LinkedIn, Twitter, and other platforms. The SSR infrastructure is deployed but serves a placeholder handler — the application needs to produce the actual server-rendered HTML.

## Goals

- Every page returns fully rendered HTML on the initial request (no blank screen while JS loads)
- Each page has unique, accurate meta tags (title, description, OG, Twitter Card)
- Social media link previews show the correct title, description, and image for the shared page
- The client hydrates the server-rendered HTML without mismatches
- The build produces both a client bundle (for S3) and a server bundle (for Lambda)
- CI/CD deploys both bundles automatically on push to main

## Non-Goals

- SSR for the sand-box app — it is deployed separately and has no SEO-relevant content
- Dynamic data fetching in the Lambda (no API calls, database, or CMS) — the Lambda renders from bundled code only
- Streaming SSR (`renderToPipeableStream`) — `renderToString` is sufficient for a small site with no data fetching. Note: `renderToString` is technically a legacy API in React 19, but streaming adds complexity with no benefit when there are no Suspense boundaries or data fetching. Can revisit if `lazy()` or `Suspense` are introduced.
- Creating an OG image — the PRD specifies meta tags only. A branded OG image is a follow-up.
- Adding new pages or content — only the existing routes (/, /apps, /404) are in scope
- Migrating to React Router's data router / `meta` exports — the manual `src/meta.ts` approach is simpler for 3 routes. Revisit when adding dynamic routes.

## User Stories

- As a recruiter searching Google for "Akli Aissat", I want to see a relevant title and description in the search results so I can quickly understand what Akli does.
- As a user sharing akli.dev/apps on LinkedIn, I want the link preview to show "Apps & Experiments | Akli Aissat" with a relevant description, not a generic "welcome to my personal website" message.
- As a visitor on a slow connection, I want to see page content immediately without waiting for JavaScript to download and execute.

## Design & UX

No visual changes. The site looks and behaves identically — the difference is that the initial HTML response is fully rendered instead of an empty shell. Users on fast connections won't notice a difference. Users on slow connections will see content sooner.

### Per-page meta tags

| Route | Title | Description | OG Image |
|-------|-------|-------------|----------|
| `/` | `Akli Aissat — Full-Stack Engineer` | `Full-stack engineer building responsive web applications with React, TypeScript, and modern web technologies. Explore my projects and experiments.` | (none for now — follow-up) |
| `/apps` | `Apps & Experiments \| Akli Aissat` | `Interactive side projects and experiments built to explore ideas and learn how things work.` | (none for now) |
| `/*` (404) | `Page Not Found \| Akli Aissat` | `The page you are looking for does not exist.` | (none for now) |

All pages also include:
- `<meta property="og:type" content="website" />`
- `<meta property="og:url" content="https://akli.dev{path}" />`
- `<meta property="og:title" content="{title}" />`
- `<meta property="og:description" content="{description}" />`
- `<meta name="twitter:card" content="summary" />`
- `<meta name="twitter:title" content="{title}" />`
- `<meta name="twitter:description" content="{description}" />`
- `<link rel="canonical" href="https://akli.dev{path}" />`

The 404 page additionally includes `<meta name="robots" content="noindex" />`.

### URL normalisation

- Trailing slashes are stripped before route matching (`/apps/` → `/apps`)
- Query strings and hash fragments are ignored for meta tag lookup (Lambda receives `rawPath` only)
- Case-sensitive matching — `/Apps` returns 404, not the apps page

## Technical Considerations

### Entry points

**`src/entry-client.tsx`** (replaces `src/main.tsx` for the client build):
- Uses `hydrateRoot` instead of `createRoot` to attach to the server-rendered HTML
- Wrapped in `StrictMode` and `BrowserRouter` (same as current `main.tsx`)
- Imports `index.css` for styles

**`src/entry-server.tsx`** (new, imported by the Lambda handler):
- Exports a `render(url: string)` function
- Uses `renderToString` with `StaticRouter` from `react-router-dom/server`
- Returns the rendered HTML string and the meta tags for the given route
- Does not import CSS — the server bundle doesn't need it (CSS is in the client bundle)

**`src/main.tsx`** remains for local development with `pnpm dev` (Vite dev server uses it as the entry point). The SSR entry points are only used for the production build.

### Meta tags

Create a `src/meta.ts` module that maps routes to their meta tag data (title, description, OG properties). Both the server entry and any future client-side meta management can import from this single source of truth.

The server entry injects meta tags directly into the HTML `<head>` during rendering. No need for `react-helmet-async` or similar libraries — the server controls the full HTML response.

Meta tag values must be HTML-escaped to prevent injection if route paths or content ever contain special characters.

### Vite SSR build config

Update `vite.config.ts` to support SSR builds. Vite has built-in SSR support:

- `pnpm build:client` — standard client build, outputs to `dist/client/`
- `pnpm build:server` — SSR build with `ssr: 'src/lambda-handler.ts'` as the entry point, outputs to `dist/server/`
- `pnpm build:prod` — copies `robots.prod.txt`, then runs both builds sequentially

**Critical: the server bundle must be self-contained for Lambda.** Set `ssr.noExternal: true` in the server build config so all dependencies are bundled into the output. Lambda receives a zip with the JS bundle only — no `node_modules` directory. Without this, the Lambda will crash at runtime with missing module errors.

**`vite-imagetools` in SSR:** Include `vite-imagetools` via `ssr.noExternal` so image imports with query parameters (`?w=320&format=webp&as=srcset`) are processed at build time. The server build resolves these to the same URLs as the client build. If this causes issues, fall back to mocking image imports in the server entry — the server only needs the component tree to render, not actual image URLs.

**`sitemapPlugin`:** Runs during the client build only. Exclude from the server build config.

**`@mdx-js/rollup`:** Include in both builds — MDX imports must resolve in SSR.

**Path aliases** (`@components/`, `@pages/`, `@hooks/`): Use the same `resolve.alias` config in both client and server builds.

### Lambda handler

**`src/lambda-handler.ts`** is the server build entry point. It:
- Imports the `render` function from `./entry-server`
- Receives API Gateway v2 events (`APIGatewayProxyEventV2`)
- Strips trailing slashes from `event.rawPath`
- Calls `render(path)` to get the HTML
- Returns the HTML with correct status code (200 for matched routes, 404 for unmatched)
- Sets `Content-Type: text/html; charset=utf-8` header
- Handles missing/empty `rawPath` gracefully (defaults to `/`)

### HTML template and asset injection

The HTML template must be embedded at build time — Lambda has no filesystem access to `dist/client/`.

**Build-time template strategy:**
1. After the client build completes, read `dist/client/.vite/manifest.json` to get hashed asset filenames
2. Read `dist/client/index.html` (Vite's processed version with correct asset links)
3. During the server build or as a post-build step, inline the HTML template as a string constant in the server bundle
4. At runtime, the Lambda handler replaces `<!--ssr-outlet-->` (or `<div id="root"></div>`) with the rendered HTML and injects meta tags into `<head>`

This eliminates any runtime file reads and keeps the Lambda handler fast.

### CSS Modules and hydration

Vite's SSR build handles CSS Modules correctly — it generates the same class name mappings on both server and client. The server build imports CSS Modules for their class name mappings but doesn't emit CSS files. The client build emits the actual CSS. This means:
- Server-rendered HTML has the correct CSS class names
- Client CSS is loaded via `<link>` tags in the HTML
- No hydration mismatches from class name differences

### Browser API guards

Components that reference browser-only APIs (`window`, `document`, `IntersectionObserver`) must be guarded with `typeof window !== 'undefined'` checks, or the APIs must be conditionally used only in `useEffect` (which doesn't run during SSR). The existing `usePreloadImage` hook and `Image` component use `IntersectionObserver` — verify these are safe for SSR or add guards.

### CI/CD updates

Update `.github/workflows/deploy.yml`:
1. Build both client and server bundles (`pnpm build:prod`)
2. Deploy client bundle to S3 (`aws s3 sync ./dist/client ...`)
3. Zip and deploy server bundle to Lambda (`cd dist/server && zip -r ../server.zip . && aws lambda update-function-code --function-name ${{ secrets.SSR_LAMBDA_FUNCTION_NAME }} --zip-file fileb://dist/server.zip`)
4. Invalidate CloudFront cache

New GitHub Actions secret required: `SSR_LAMBDA_FUNCTION_NAME` (exported as a CloudFormation output from the infrastructure stack).

### TDD approach

Tests are written before implementation where applicable:

1. **`src/meta.test.ts`** — test the route-to-meta-tags mapping: each route returns the correct title, description, and OG properties. The 404 route includes `noindex`. Test trailing slash normalisation, unknown routes fall back to 404, and canonical URLs are correct per route.
2. **`src/lambda-handler.test.ts`** — test the Lambda handler: correct status codes for matched/unmatched routes, correct Content-Type header, handles missing `rawPath`, strips trailing slashes, HTML response contains expected meta tags. Use mock API Gateway v2 events.
3. **`src/entry-server.test.tsx`** — test the render function: given a URL, it returns HTML containing the correct rendered page content and meta tags. Use `// @vitest-environment node` to run in a Node environment (matching Lambda runtime) rather than jsdom.
4. Existing component tests continue to pass — hydration changes should not break them since Testing Library uses `render` (which calls `createRoot`), not `hydrateRoot`.

**Note on SSR test environment:** The `entry-server` and `lambda-handler` tests should run in a `node` environment, not jsdom, to match the Lambda runtime. Components that reference `IntersectionObserver` or other browser APIs will need guards (see Browser API guards section above) for these tests to pass.

### What changes

| File | Change |
|------|--------|
| `src/entry-client.tsx` | New — hydrateRoot entry point with StrictMode |
| `src/entry-server.tsx` | New — renderToString entry point |
| `src/lambda-handler.ts` | New — Lambda handler (server build entry point) |
| `src/meta.ts` | New — route-to-meta-tags mapping |
| `src/meta.test.ts` | New — tests for meta mapping (TDD) |
| `src/lambda-handler.test.ts` | New — tests for Lambda handler (TDD) |
| `src/entry-server.test.tsx` | New — tests for server render |
| `src/main.tsx` | Unchanged — still used for dev server |
| `src/App.tsx` | May need minor changes to accept router from outside (StaticRouter vs BrowserRouter) |
| `vite.config.ts` | Updated — SSR build config, ssr.noExternal |
| `package.json` | Updated — new build scripts |
| `index.html` | Updated — add SSR outlet marker, remove hardcoded generic description |
| `.github/workflows/deploy.yml` | Updated — deploy server bundle to Lambda |

## Acceptance Criteria

### Functionality
- [ ] `src/entry-server.tsx` exports a `render(url)` function that returns HTML with correct page content
- [ ] `src/lambda-handler.ts` handles API Gateway v2 events and returns HTML responses with correct status codes (200 for matched routes, 404 for unmatched)
- [ ] `src/lambda-handler.ts` handles missing/empty `rawPath` by defaulting to `/`
- [ ] `src/lambda-handler.ts` strips trailing slashes before routing (`/apps/` → `/apps`)
- [ ] `src/meta.ts` maps each route to its title, description, and OG properties as specified in the Design & UX table
- [ ] The `/` route returns HTML containing `<title>Akli Aissat — Full-Stack Engineer</title>` and correct OG tags
- [ ] The `/apps` route returns HTML containing `<title>Apps & Experiments | Akli Aissat</title>` and correct OG tags
- [ ] The 404 route returns HTML with `<meta name="robots" content="noindex" />` and a 404 status code
- [ ] All pages include canonical URL, og:type, og:url, og:title, og:description, twitter:card, twitter:title, twitter:description
- [ ] Meta tag values are HTML-escaped

### Build
- [ ] `pnpm build:prod` produces both `dist/client/` and `dist/server/` bundles
- [ ] The server bundle is self-contained (no external `node_modules` dependencies)
- [ ] The HTML template with client asset links is embedded in the server bundle at build time
- [ ] `pnpm dev` continues to work with CSR as before (no regressions to local development)

### Deployment
- [ ] `.github/workflows/deploy.yml` deploys client bundle to S3 and server bundle to Lambda

### Tests (TDD)
- [ ] Tests for `src/meta.ts` verify correct meta tags for each route, trailing slash normalisation, and 404 fallback
- [ ] Tests for `src/lambda-handler.ts` verify status codes, headers, trailing slash handling, and missing rawPath
- [ ] Tests for `src/entry-server.tsx` verify rendered HTML contains correct content and meta tags (runs in node environment)
- [ ] All existing tests continue to pass
- [ ] `pnpm exec eslint --fix` passes on all changed files

### Manual verification (not unit-testable)
- [ ] `src/entry-client.tsx` uses `hydrateRoot` with `StrictMode` and renders without hydration mismatch warnings in the browser console
- [ ] CSS Module class names match between server and client (no visual differences)
- [ ] The server bundle runs in Node.js 20 without errors (verify with local smoke test or post-deploy check)

## Open Questions

- Should `src/main.tsx` be refactored to import from `entry-client.tsx` to avoid duplication, or kept separate for simplicity? Keeping them separate means two files both import `App` and `BrowserRouter`, but they serve different purposes (dev vs production).
- Should the Lambda handler return `Cache-Control` headers to work with the CloudFront SSR cache policy (60s TTL), or rely on the cache policy's default TTL?
