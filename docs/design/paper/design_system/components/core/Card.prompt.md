**Card** — the brand's rounded container (16px radius, hairline border). Base box for recipe cards, side panels, callouts, dialogs.

```jsx
<Card fill padding="22px">Ingredients…</Card>
<Card hover onClick={open}>Clickable recipe card</Card>
```

- **fill** uses the surface tone; default uses page background.
- **hover** adds the subtle wash used on interactive cards (needs the bundle's `.ds-card-hover:hover{background:var(--hover)}`).
- Soft elevation isn't on by default — pass `style={{ boxShadow: 'var(--shadow-md)' }}` when a card should lift.
