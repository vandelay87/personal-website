**AutosaveStatus** — inline indicator for no-save-button forms (the recipe editor). Drive `state` from your debounced save; compute `savedLabel` as a relative time ("Saved just now", "Saved at 2:30 PM").

```jsx
<AutosaveStatus state="saving" />
<AutosaveStatus state="saved" savedLabel="Saved just now" />
<AutosaveStatus state="error" onRetry={save} />
```
