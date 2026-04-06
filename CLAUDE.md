# personal-website

Personal portfolio site for akli.dev. Built with React 19, TypeScript, Vite, and CSS Modules.

## PRDs

Before implementing any new feature, check `docs/prds/` for a relevant PRD. If one exists, read it fully and follow the spec. Do not add features beyond what the PRD describes.

To write a new PRD, copy `docs/prds/template.md` and fill it in.

## Stack

- React 19 + TypeScript
- React Router v7 (client-side routing)
- Vite 6
- CSS Modules
- Vitest + Testing Library
- Package manager: pnpm (do not use npm or yarn)

## Conventions

- Components live in `src/components/<Name>/<Name>.tsx` with a barrel `index.ts`
- Pages live in `src/pages/<Name>/<Name>.tsx` with a barrel `index.ts`
- Each component/page has a co-located test file `<Name>.test.tsx`
- Use path aliases: `@components/`, `@pages/`, `@hooks/`
- Dark mode via `data-theme` attribute on the document root
- Neo-brutalist design: use `var(--radius-none)` for border-radius — no rounded corners on any component
- Use const arrow functions, not function declarations — enforced by ESLint (`func-style: expression`)
- After modifying TSX files, run `pnpm exec eslint --fix` on changed files to auto-fix import order

## Workflow

- When completing issues that involve CSS, styling, or visual changes, use the `frontend-design` skill for implementation.
- Always run `/simplify` after completing an issue, before opening the PR.

## Deployment

- Hosted on akli.dev via AWS S3 + CloudFront
- CI/CD via GitHub Actions on push to `main`
