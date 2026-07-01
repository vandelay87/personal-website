**ThemeToggle** — round icon button in the header that flips the theme. On hover it shades subtly (darker in light mode, lighter in dark) via `.ds-toggle:hover`. Persist to `localStorage('akli-theme')` and set `[data-theme]` on a root ancestor.

```jsx
<ThemeToggle theme={theme} onToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />
```
