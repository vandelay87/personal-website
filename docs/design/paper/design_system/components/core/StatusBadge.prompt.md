**StatusBadge** — mono dot-pill for record state. Map domain states to tones: Published/Confirmed → `success`, Draft/Pending → `warning`, Failed → `error`.

```jsx
<StatusBadge tone="success">Published</StatusBadge>
<StatusBadge tone="warning">Draft</StatusBadge>
<StatusBadge tone="neutral" dot={false}>Archived</StatusBadge>
```
