**TagInput** — the recipe-editor tag control: removable chips, an add-on-Enter field, and clickable suggestions from the existing tag pool. Manages its own draft text; you own the `tags` array.

```jsx
<TagInput tags={tags} suggestions={allTags} onAdd={add} onRemove={remove} />
```
Composes `Tag`. Needs `.ds-suggest:hover{color:var(--accent);border-color:var(--accent)}` from the bundle.
