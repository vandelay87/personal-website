**Input** — single-line field. Focus shows the accent ring; `invalid` turns it error-red. Use `prefixIcon` for search, `suffix` for a clear button.

```jsx
<Input placeholder="name@example.com" invalid />
<Input prefixIcon={<Search/>} suffix={<Clear/>} placeholder="Search recipes…" />
```
Needs the bundle's `.ds-field:focus{border-color:var(--accent);box-shadow:var(--ring)}`.
