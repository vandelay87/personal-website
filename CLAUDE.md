# personal-website

Personal portfolio site for akli.dev. Built with React 19, TypeScript, Vite, and CSS Modules.

## PRDs

Before implementing any new feature, check `docs/prds/` for a relevant PRD. If one exists, read it fully and follow the spec. Do not add features beyond what the PRD describes.

To write a new PRD, copy `docs/prds/template.md` and fill it in.

## Stack

- React 19 + TypeScript
- React Router v7 (client-side routing)
- Vite 7
- CSS Modules
- Vitest + Testing Library
- Package manager: pnpm (do not use npm or yarn)

## Conventions

- Components live in `src/components/<Name>/<Name>.tsx` with a barrel `index.ts`
- Pages live in `src/pages/<Name>/<Name>.tsx` with a barrel `index.ts`
- Each component/page has a co-located test file `<Name>.test.tsx`
- Use path aliases: `@api/`, `@components/`, `@contexts/`, `@hooks/`, `@pages/`, `@models/` (→ `src/types/`)
- Dark mode via `data-theme` attribute on the document root
- Warm "paper" design (soft radii, hairline borders, Geist/JetBrains Mono) per `docs/prds/paper-redesign.md` (source of truth `docs/design/paper/`) — `--radius-none` no longer exists; pick from the soft radius scale (`--radius-sm/md/lg/xl/2xl/full`) per `docs/design/paper/token-migration.md`. The token layer (#218) has landed; component rebuilds are still landing across the rest of the epic (`epic/paper-redesign`).
- Use const arrow functions, not function declarations — enforced by ESLint (`func-style: expression`)
- After modifying TSX files, run `pnpm exec eslint --fix` on changed files to auto-fix import order
- Before creating new UI elements, check `src/components/` for existing reusable components (Image, Typography, Button, Card, Link, Loading, etc.). Always prefer existing components over raw HTML tags.
- Site images (cards, hero) live in `src/assets/` — imported via Vite, get hashed filenames and responsive srcSet
- Blog post images live in `public/images/blog/` — referenced by URL string in MDX, served as-is, no Vite processing. Optimise manually before adding.

## Greppable gates

- `pnpm check:descendant-selectors` (`scripts/check-descendant-selectors.ts`, runs in CI after Lint) — flags stale `.parent .child` CSS descendant-selector specificity workarounds against Typography/Link's `variant` prop. These were only ever needed to out-specificity a bare override className before the variant's base rule moved into `@layer component-defaults` (an unlayered rule always beats a layered one, so the extra specificity buys nothing once that happens) — manually rediscovered and fixed across issues #263–#336. JSX-aware: only flags a `.foo .Y` selector when the same JSX tag actually applies both `variant="X"` and `className={styles.Y}` and `X` is confirmed inside the layer, so it doesn't false-positive on coincidental class-name collisions (e.g. Callout's own `.label`) or on Link's default `tone` classes (deliberately unlayered, no `variant` prop passed). Scoped to the `variant`-prop pattern only — the `composes:`-based tie in `text.module.css` is a known gap, not handled.

## Workflow

- When completing issues that involve CSS, styling, or visual changes, use the `frontend-design` skill for implementation.
- Always run `/simplify` after completing an issue, before opening the PR.

## Deployment

- Hosted on akli.dev via AWS S3 + CloudFront
- CI/CD via GitHub Actions on push to `main`
