# akli.dev Design System

The design system behind **akli.dev** — the personal site and recipe/blog platform of Akli Aissat (full-stack engineer). It captures the **2026 redesign**: a warm, editorial "paper" aesthetic with a strict two-font pairing, soft elevation, and a first-class light/dark theme.

> **Source of truth: the redesign.** Where the redesign and the existing codebase disagree, the redesign wins. The repo is used here for component **names and inventory**, not visuals.

---

## Sources

- **Redesign (this project):** 11 redesigned `.dc.html` pages — `Home`, `Apps`, `Blog`, `Building a Pokedex` (blog post), `Recipes`, `Mild Thai Basa Coconut Rice` (recipe detail), and admin: `Admin Login`, `Admin Recipes`, `Admin Recipe Editor`, `Admin Recipe Preview`, `Admin Users`.
- **Codebase:** GitHub `vandelay87/personal-website` (React 19 + TypeScript, Vite, CSS Modules). Original tokens at `src/styles/tokens.css`; components at `src/components/<Name>/<Name>.tsx`.
  - The repo's original direction is described as "neo-brutalist" (black/white, hard 2px borders, hard-offset shadows, **system fonts**). The redesign deliberately replaces that with warm paper + Geist/JetBrains Mono + soft elevation. This system documents the **new** direction.

---

## What changed from the old system → redesign

| Aspect | Old (repo) | Redesign (this system) |
|---|---|---|
| Background | `#FFFFFF` pure white | `#FBFAF7` warm paper |
| Fonts | system-ui / system mono | **Geist** + **JetBrains Mono** |
| Borders | `#000` 2px hard | `#ECE6DA` 1px hairline |
| Shadows | hard offset, no blur (`4px 4px 0`) | soft, blurred, low-opacity |
| Radii | `0` / `2px` (sharp) | `6–18px` (soft) |
| Accent | `#2563EB` | `#1F66E0` (light) / `#6BA0FF` (dark) |
| Text | 1 muted step | 4-step hierarchy (strong→faint) |

---

## Component inventory (repo → status in this system)

**Reusable primitives** (built as design-system components):
`Button`, `Link`, `Card`, `Header` (public + admin shell top bar), `Callout` (tip/warning/info), `CodeBlock` (with copy), `ConfirmDialog`, `Toast`, `StatusBadge`, `ThemeToggle`, `TagInput`, `ImageUpload`, `ProcessingPlaceholder`, `AutosaveStatus`, `Loading`, `RecipeSearch`, `RecipeTagFilter`, `FileTree`, `FileMeta`, `Typography`, `Grid`.

**Recipe-domain** (primitives used by the recipe surfaces): `RecipeCard`, `IngredientList` / `RecipeIngredients`, `StepList` / `RecipeSteps`.

**Layout / structural** (shell — surfaced via UI kits, not standalone primitives): `Layout`, `AdminLayout`, `FullPageHeader`, `ProtectedRoute`, `ScrollToTop`. *(`Header`/`Navigation` were promoted to a first-class `Header` component — see primitives above.)*

**Page sections** (composed inside UI kits): `AppsCta`, `RecipesCta`, `RecipeDetailView`, `SocialCard`, `CVDownload`, `Image`.

> Deliberately reconciled: several repo components are page-specific compositions rather than reusable primitives, so they live in the **UI kits** instead of the components library. `ProtectedRoute` / `ScrollToTop` are behavioural and have no visual surface, so they are documented only.

---

## Index / manifest

- `styles.css` — global entry point (link this one file). `@import`s only.
- `tokens/` — `fonts.css`, `colors.css` (light + dark), `typography.css`, `spacing.css`.
- `components/` — reusable React primitives (one dir each: `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md`, one `@dsCard` html).
- `ui_kits/` — full-screen recreations: `public/` (marketing + content pages) and `admin/` (authenticated shell).
- `guidelines/` — foundation specimen cards (Type, Colors, Spacing, Brand).
- `SKILL.md` — Agent-Skill manifest for downloading into Claude Code.

---

## Content fundamentals

**Voice.** First-person, calm, and dry. Akli writes as himself ("I build…", "recipes I cook on repeat", "I write these mostly to document how I solved a problem"). Confident but unshowy — it states what something is and moves on.

**Tone rules learned from the redesign:**
- **No cheese, no hype.** Avoid aspirational filler, exclamation marks, and rallying-cry closers. Lines like "earned a permanent spot in the rotation" or "mostly web, mostly honest" were explicitly rejected as too cheesy/cute. When in doubt, cut the last sentence.
- **Plain over clever.** "Email me" beats "Get in touch" (say what the button does). "Elsewhere" labels a links list better than "Contact" when it's mostly profiles.
- **Don't echo.** Body copy shouldn't restate the heading (the recipes intro was reworded specifically to stop mirroring "things I keep coming back to").
- **You + I, sparingly.** Direct address is fine but light; the "(and you)" parenthetical was dropped as too cute.

**Casing.** Sentence case everywhere for headings and UI. Section eyebrows are the one uppercase moment — short mono labels ("FROM THE KITCHEN", "THE BLOG", "TIP"). Earlier ALL-CAPS section headings were softened to sentence case at the user's request.

**Mechanics.** En-dashes and em-dashes for asides ("— written down so they're easy to make again."). Mid-dot separators in meta lines ("27 June 2026 · 7 min read"). Numerals for times/quantities. No emoji in product copy — the only emoji are the three `Callout` glyphs (💡 ⚠️ ℹ️).

**Examples (good):**
> Things I keep coming back to.
> A small, growing collection of recipes I cook on repeat — written down so they're easy to make again.
> I write these mostly to document how I solved a problem, in case it's useful to someone hitting the same wall.

---

## Visual foundations

**Overall feel.** Warm, editorial, paper-like. Generous whitespace, narrow reading columns, quiet hairlines, soft elevation. A refined inversion of the repo's original loud neo-brutalism.

- **Color & background.** Flat warm off-white (`#FBFAF7`), never pure white; no gradients, textures, or images behind text. Surfaces are a slightly deeper paper tone. Dark mode is a true warm near-black (`#141310`), not blue-black.
- **Type.** Two families only — **Geist** (UI + display, 600 for headings, tight negative tracking) and **JetBrains Mono** (eyebrows, meta, tags, code). Display headings use fluid `clamp()`; long-form body is 18px / 1.75.
- **Accent.** A single blue (`#1F66E0` light, `#6BA0FF` dark) for links, focus, active filters, and the one-word "View" links. Used sparingly — most of the page is ink-on-paper.
- **Borders & radius.** 1px hairlines (`#ECE6DA`). Soft rounding: 6px chips, 10px inputs/buttons, 12px panels, 16–18px cards/dialogs, full pills for CTAs, badges, the theme toggle, and avatars.
- **Shadows.** Soft, blurred, low-opacity (`0 4px 14px rgba(0,0,0,.08)`), reserved for toasts, dropdowns, and dialogs. Cards are flat (border only) until they lift. No hard-offset shadows.
- **Hover states.** Links tint to accent; directional icons **nudge** (chevrons slide, ↗ lifts up-right) on a `.25s ease` transform. Filter chips/dashed suggestions border-tint to accent. Cards get a barely-there wash (`rgba(0,0,0,.022)`). The theme toggle shades subtly (theme-aware, not accent).
- **Press / active.** Buttons dip 1px; active filter chips fill solid accent.
- **Motion.** Restrained — `.18–.25s ease` color/border/transform transitions, spinner + shimmer for async, a small pop/fade for dialogs and slide-in for toasts. All animation respects `prefers-reduced-motion`.
- **Transparency / blur.** Only the sticky header — a `color-mix` translucent bg with `backdrop-filter: blur(10px)` so content scrolls softly beneath.
- **Layout.** Centered, max-width columns: 1080px shell, 720px index/hero reading column, 680px article column, ~54ch hero measure. Sticky header; in the editor a sticky right action rail.

---

## Iconography

- **Style.** Inline SVG, outline only — `stroke="currentColor"`, ~`stroke-width: 2`, round caps/joins (Lucide-grade geometry). No filled icons, no icon font, no PNG icons. Icons inherit text color and sit at 13–18px.
- **Where.** Sparingly and functionally: chevrons (back/forward), ↗ external, search glyph, eye (preview), trash (delete/remove), plus (add), upload, lock (locked slug), check / alert (status, autosave), arrows in CTAs. Directional icons animate on hover.
- **Emoji.** Only the three `Callout` type glyphs (💡 tip, ⚠️ warning, ℹ️ info). Never elsewhere in product copy.
- **Unicode.** A few typographic glyphs stand in for icons in dense spots: `☾`/`☀` (theme toggle), `✓`/`✕` (toast/tag/checklist), `·` (meta separators), `↗`/`←` (links).
- **Substitution note.** Icons in this system are hand-inlined SVG paths matched to the redesign; if you need a fuller set, **Lucide** (same outline weight) is the drop-in match.

> **Fonts:** Geist + JetBrains Mono load from Google Fonts (`tokens/fonts.css`). The original repo used system-font stacks; this is a deliberate redesign change. Swap to self-hosted woff2 `@font-face` for production if you want zero external requests.
