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

- `pnpm check:descendant-selectors` (`scripts/check-descendant-selectors.ts`, runs in CI after Lint) — flags stale `.parent .child` CSS descendant-selector specificity workarounds. These were only ever needed to out-specificity a bare override className before the underlying variant's base rule moved into `@layer component-defaults` (an unlayered rule always beats a layered one, so the extra specificity buys nothing once that happens) — manually rediscovered and fixed across issues #263–#336. Two independent checks, both wired into this one script/gate:
  - The `variant`-prop pattern: JSX-aware, only flags a `.foo .Y` selector when the same JSX tag actually applies both `variant="X"` and `className={styles.Y}` and `X` is confirmed inside the layer, so it doesn't false-positive on coincidental class-name collisions (e.g. Callout's own `.label`) or on Link's default `tone` classes (deliberately unlayered, no `variant` prop passed). Components are discovered automatically (any `src/components/**/*.module.css` with a real `@layer component-defaults` at-rule; JSX tag name derived from the file's basename) rather than hardcoded — Typography and Link are found this way today, and Button will be picked up automatically once it migrates into the layer. Known gap: Tag has a real layer (`.remove`) but no `variant` prop at all (`active`/`removable` booleans instead), so it's discovered as a candidate but never flagged — a Tag-specific check would need different logic entirely and isn't attempted here.
  - The `composes:`-based tie: a pure single-file CSS check (no JSX) for a consumer `.module.css` rule that `composes:` a variant from `src/styles/text.module.css` on a bare class, which also has a separate `.ancestor .thatClass` compound selector for the same class in the same file (the pre-#334 `Recipes.module.css` shape).

## Workflow

- When completing issues that involve CSS, styling, or visual changes, use the `frontend-design` skill for implementation.
- Always run `/simplify` after completing an issue, before opening the PR.

## Deployment

- Hosted on akli.dev via AWS S3 + CloudFront
- CI/CD via GitHub Actions on push to `main`
