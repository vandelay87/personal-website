# personal-website

Personal portfolio site for [akli.dev](https://akli.dev). Built with React 19, TypeScript, Vite, and CSS Modules.

## Stack

- React 19 + TypeScript
- React Router v7 (client-side SPA)
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
  pages/         # Route pages (Home, Apps, Blog, NotFound)
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

## Design

Neo-brutalist aesthetic with a minimal, blocky layout. Dark mode is supported via a `data-theme` attribute on the document root and persisted to localStorage. Typography uses system font stacks with no external font requests.

Design tokens (colors, spacing, typography, shadows) are defined in `src/styles/tokens.css`.

## Deployment

Hosted on AWS S3 + CloudFront. CI/CD runs via GitHub Actions on push to `main`, which builds the site, syncs to S3, and invalidates the CloudFront cache. Infrastructure is managed separately in the [akli-infrastructure](https://github.com/vandelay87/akli-infrastructure) repo.

A custom Vite plugin auto-generates `sitemap.xml` at build time from the page directory.
