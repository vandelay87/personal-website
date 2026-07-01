**ImageUpload** — async image field with three states. Drive `state` from your upload lifecycle: `empty` (dropzone) → `processing` (shimmer) → `ready` (preview + remove). Pair the ready state with a separate alt-text Input.

```jsx
<ImageUpload state={cover.state} url={cover.url} onUpload={pick} onRemove={clear} />
<ImageUpload state={s} height="96px" label="Add step image" />  {/* step thumb */}
```
Needs the bundle's `.ds-shimmer`, `.ds-spinner` animations.
