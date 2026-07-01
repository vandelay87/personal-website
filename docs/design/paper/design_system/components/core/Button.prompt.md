**Button** — the brand's primary action control; use for any submit/confirm/CTA. Solid (inverted dark on paper) for the main action, outline for secondary, danger for destructive.

```jsx
<Button variant="solid" onClick={save}>Publish</Button>
<Button variant="outline">Discard draft</Button>
<Button variant="solid" shape="pill" iconRight={<Arrow/>}>Email me</Button>
<Button variant="danger" loading>Removing…</Button>
```

- **shape**: `pill` for public marketing CTAs, `rounded` (10px) for admin/forms.
- **variant**: `solid` | `outline` | `danger`.
- **loading** swaps content for a spinner and disables the button.
- Requires the `@keyframes btn-spin` from the components bundle (or define `0%→360%` rotate) for the loading spinner.
