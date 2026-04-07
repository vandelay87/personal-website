# PRD: SSR Streaming

## Overview

Migrate the SSR render function from `renderToString` to `renderToPipeableStream` and wrap the Lambda handler with `awslambda.streamifyResponse`. This enables Suspense support in SSR (blog post content renders on the server instead of showing "Loading..." fallbacks) and progressive HTML streaming to the browser for faster time-to-first-byte.

## Problem Statement

The current SSR pipeline uses `renderToString` from `react-dom/server`. This API:

1. Does not support Suspense. Blog posts use `React.lazy` to load MDX content, so the server renders the Suspense fallback ("Loading...") instead of the actual article. Search engines and social media crawlers see no blog content.
2. Is synchronous and blocking. The entire React tree must resolve before any HTML is returned.
3. Is a legacy API. React 19 recommends `renderToPipeableStream` for all server rendering.

## Goals

- Blog post content renders fully on the server (no "Loading..." fallback in the HTML)
- HTML streams progressively to the browser (shell first, Suspense boundaries fill in)
- Meta tags (OG, Twitter) are correct and visible to crawlers
- All existing pages (Home, Apps, Blog index) continue to work
- Lambda handler uses `awslambda.streamifyResponse` for streaming output

## Non-Goals

- Infrastructure changes (Lambda Function URL, CloudFront origin). Those are in a separate PRD in akli-infrastructure.
- React Server Components
- Edge rendering (Lambda@Edge, CloudFront Functions)
- Changing the client-side hydration strategy

## User Stories

- As a search engine crawler, I want to see the full blog post content in the HTML so the page is indexed correctly.
- As a visitor sharing a blog post on social media, I want the preview to show the correct title, description, and content.
- As a visitor, I want the page to start rendering faster (lower TTFB from progressive streaming).

## Design & UX

No visual changes. Pages look and behave identically. The improvement is in what crawlers see and how fast the first bytes arrive.

## Technical Considerations

### `renderToPipeableStream` API

Replace `renderToString` in `src/entry-server.tsx` with `renderToPipeableStream`:

```typescript
import { renderToPipeableStream } from 'react-dom/server'

const { pipe } = renderToPipeableStream(
  <StaticRouter location={url}>
    <App />
  </StaticRouter>,
  {
    onShellReady() {
      // Shell (non-suspended content) is ready — start piping
      pipe(writable)
    },
    onAllReady() {
      // All Suspense boundaries resolved — full HTML available
    },
    onError(error) {
      console.error('SSR stream error:', error)
    },
  }
)
```

### Template injection

Currently, the template (`index.html`) is split at `<!--ssr-head-->` and `<!--ssr-outlet-->` markers. With streaming:

1. Write the template content before `<!--ssr-outlet-->` (head, opening tags)
2. Pipe the React stream (app HTML)
3. Write the template content after `<!--ssr-outlet-->` (closing tags, scripts)

The head HTML (meta tags) must be written before the stream starts, since it's in the `<head>` element.

### Lambda handler with `awslambda.streamifyResponse`

The handler wraps with `awslambda.streamifyResponse` to enable streaming:

```typescript
import * as awslambda from 'awslambda'

export const handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    // Write HTTP metadata
    const metadata = {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata)

    // Write head HTML
    responseStream.write(headHtml)

    // Pipe React stream
    const { pipe } = renderToPipeableStream(app, {
      onShellReady() {
        pipe(responseStream)
      },
    })
  }
)
```

### Suspense and `React.lazy` in SSR

`renderToPipeableStream` with `onAllReady` waits for all Suspense boundaries to resolve before considering the render complete. The `React.lazy` blog post content will load during the render, and the full HTML (including the article text) will be in the streamed output.

For progressive streaming (using `onShellReady` instead of `onAllReady`), the shell HTML streams first, and Suspense fallbacks are replaced inline as they resolve. The browser sees content progressively.

### Error handling

- `onShellError`: the shell itself failed to render. Return a 500 error page.
- `onError`: a Suspense boundary failed. The fallback is shown in the HTML. Log the error.
- Status code must be determined before streaming starts (can't change mid-stream). Use `isKnownRoute` to set 200 vs 404 before opening the stream.

### Backwards compatibility

- All non-Suspense pages (Home, Apps) render in the shell — no change in behaviour
- Blog index renders in the shell (no Suspense) — no change
- Blog post detail renders the shell immediately, then the `React.lazy` MDX content fills in

### Build changes

- The SSR build output format is currently CJS (`format: 'cjs'` in vite.config.ts). `awslambda.streamifyResponse` is available in the Lambda Node.js runtime globally — no npm package needed.
- TypeScript types for `awslambda` may need a declaration file or `@types/aws-lambda` update.

### Testing

TDD is the preferred approach.

- **Unit tests**: entry-server render function produces valid HTML for known routes
- **Unit tests**: Suspense content (mock lazy component) resolves in the streamed output
- **Unit tests**: error handling — shell error returns 500, Suspense error shows fallback
- **Unit tests**: meta tags are present in the streamed head
- **Integration**: deploy and verify blog post content is in the page source (not "Loading...")

## Acceptance Criteria

- [ ] `entry-server.tsx` uses `renderToPipeableStream` instead of `renderToString`
- [ ] Lambda handler uses `awslambda.streamifyResponse` for streaming output
- [ ] Blog post content renders fully on the server (visible in page source)
- [ ] Suspense fallback ("Loading...") does not appear in server-rendered HTML for valid blog posts
- [ ] Meta tags (title, description, OG, Twitter) are present in the streamed HTML head
- [ ] Home page, Apps page, and Blog index page render correctly (no regressions)
- [ ] 404 pages return correct status code and meta tags
- [ ] Shell errors (render crash) return a 500 error page
- [ ] SSR build (`pnpm build:prod`) succeeds
- [ ] Tests cover: HTML output, Suspense resolution, error handling, meta tags
- [ ] All tests pass (`pnpm test`)

## Open Questions

- Should the stream use `onShellReady` (progressive, sends shell immediately) or `onAllReady` (waits for everything, then sends)? `onShellReady` is better for user experience, `onAllReady` is simpler and guarantees full content before the first byte.
- Does `awslambda.streamifyResponse` need a type declaration file for TypeScript, or does the runtime provide it?
- Should the existing `entry-server.test.tsx` tests be rewritten for the streaming API, or should a new test file be created?
