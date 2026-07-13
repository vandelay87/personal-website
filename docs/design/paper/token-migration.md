# Token migration: neo-brutalist → warm paper

This is the old→new mapping for `src/styles/tokens.css`, produced while migrating every
consumer under `src/**` off the old neo-brutalist token set (issue #218). It's a permanent,
greppable reference — cite it when a future PR touches a token that moved or was removed.

Old token snapshot used for this table: the pre-#218 `src/styles/tokens.css` (neo-brutalist
system). New token set: the current `src/styles/tokens.css` (warm paper system), source of
truth `docs/design/paper/design_system/tokens/`.

## 1. Same name, new value (no meaning change)

These kept their custom-property name; only the value changed. No consumer edits were needed
beyond what the cascade already does automatically.

| Token(s) | Old | New | Note |
|---|---|---|---|
| `--font-sans` / `--font-mono` | system stacks | `'Geist'…` / `'JetBrains Mono'…` | Fonts self-hosted in #219; families won't render until then (expected, already commented in tokens.css) |
| `--font-weight-normal/medium/semibold/bold` | 400/500/600/700 | 400/500/600/700 | unchanged |
| `--font-size-lg` | 1.125rem (18px) | 1.125rem (18px) | value coincides; role shifts from generic "lg" to "long-form body" |
| `--font-size-2xl` | 1.5rem (24px) | 1.5rem (24px) | value coincides |
| `--line-height-normal` | 1.5 | 1.5 | unchanged |
| `--space-1/2/3/4/6/8/10/12/16/20` | 4/8/12/16/24/32/40/48/64/80px | identical | unchanged — new scale only *adds* `--space-5` (20px) and `--space-24` (96px), nothing removed |
| `--radius-full` | 9999px | 999px | effectively unchanged (pill/avatar role) |
| `--z-header` | 10 | 20 | value bumped, same role |
| `--duration-fast` | 150ms | 180ms | value bumped |
| `--duration-base` | 200ms | 250ms | value bumped |
| `--easing-default` | `ease` | `ease` | **unchanged** — listed as an example in the issue but verified identical; no migration needed |
| `--max-w-site` | 64rem (1024px) | 1080px | value bumped, same role (shell/header/footer width) |
| `--color-on-primary` | `#FFFFFF` | `#FFFFFF` | unchanged |

Most other font sizes, line heights, and colors changed *values* as part of a broader
restructure — see §2 and the meaning-flip table (§4) rather than treating them as simple
value swaps.

## 2. Renamed / restructured

The color and typography layers were substantially restructured, not just re-valued:

- **New text hierarchy**: `--color-text-strong` / `--color-text` / `--color-text-muted` /
  `--color-text-faint` (4 steps, was 3: `--color-text` / `--color-text-strong` /
  `--color-text-muted`). `--color-text-faint` is new — didn't exist before.
- **New surface tiers**: `--color-bg` (page) / `--color-surface` (cards, chips, inset panels)
  / `--color-field` (form inputs) / `--color-hover` (row/cell hover wash) replace the old
  two-tier `--color-bg` / `--color-bg-subtle` / `--color-surface` (old `--color-surface` was
  just an alias of white, doing no real work).
- **New border tiers**: `--color-border` (hairline) / `--color-border-strong` (button
  outlines, interactive borders) replace `--color-border` / `--color-border-subtle`.
- **Status colors gained `-bg` tint variants**: `--color-success-bg`, `--color-warning-bg`,
  `--color-error-bg` are new (no old equivalent).
- **New inverted-button pair**: `--color-btn-bg` / `--color-btn-fg` (for solid/primary CTA
  buttons) — no old equivalent; old system relied on `--color-primary` for CTAs.
- **New short alias layer**: `--bg --surf --field --hover --text --subtle --muted --faint
  --line --btn-border --accent --btn-bg --btn-fg --green(-bg) --amber(-bg) --danger(-bg)` —
  entirely new, not present in the old token set. Nothing in `src/**` referenced these names
  before, so no migration was needed; they're available for future work.
- **New radius scale**: `--radius-sm/md/lg/xl/2xl` replace the old flat `--radius-sm` (the
  only non-zero, non-full radius the old system had) with a 5-step scale. See §3 for how
  `--radius-none` (deleted) was distributed across it.
- **New shadow tier**: `--shadow-xl` added (dialogs); `--shadow-sm/md/lg` kept their names
  (see meaning flip, §4).
- **New layout scale**: `--max-w-reading` (720px) / `--max-w-article` (680px) /
  `--max-w-prose` (54ch) replace the old `--max-w-xs/sm/md/lg/2xl` five-step scale. See §3.
- **New z-index tier**: `--z-overlay` (60) / `--z-toast` (80) added alongside `--z-header`.
- **New focus token**: `--ring` (color-mix-based focus ring) — no old equivalent (old system
  used a hardcoded `2px solid var(--color-primary)` outline per-component).

## 3. Deleted with no direct replacement

| Old token | Refs migrated | Replacement | Reasoning |
|---|---|---|---|
| `--radius-none` | 45 (29 files) | Per-component pick from `--radius-sm/md/lg/xl/2xl` | No single soft-radius token maps 1:1 to "no radius". See §3a for the per-component table. |
| `--color-bg-subtle` | 24 (14 files) | `--color-surface` (panel/chip backgrounds) or `--hover` (hover-state wash) | New system's `--color-surface` comment literally reads "cards, chips, inset panels" — the exact role `--color-bg-subtle` played. One consumer (`TagInput` `.option:hover`) is an actual hover state → `--hover`. See §3b. |
| `--color-border-subtle` | 10 (7 files) | `--color-border` | New `--color-border` *is* the subtle hairline (`#ECE6DA` light / `#2A2823` dark) — there's no separate "extra subtle" tier in the new system. 1:1 rename, no judgment calls. |
| `--color-primary-hover` | 2 (2 files) | `--color-primary` | New system has no hover-color tokens (per PRD). Hover states now reuse the same color. |
| `--color-link-hover` | 6 (5 files) | `--color-link` | Same reasoning as `--color-primary-hover`. |
| `--font-weight-extrabold` (800) | 2 (2 files) | `--font-weight-bold` (700) | New system's heaviest weight is 700 — Geist doesn't ship an 800 weight in the self-hosted set. |
| `--max-w-xs` / `--max-w-sm` / `--max-w-md` / `--max-w-lg` / `--max-w-2xl` | 7 (5 files) | `--max-w-article`, or a commented literal | See §3c — most of these have **no reasonable semantic fit** in the new 4-token scale. |

### 3a. `--radius-none` per-component mapping

Every component was read for its actual role and assigned per the new scale's own
documented intent (`--radius-sm`: chips/small controls, `--radius-md`: inputs/buttons,
`--radius-lg`: code panels/callouts, `--radius-xl`: cards/panels/dialogs, `--radius-2xl`:
modals, `--radius-full`: pills/avatars/circular controls).

| Role | Token | Consumers |
|---|---|---|
| Buttons, text inputs, textareas, number inputs | `--radius-md` | `Button` `.button`; `AdminLayout` `.navLink`; `IngredientList` `.input`; `RecipeSearch` (input); `TagInput` `.input`; `StepList` `.altInput`/`.textarea`; `RecipeEditor` `.input`/`.textarea`/`.numberInput`; `Login` `.input`; `UserManagement` `.input`; `Image` `.emptyPlaceholder` (compact icon box, not a chip) |
| Chips, tags, badges | `--radius-sm` | `RecipeCard` `.tag`; `RecipeDetailView` `.tag`; `TagInput` `.chip`; `StatusBadge` `.badge`; `UserManagement` `.badge`; `BlogPost` `.tag` |
| Code/content panels, callouts, banners, dropdowns | `--radius-lg` | `src/index.css` mermaid SVG (explicit AC); `Callout` `.callout`; `CodeBlock` `.wrapper`/`.pre`; `FileTree` `.tree`; `Image` `.container`; `ImageUpload` `.preview`; `ProcessingPlaceholder` `.inner`; `RecipeSteps` `.image`; `TagInput` `.listbox`; `Toast` `.toast`; `RecipePreview` `.banner`; `RecipeEditor` `.sessionBanner`/`.timeoutBanner`; `UserManagement` `.inviteForm` |
| Cards / panels | `--radius-xl` | `Card` `.card`; `RecipeCard` `.card`; `SocialCard` `.card`; `Blog` `.postCard`; `BlogPost` `.relatedCard`; `Login` `.form` |
| Dialogs / modals | `--radius-2xl` | `ConfirmDialog` `.dialog` |
| Circular / pill controls | `--radius-full` | `AutosaveStatus` `.icon` (status dot); `Loading` `.spinner`; `BlogPost` `.shareLink` (square icon button, made circular to match the pill/avatar treatment) |

**Judgment calls worth flagging:** `Image` `.emptyPlaceholder` (a small centered icon square)
went to `--radius-md` rather than `--radius-lg`, treating it as a compact control rather than
a full content panel. `BlogPost` `.shareLink` (a 40×40 icon-only button) went to
`--radius-full` rather than `--radius-md`, treating it as a circular icon button in line with
the "pills, avatars" role rather than a rectangular button — this is a visual judgment call,
not dictated by the token comments; flag for design review if a square/rounded-square icon
button was intended instead.

**Known pre-existing gap, not fixed (out of scope):** `FullPageHeader.module.css` (`.imageContainer`, `.imageRounded`) hardcodes `border-radius: 0` directly (not via a token), overriding the `Image` component's own radius for the home hero portrait. This predates #218 and was already redundant under the old system (both resolved to 0 either way). It doesn't match any removed-token reference or the named hardcoded-literal patterns (`4px 4px 0`, `#000` borders, `invert(1)`), and fixing it would visually round the home hero photo — a visual-design decision for the Home hero restyle (PRD-listed as a later issue), not a token-migration change. Flagged here for whoever picks up that issue.

### 3b. `--color-bg-subtle` per-consumer mapping

All 24 references across 14 files are panel/chip/card backgrounds and migrated to
`--color-surface` (whose new-system comment is literally "cards, chips, inset panels" — the
exact role this token played), **except one real hover state**:

- `TagInput.module.css` `.option:hover` → `--hover` (the new rgba hover-wash token), because
  this is an actual `:hover` interaction state, not a static panel background.

Everything else (`AdminLayout` sidebar bg, `Callout`, `CodeBlock` wrapper/toolbar/pre,
`FileTree` tree bg + connector line, `ThemeToggle` track, `RecipeDetailView`/`RecipeCard`/
`StatusBadge`/`UserManagement`/`BlogPost` tag/badge chips, `ProcessingPlaceholder` skeleton
panel, `Image` container/placeholder/error-overlay backgrounds, `RecipePreview` banner) →
`--color-surface`.

### 3c. `--max-w-*` per-consumer mapping

The new scale (`--max-w-site` 1080px / `--max-w-reading` 720px / `--max-w-article` 680px /
`--max-w-prose` 54ch) is entirely made of **text reading-column widths**. The old scale's
`--max-w-xs/sm/md/lg/2xl` (320/384/448/512/672px) was used partly for reading columns and
partly for component-box widths (dialogs, cards, a portrait image) that have nothing to do
with text measure. Each usage was evaluated on its own layout role:

| Consumer | Old | Role | Resolution |
|---|---|---|---|
| `AppsCta.module.css` `.inner`, `CVDownload.module.css` `.inner` | `--max-w-2xl` (672px) | Centered CTA text section | **Clean fit** → `--max-w-article` (680px, 1% off). Semantically right (a text-centered content block) and numerically almost exact. |
| `ConfirmDialog.module.css` `.dialog`, `SocialCard.module.css` `.card`, `ToastProvider.module.css` `.container` | `--max-w-sm` (384px) | Modal dialog / compact footer card / toast stack width | **Resolved (issue #233):** the design system gained a `--max-w-sm` (24rem / 384px) compact-component-box tier, added alongside the reading-column scale specifically for non-text boxes. All three consumers, previously kept as commented `24rem` literals, now reference `var(--max-w-sm)`. |

`FullPageHeader.module.css` no longer exists in the codebase (the hero portrait now lives in
`Home.module.css` `.photo`, sized with a `clamp()`, not a breakpoint-tiered max-width), so the
`20rem`/`28rem`/`32rem` literals this section originally described have nothing left to
migrate. `Login.module.css` `.column` uses `max-width: 392px`, not `24rem` — a different value,
not this token's consumer — so it was left untouched by #233 (swapping in `--max-w-sm` would
shrink it by 8px, a real visual change, not a refactor).

**Deviation from the "always use the nearest existing token" instruction (historical, #218):**
before #233 added `--max-w-sm`, using the nearest available token (`--max-w-article`, 680px)
for the cases above would have visibly broken the component (dialog/card nearly doubling in
width). That's why they were kept as flagged literals rather than forced onto `--max-w-article`
at the time — #233 is the "later" this note referred to.

## 4. Meaning flips (name unchanged, semantics changed)

These keep their old name but now mean something different — a consumer that didn't change
a single character gets new behavior "for free," which is intended, not a bug:

- **`--border-width`**: 2px → 1px. **`--border-width-thick`**: 3px → 1.5px. The old
  brutalist heavy border becomes a hairline. Every consumer using these names automatically
  gets the new, thinner look.
- **`--color-border`**: `#000000` (near-black, light mode) → `#ECE6DA` (light hairline). Any
  consumer still referencing `--color-border` gets the new soft hairline automatically — this
  is the single biggest "free" visual change in the migration.
- **`--radius-sm`**: 2px → 6px. Same *role* (the smallest non-zero radius) but now
  perceptibly rounded instead of a barely-there corner clip.
- **`--shadow-sm` / `--shadow-md` / `--shadow-lg`**: hard `Npx Npx 0 var(--color-border)`
  offset shadows (brutalist) → soft `0 Ypx Zpx rgba(0,0,0,alpha)` blur shadows (paper
  elevation). Same names, completely different rendering technique. `--shadow-xl` is new
  (dialogs).

## 5. `src/index.css` — hardcoded literals (not token references)

Two spots in `src/index.css` used hardcoded values rather than tokens, so a token-name grep
wouldn't catch them:

- **Mermaid SVG base rule** (`svg[id^="mermaid-"]`): `border-radius: var(--radius-none)` →
  `var(--radius-lg)` (code panel/callout role, per the new scale's own comment).
- **Mermaid dark-mode override** (`[data-theme="dark"] svg[id^="mermaid-"]`): previously
  `filter: invert(1) hue-rotate(180deg); border-color: #000000; box-shadow: 4px 4px 0
  #000000;`. Reworked to:
  - Drop the hardcoded `border-color`/`box-shadow` overrides entirely — the base rule's
    `var(--color-border)` and `var(--shadow-md)` already resolve to their dark-mode values via
    the token cascade, and because `filter` inverts the *rendered pixels* of the element
    (including its own border/shadow paint), the dark-mode `--color-border` (dark) becomes a
    light hairline post-invert, and the theme-invariant `--shadow-md` (a black soft shadow)
    becomes a soft *light* glow post-invert — both correct against the dark page background,
    with zero hardcoding.
  - Changed `invert(1)` → `invert(0.88)`. A full 100% invert reproduces the old system's harsh
    pure-black/white swap, which reads wrong against the new soft, warm dark palette. A
    fractional invert still turns Mermaid's white diagram background dark while landing on a
    soft near-black rather than a jarring true black — kept `hue-rotate(180deg)` unchanged, it
    still corrects the hue shift on any coloured diagram nodes.
  - Mermaid's own dark theme (via rehype/MDX plugin config) would be the more "correct"
    long-term fix, but that's outside `src/**` CSS and outside this issue's scope.

- **Mermaid dark-mode label-text fix** (added later, unrelated to this migration): mermaid's
  own inline `<style>` tags set node/edge/cluster label text to `#333`, which reads as a
  muddy mid-gray rather than near-white after the `invert(0.88)` filter above (measured: 51,51,51
  only inverts to mid-gray, not the ~224,224,224 pure black gets). Fixed by forcing
  `color`/`fill: #000 !important` on the label-bearing tag names (`span`/`p`/`text`/`tspan`)
  inside `[data-theme="dark"] svg[id^="mermaid-"]`, so the pre-invert input is pure black and
  the post-invert output is near-white. The `#000` here is a **required literal, not a token**
  — the invert-filter math needs an exact pure-black input, and no `--color-*` token is pure
  black — so it's a permanent, intentional exception to the §6 "no hardcoded brutalist literal"
  grep, not a regression (it postdates this migration entirely).

## 6. Verification

```
# No src/** file references a removed token:
grep -rn -- "radius-none\|color-bg-subtle\|color-border-subtle\|color-primary-hover\|color-link-hover\|font-weight-extrabold\|max-w-xs\|max-w-md\|max-w-lg\|max-w-2xl" src
# → no output
```

`--max-w-sm` was dropped from this pattern (it was present at the original time of writing):
issue #233 reinstated `--max-w-sm` as a legitimate current token (§3c) — it's no longer a
removed token, so keeping it in this pattern would false-positive on its own real consumers
(`ConfirmDialog`, `SocialCard`, `ToastProvider`).

```
# No hardcoded brutalist literals remain:
grep -rniE "#000000|#000\b|invert\(1\)|[0-9]px [0-9]px 0" src
# → src/index.css: one `invert(1)` match inside a comment (prose explaining what is
#   *not* used, not code) and two `#000 !important` declarations (the mermaid
#   dark-mode label-text fix documented above). Both are known, justified exceptions
#   that postdate this migration — not brutalist regressions. No other output expected.
```

Both patterns are clean of genuine neo-brutalist-era CSS as of this migration; the
`src/index.css` exceptions above are later, unrelated, and independently justified.
