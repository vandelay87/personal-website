# personal-website

Personal portfolio site for [akli.dev](https://akli.dev). Built with React 19, TypeScript, Vite, and CSS Modules.

## Stack

- React 19 + TypeScript
- React Router v7 (SSR + client-side hydration)
- Vite 6
- CSS Modules with design tokens
- MDX blog with Shiki syntax highlighting
- Vitest + Testing Library
- pnpm

## Getting started

```bash
pnpm install
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build:prod` | Production build |
| `pnpm build:dev` | Dev build (robots disallow all) |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm lint` | Lint with ESLint |
| `pnpm format` | Format with Prettier + ESLint fix |

## Project structure

```
src/
  components/    # Reusable components (<Name>/<Name>.tsx + index.ts)
  pages/         # Route pages (Home, Apps, Blog, Recipes, RecipeDetail, NotFound, admin/*)
  api/           # API service layers (recipes, auth, users)
  types/         # Shared TypeScript interfaces
  contexts/      # React contexts (RecipeDataContext for SSR, AuthContext)
  hooks/         # Custom hooks
  styles/        # Design tokens and animations
  assets/        # Images and static files
docs/
  prds/          # Product requirement documents
tests/
  setup.ts       # Vitest setup
```

## Pages

- `/` — Home page with hero, CV download, and apps CTA
- `/apps` — Showcase of interactive experiments and side projects
- `/apps/sand-box` — Real-time particle physics simulation (deployed separately)
- `/apps/pokedex` — Searchable Gen 1 Pokemon encyclopedia (deployed separately)
- `/blog` — Technical blog with tag filtering
- `/blog/:slug` — Individual blog posts (MDX with code blocks, callouts, file trees)
- `/recipes` — Recipe listing with search and tag filtering
- `/recipes/:slug` — Recipe detail with SSR for SEO and Open Graph
- `/admin/login` — Cognito-backed login with new-password challenge
- `/admin/recipes` — Recipe management list (protected)
- `/admin/recipes/new` and `/admin/recipes/:slug/edit` — Recipe editor form (protected)
- `/admin/recipes/:slug/preview` — Recipe preview (protected)
- `/admin/users` — User management (protected)

Admin routes are code-split via `React.lazy` and gated by `ProtectedRoute`, which reads auth state from `AuthContext`.

## Design

Neo-brutalist aesthetic with a minimal, blocky layout. Dark mode is supported via a `data-theme` attribute on the document root and persisted to localStorage. Typography uses system font stacks with no external font requests.

Design tokens (colors, spacing, typography, shadows) are defined in `src/styles/tokens.css`.

## Deployment

Hosted on AWS via Lambda Function URL + CloudFront. The SSR Lambda uses `renderToPipeableStream` with `awslambda.streamifyResponse` for streaming HTML responses. Suspense boundaries (blog post content via `React.lazy`) resolve on the server so crawlers see full content. S3 serves static assets with CloudFront failover on 5xx.

CI/CD runs via GitHub Actions on push to `main`, which builds the client and server bundles, syncs static assets to S3, deploys the server bundle to Lambda, and invalidates the CloudFront cache. Infrastructure is managed separately in the [akli-infrastructure](https://github.com/vandelay87/akli-infrastructure) repo.

A custom Vite plugin auto-generates `sitemap.xml` at build time from the page directory.
