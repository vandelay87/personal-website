**ConfirmDialog** — modal confirmation over a scrim. Use `danger` for destructive actions (delete recipe, remove user, discard draft). Scrim-click and Cancel both dismiss.

```jsx
<ConfirmDialog danger title="Remove user" confirmLabel="Remove user"
  onConfirm={remove} onCancel={close}>
  Remove sam@acme.com? They will lose access immediately.
</ConfirmDialog>
```
