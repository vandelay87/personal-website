# Public site — UI kit

A full-fidelity recreation of the **public akli.dev** content surface in the redesign's warm-paper aesthetic.

`index.html` shows the **Recipes index** as a representative screen: the sticky site header (brand + Apps/Recipes/Blog + theme toggle), the mono-eyebrow hero, the search + category-filter row, the recipe grid, and the footer ("Elsewhere" + akli.dev).

The same shell, type, and components carry every public page — Home, Apps, Blog, blog post (long-form article column + `CodeBlock` + `Callout`), and recipe detail (sticky ingredients card + numbered method).

**Composes:** `Link`, `Tag` (filter chips), `Input` (search), `RecipeCard`, `ThemeToggle`, plus the header/footer shell.
