---
name: akli-dev-design
description: Use this skill to generate well-branded interfaces and assets for akli.dev (Akli Aissat's personal site + recipe/blog platform), either for production or throwaway prototypes/mocks. Contains the warm-paper design language — colors, type, fonts, tokens, reusable components, and full-screen UI kits for the public site and admin.
user-invocable: true
---

Read the `readme.md` file within this skill first, then explore the other files:

- `styles.css` — link this one file; it `@import`s all tokens, fonts, and component helpers.
- `tokens/` — colors (light + dark), typography (Geist + JetBrains Mono), spacing/radius/shadow.
- `components/` — reusable React primitives grouped by concern (core, forms, feedback, overlays, navigation, content). Each has `<Name>.jsx`, a `<Name>.d.ts` props contract, and a `<Name>.prompt.md` usage note.
- `ui_kits/public` and `ui_kits/admin` — full-screen recreations showing how the pieces compose.
- `guidelines/` — foundation specimen cards (Type, Colors, Spacing).

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out and produce static HTML for the user to view. If working on production code, copy assets and follow the rules here to design as an expert in this brand.

Core rules to honor:
- Warm paper (`#FBFAF7`), never pure white; true warm near-black in dark mode. Light/dark theming is first-class — support both.
- Two fonts only: Geist (UI/display) + JetBrains Mono (eyebrows/meta/tags/code).
- One blue accent, used sparingly. Hairline borders, soft rounding, soft low-opacity shadows.
- Voice: first-person, plain, dry. No hype, no cheese, sentence case, mono uppercase eyebrows only. No emoji except the three Callout glyphs.
- Outline SVG icons (Lucide-grade); directional icons nudge on hover.

If the user invokes this skill without other guidance, ask what they want to build, ask a few clarifying questions, and act as an expert designer who outputs HTML artifacts **or** production code depending on the need.
