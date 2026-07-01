**Toast** — quiet notification in a bottom-right stack. The whole pill dismisses on click; a faint ✕ fades in on hover (no always-on close button, no bold accent bar). Auto-dismiss after ~3.6s in your container logic.

```jsx
<Toast tone="success" onDismiss={drop}>Invite sent to sam@acme.com.</Toast>
```
Needs `.ds-toast:hover .ds-toast-x{opacity:1}` from the bundle.
