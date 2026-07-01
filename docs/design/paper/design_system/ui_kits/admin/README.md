# Admin — UI kit

A recreation of the **authenticated admin** surface: a common shell wrapping every logged-in view.

`index.html` shows the **Recipe list** (admin home): the shell header (brand → public site, Recipes/Users nav, signed-in email, Log out, theme toggle), the page header with "New recipe", and the recipe rows — each with title, tags, a `StatusBadge` (Published/Draft), last-updated date, and per-row actions (Edit / Preview / Publish-Unpublish / Delete).

The same shell carries the other admin views:
- **Recipe editor** — long autosave form (`AutosaveStatus`, `TagInput`, `ImageUpload`, `ProcessingPlaceholder`) with a sticky action rail + publish checklist.
- **Recipe preview** — read-only public render behind a status banner.
- **Users** — role/status table, inline invite form, `ConfirmDialog` on remove.
- **Login** — the one screen *outside* the shell (centered card, with the public header/footer).

**Composes:** `StatusBadge`, `Button`, `ConfirmDialog`, `Toast`, `ThemeToggle`, plus the editor form components.
