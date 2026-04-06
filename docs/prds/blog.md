# PRD: Blog

## Overview

Add a blog to akli.dev where the site owner can publish technical posts about projects and learnings. Posts are authored as MDX files with frontmatter, compiled at build time, and rendered with custom components (code blocks, callouts, image captions, file trees). The blog serves as a portfolio complement — showing recruiters not just what was built, but how and why.

## Problem Statement

The portfolio currently showcases projects (Apps page) but doesn't demonstrate communication skills, technical depth, or decision-making process. Recruiters and hiring managers value engineers who can explain their work clearly. A blog fills this gap — each post is an opportunity to demonstrate expertise beyond code.

## Goals

- Visitors can browse and filter blog posts by tag
- Each post is a standalone page with clean typography and rich content (code, images, callouts)
- Posts are easy to author — write MDX, push to main, deployed automatically
- Code blocks have syntax highlighting, copy button, filename header, and line numbers
- Blog integrates seamlessly with the existing site design (including dark mode)
- Posts are shareable via social links and discoverable via the sitemap

## Non-Goals

- Table of contents — future feature
- Pagination — 4-6 posts/year doesn't warrant it yet
- Next/previous post navigation — future feature
- RSS feed — future feature
- Comments — out of scope
- Newsletter signup — out of scope
- CMS or admin UI — posts are MDX files in the repo
- Step-by-step component (`<Steps>`) — future feature
- Diff/before-after component (`<Diff>`) — future feature

## User Stories

- As a recruiter, I want to read about the site owner's projects so I can assess their technical depth and communication skills.
- As a visitor, I want to filter posts by tag so I can find content relevant to my interests.
- As a visitor, I want to share a blog post on Twitter or LinkedIn so others can read it.
- As a visitor, I want code examples to be syntax-highlighted and copyable so I can reference them easily.
- As the site owner, I want to write posts in MDX so I can embed React components alongside markdown.
- As the site owner, I want posts auto-indexed in the sitemap so I don't have to manually add each one.

## Design & UX

### Blog index (`/blog`)

- Page heading "Blog" with a short intro line
- Tag filter: clickable pill-shaped tags at the top. Clicking a tag filters the list. Active tag is visually highlighted. Clicking again deselects. Filter state reflected in URL (`/blog?tag=aws`)
- Post list: vertical stack of post cards, sorted by date (newest first)
- Each post card shows: title (linked), date, reading time, description, tags
- No post image on the index — keep it clean and scannable
- Matches existing site design system (tokens, typography, CSS Modules)

### Individual post (`/blog/:slug`)

- Post header: title (h1), date, reading time, tags
- Post body: rendered MDX with custom components
- Social share links at the bottom: Twitter/X and LinkedIn, inline SVG icons matching the SocialCard pattern
- Related posts section at the bottom:
  - Shows up to 3 posts with the most overlapping tags
  - Falls back to most recent posts (excluding the current post) if no tag overlap
  - Hidden entirely if there is only one post total
- Dark mode compatible — all components respect `data-theme`

### Blog post content components

#### CodeBlock

- Syntax highlighted via Shiki at build time (zero client JS for highlighting)
- Features: filename header, line numbers, copy button
- Supports all common languages (TypeScript, JavaScript, Python, CSS, YAML, JSON, bash, etc.)
- Dark mode: Shiki dual themes — light and dark colours generated at build time, toggled via CSS `[data-theme="dark"]`
- Shiki places code fence meta (e.g., `title="handler.ts"`) in a `data-meta` attribute on the `<pre>` element. The CodeBlock component must parse this attribute to extract the filename.
- Usage in MDX:
  ````mdx
  ```typescript title="lambda/handler.ts"
  export const handler = async (event) => {
    return { statusCode: 200 }
  }
  ```
  ````

#### Callout

- Variants: `tip`, `warning`, `info`
- Each has a distinct colour accent and icon
- Respects dark mode
- Usage in MDX:
  ```mdx
  <Callout type="tip">
    DynamoDB Scan reads every item — fine for 151 Pokemon, not for millions.
  </Callout>
  ```

#### ImageCaption

- Explicitly used in MDX (not mapped to default `img` — standard markdown images get basic styling only)
- Wraps an image with a caption below
- Caption in smaller, muted text
- Image responsive with max-width
- Usage in MDX:
  ```mdx
  <ImageCaption src="/blog/images/architecture.png" alt="System architecture" caption="The three-stack CDK architecture for the Pokedex API" />
  ```

#### FileTree

- Renders a directory structure with proper formatting (indentation, folder/file icons)
- Useful for explaining project architecture in blog posts
- Usage in MDX:
  ```mdx
  <FileTree>
    src/
      components/
        PokemonCard/
          PokemonCard.tsx
          PokemonCard.module.css
          index.ts
        PokemonList/
          PokemonList.tsx
          index.ts
      hooks/
        usePokemonList.ts
      types/
        pokemon.ts
  </FileTree>
  ```

#### Default MDX components

- All markdown elements (`h1`-`h6`, `p`, `a`, `ul`, `ol`, `blockquote`, `code`, `pre`, `table`) get styled defaults
- Components are passed directly as a prop to the MDX content component (`<PostComponent components={mdxComponents} />`) — no `MDXProvider` needed
- External links (`http...`) automatically open in new tab with `target="_blank"` and `rel="noreferrer"` — reuse existing Link component logic, matching existing convention
- Default `img` gets basic responsive styling (not mapped to `ImageCaption`)
- Inline `code` styled with monospace font and subtle background

### States

- **Empty blog** (no posts): show a message like "Posts coming soon"
- **No matching tag**: show "No posts found for this tag" with a link to clear the filter
- **Single post** (no related posts): hide the related posts section entirely

## Technical Considerations

### Post file structure

```
src/pages/Blog/
  Blog.tsx                  — index page
  Blog.module.css
  Blog.test.tsx
  BlogPost.tsx              — individual post page (dynamic route)
  BlogPost.module.css
  BlogPost.test.tsx
  posts/
    building-a-pokedex.mdx
    cdk-custom-resources.mdx
    images/                 — co-located with posts for easy authoring
  index.ts
```

### MDX frontmatter

Each post has YAML frontmatter:

```yaml
---
title: Building a Pokedex with React and AWS
date: 2026-04-06
description: How I built a searchable Pokemon encyclopedia with React 19, AWS CDK, DynamoDB, and Lambda.
tags: [react, aws, cdk, dynamodb]
---
```

### Frontmatter parsing

MDX does not parse frontmatter by default. Add `remark-frontmatter` and `remark-mdx-frontmatter` to the Vite MDX plugin config. Configure `remark-mdx-frontmatter` with `{ name: 'frontmatter' }` so it exports a single `frontmatter` object (not individual named exports):

```typescript
mdx({
  remarkPlugins: [
    remarkFrontmatter,
    [remarkMdxFrontmatter, { name: 'frontmatter' }],
  ],
})
```

Each MDX file then exports `export const frontmatter = { title, date, ... }`.

### Post registry

Create a `src/pages/Blog/posts/index.ts` that imports all posts and exports a typed array with metadata. Use Vite's `import.meta.glob` with lazy loading to prevent bundle bloat as posts grow:

```typescript
const modules = import.meta.glob('./*.mdx')

// Build post metadata list from eagerly loaded frontmatter
const metaModules = import.meta.glob('./*.mdx', { eager: true, import: 'frontmatter' })
```

Use `eager: true` only for frontmatter metadata (small). Post content is lazy-loaded when the user navigates to a post. This prevents bundle size growing linearly with post count.

### Reading time

Use a custom remark plugin that calculates word count from the MDX AST at build time and exports it alongside frontmatter. This avoids the problem of counting JSX/imports as prose. The plugin strips non-text nodes, counts words, and exports `readingTime` as a named export from each MDX file.

### Routing

Add two routes to `App.tsx`:

```typescript
<Route path="/blog" element={<Blog />} />
<Route path="/blog/:slug" element={<BlogPost />} />
```

`BlogPost` reads `:slug` from `useParams()`, looks it up in the post registry. If not found, render the existing `NotFound` component. The lazy-loaded MDX module is loaded via `React.lazy` or an equivalent async pattern.

### Shiki integration

Add `@shikijs/rehype` as a rehype plugin to the MDX pipeline in `vite.config.ts`:

```typescript
mdx({
  remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }]],
  rehypePlugins: [
    [rehypeShiki, {
      themes: { light: 'github-light', dark: 'github-dark' },
    }],
  ],
})
```

This transforms fenced code blocks at build time into pre-highlighted HTML with dual theme CSS classes. The CSS toggles themes via `[data-theme="dark"]` selectors.

The `CodeBlock` component wraps the Shiki `<pre>` output. It must:
- Parse `data-meta` attribute to extract `title` for the filename header
- Add line numbers via CSS counters
- Add a copy button that reads `textContent` from the `<code>` element
- The copy button must guard `navigator.clipboard` for SSR safety (`if (typeof navigator !== 'undefined')`)

### SSR compatibility

The project has an SSR build. Key considerations:

- **`import.meta.glob`**: works in both client and SSR builds when used at module scope. No special handling needed.
- **`navigator.clipboard`** (copy button): does not exist in SSR. Guard with `typeof navigator !== 'undefined'` or only attach the click handler on mount via `useEffect`.
- **Shiki output**: generates static HTML at build time via the rehype plugin — works identically in client and SSR builds since it's already HTML by render time.
- **`useParams`**: works in SSR via the request URL passed to `renderToString`. React Router handles this in the existing SSR setup.

### Passing components to MDX

Pass components directly as a prop to each MDX post component:

```typescript
<PostComponent components={mdxComponents} />
```

This is simpler than `MDXProvider` and avoids needing `providerImportSource` config. The `mdxComponents` object maps:

```typescript
const mdxComponents = {
  pre: CodeBlock,
  a: BlogLink,          // external links open in new tab
  // h1-h6, p, ul, ol, blockquote, table, code, img — styled via CSS class overrides
}
```

Note: `img` is NOT mapped to `ImageCaption`. Standard markdown images get basic responsive styling via CSS. `ImageCaption` is used explicitly in MDX when a caption is needed.

### Sitemap

Blog posts are MDX files, not auto-discovered by the current sitemap plugin (which only scans for `.tsx`). Use the existing `additionalRoutes` pattern: the post registry generates the route list, and the Vite config passes it to the sitemap plugin. This avoids modifying the sitemap plugin's `fileToRoute` function which doesn't handle `.mdx` extensions or the `posts/` path segment.

### Header navigation

Add "Blog" to the site header navigation alongside "Apps".

### Dark mode

All blog components must respect the existing `data-theme` attribute:
- CodeBlock: Shiki dual themes toggled via `[data-theme="dark"]` CSS
- Callout: colours use CSS custom properties from tokens
- FileTree: text and icon colours use design tokens
- ImageCaption: text colours use `--color-text-muted`
- Post cards, tags, all typography: inherit from design tokens

### Testing

TDD is the preferred approach.

- **Component tests**: CodeBlock (renders code, copy button works, filename header from meta), Callout (renders all three variants), ImageCaption (renders image + caption), FileTree (renders directory structure), BlogPostCard (renders metadata)
- **Page tests**: Blog index (renders posts, tag filtering, URL state), BlogPost (renders content, shows related posts, social share links, 404 for invalid slug)
- **Utility tests**: reading time calculation, related posts algorithm (tag overlap, fallback, single post), post registry
- **Accessibility**: tag buttons have proper aria, social links have labels, code blocks are keyboard navigable
- **Note**: Shiki syntax highlighting cannot be tested in unit tests (runs as a Vite build plugin, not at runtime in jsdom). CodeBlock tests verify the wrapper component behaviour (copy, filename, line numbers) with mock pre-highlighted HTML.

### Performance

- Shiki runs at build time — zero syntax highlighting JS shipped to client
- Posts are compiled to JS modules at build time — no runtime MDX parsing
- Post content lazy-loaded via `import.meta.glob` with `eager: false` — only frontmatter is eager-loaded for the index page
- Images in posts should use responsive `srcSet` where possible

## Acceptance Criteria

### Blog index page

- [ ] `/blog` route renders the blog index page
- [ ] "Blog" link added to site header navigation
- [ ] Page displays all posts sorted by date (newest first)
- [ ] Each post card shows: title (linked to post), date, reading time, description, tags
- [ ] Clickable tag pills filter the post list
- [ ] Active tag is visually highlighted
- [ ] Tag filter state reflected in URL (`/blog?tag=aws`)
- [ ] Loading the page with `?tag=aws` pre-filters the list
- [ ] "No posts found for this tag" shown when filter matches nothing, with a clear filter link
- [ ] "Posts coming soon" shown when no posts exist
- [ ] Blog index page tests cover: rendering, tag filtering, URL state, empty states

### Individual post page

- [ ] `/blog/:slug` route renders the blog post
- [ ] Post header shows: title, date, reading time, tags
- [ ] MDX content renders with styled default elements (headings, paragraphs, lists, links, tables, blockquotes, inline code)
- [ ] External links open in new tab with `rel="noreferrer"`
- [ ] Social share links (Twitter/X, LinkedIn) appear at the bottom with inline SVG icons
- [ ] Share links pre-fill with the post's title and URL
- [ ] Related posts section shows up to 3 posts with overlapping tags (excluding current post)
- [ ] Related posts falls back to most recent posts (excluding current post) if no tag overlap
- [ ] Related posts section hidden if only one post exists
- [ ] Invalid slug renders the NotFound page
- [ ] Blog post page tests cover: rendering, share links, related posts logic, 404

### CodeBlock component

- [ ] Fenced code blocks render with Shiki syntax highlighting (build-time)
- [ ] Filename header displayed when `title` meta is provided — parsed from `data-meta` attribute
- [ ] Line numbers displayed via CSS counters
- [ ] Copy button copies code content to clipboard (guarded for SSR — no `navigator.clipboard` on server)
- [ ] Light and dark themes toggle via `[data-theme]` attribute
- [ ] CodeBlock tests verify wrapper behaviour with mock pre-highlighted HTML (not Shiki itself)

### Callout component

- [ ] Three variants: `tip`, `warning`, `info` — each with distinct colour and icon
- [ ] Respects dark mode via CSS custom properties
- [ ] Callout tests cover: all three variants render correctly

### ImageCaption component

- [ ] Renders image with caption text below
- [ ] Caption styled in smaller, muted text
- [ ] Image responsive with max-width
- [ ] Not mapped to default `img` — used explicitly in MDX only
- [ ] ImageCaption tests cover: rendering with and without caption

### FileTree component

- [ ] Renders a directory structure with indentation and folder/file visual indicators
- [ ] Parses indented text children into a tree structure
- [ ] Respects dark mode
- [ ] FileTree tests cover: rendering nested structure, empty tree

### Infrastructure

- [ ] `remark-frontmatter` and `remark-mdx-frontmatter` (with `{ name: 'frontmatter' }`) added to MDX plugin config
- [ ] `@shikijs/rehype` added with dual themes (`github-light` / `github-dark`)
- [ ] Post registry auto-discovers MDX files via `import.meta.glob` (eager for frontmatter, lazy for content)
- [ ] Reading time calculated per post via remark plugin
- [ ] Blog posts auto-indexed in sitemap via `additionalRoutes`
- [ ] Dark mode works across all blog components
- [ ] SSR build succeeds with all blog dependencies
- [ ] All tests pass (`pnpm test`)

## Open Questions

- Which Shiki themes pair best with the existing site design? Suggested: `github-light` / `github-dark` — clean and widely recognised. Or a more minimal option?
- Should the reading time remark plugin be a custom plugin in the repo or use the `remark-reading-time` npm package?
