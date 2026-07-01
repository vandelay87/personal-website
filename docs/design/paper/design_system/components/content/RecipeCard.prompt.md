**RecipeCard** — image-topped card for the recipes grid (and the home "From the Kitchen" rail). Cover photo (3:2), title, one-line description, mono prep/cook/serves meta. On hover the whole card lifts (translateY + soft shadow) and the cover zooms slightly — the site's signature card interaction (needs `.ds-recipe-card` / `.ds-recipe-img` from the bundle; both respect `prefers-reduced-motion`).

```jsx
<RecipeCard href="/recipes/thai-basa" img={cover}
  title="Mild Thai-Style Basa & Coconut Rice"
  desc="A comforting Thai-infused rice and fish one pot."
  prep="5 min" cook="30 min" serves="2" />
```
