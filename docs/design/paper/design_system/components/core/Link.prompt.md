**Link** — text link that inherits color and tints to accent on hover; an optional directional icon nudges on hover (the site's signature micro-interaction).

```jsx
<Link href="/blog" tone="muted" icon={<ChevronLeft/>} iconSide="left" nudge="left">All posts</Link>
<Link href="/recipe" tone="accent" icon={<UpRight/>} nudge="up-right">View public page</Link>
```

- **nudge**: `left` (back links), `right` (forward), `up-right` (external ↗).
- Relies on the bundle's `.ds-link` / `.ds-link-ic` hover rules (color + transform). In a standalone context, replicate: `.ds-link:hover{color:var(--accent)} .ds-link-ic{transition:transform .25s}`.
