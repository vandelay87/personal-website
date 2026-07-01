**Tag** — mono chip for tech tags, recipe categories, and filters.

```jsx
<Tag>react</Tag>                                   {/* static tech tag */}
<Tag as="button" active>all</Tag>                  {/* selected filter */}
<Tag as="button" onClick={pick}>Baking</Tag>       {/* filter chip */}
<Tag removable onRemove={drop}>Thai</Tag>          {/* editor input */}
```

- **active** fills with accent (selected filter).
- **removable** appends a ✕; pair with `TagInput` for the editor.
- Hover tint on filter buttons comes from the bundle's `.ds-tag-btn:hover`.
