**Header** — the site shell's top bar, one component for both surfaces. Composes `ThemeToggle`; links tint to accent on hover, the active link is full-strength text (no underline bar). Sticky + translucent-blur by default.

```jsx
// public
<Header variant="public"
  links={[{label:'Apps',href:'/apps'},{label:'Recipes',href:'/recipes',active:true},{label:'Blog',href:'/blog'}]}
  theme={theme} onToggle={toggle} />

// admin — adds email + Log out
<Header variant="admin" email="akli@akli.dev" onLogout={logout}
  links={[{label:'Recipes',href:'/admin',active:true},{label:'Users',href:'/admin/users'}]}
  theme={theme} onToggle={toggle} />
```

- Sticky blur needs `.ds-header-sticky` from the bundle (`position:sticky` + `backdrop-filter`).
- Pair with the matching **footer** from the UI kits (not a separate component — it's a small static block).
