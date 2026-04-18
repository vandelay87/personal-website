# PRD: Admin Interface

## Overview

Add an authenticated admin interface to akli.dev for managing recipes and users. This includes a login page, auth context with protected routes, a recipe editor with image upload and draft/publish workflow, a recipe preview, and an admin-only user management page. This is PRD 4 of 4 in the recipes epic, building on the Cognito auth (PRD 1), recipe API (PRD 2), and public recipe pages (PRD 3).

## Problem Statement

The recipe API (PRD 2) provides CRUD endpoints, but there is no UI for authenticated users to create, edit, or manage recipes. There is also no way to log in, manage user accounts, or access protected functionality from the frontend. Without this, the recipe system is unusable.

## Goals

- Provide a login page that authenticates against Cognito via the SRP protocol.
- Protect admin routes so only authenticated users can access them.
- Enable recipe creation and editing with a structured form (title, cover image, intro, ingredients, steps with images, tags, metadata).
- Support draft/publish workflow with a preview mode.
- Provide tag autocomplete from existing tags when adding tags to a recipe.
- Enable admin-only user management (invite by email, list users, remove users).
- Follow the existing neo-brutalist design system consistently.

## Non-Goals

- **Role changes** — changing a user's role (contributor → admin) after creation is deferred.
- **Bulk operations** — deleting or publishing multiple recipes at once is deferred.
- **Drag-and-drop reordering** — move up/down buttons are used for ingredient and step reordering in v1. Drag-and-drop can be added later.
- **Drag-and-drop file upload** — the `ImageUpload` component is click-to-upload only in v1. Drag-and-drop file handling can be added later.
- **Forgotten password flow** — users can contact the admin to reset their account. Self-service password reset is deferred.
- **Recipe analytics** — view counts, popular recipes, etc. are not in scope.
- **Offline support** — no service worker or local storage persistence for draft recipes.
- **Public-facing login link** — the admin is accessed by navigating directly to `/admin`. No link in the nav or footer.

## User Stories

- As the site owner, I want to log in with my email and password so that I can access the admin interface.
- As a new user with a temporary password, I want to set a new password on first login so that my account is secure.
- As an authenticated user, I want to create a new recipe with all fields (title, cover image, intro, ingredients, steps, tags, prep/cook time, servings) so that I can add to my collection.
- As an authenticated user, I want to edit an existing recipe so that I can fix mistakes or update content.
- As an authenticated user, I want to preview how a recipe will look on the public site before publishing.
- As an authenticated user, I want to save a recipe as a draft so that I can work on it over multiple sessions.
- As an authenticated user, I want to publish a draft recipe so that it becomes visible to visitors.
- As an authenticated user, I want to unpublish a recipe so that I can take it back to draft.
- As an authenticated user, I want to delete a recipe I created.
- As an authenticated user, I want to upload a cover image and step images, with automatic resizing handled by the backend.
- As an authenticated user, I want to add tags to a recipe with autocomplete suggestions from existing tags.
- As an authenticated user, I want to reorder ingredients and steps using move up/down buttons.
- As an admin, I want to see a list of all users with their roles and status.
- As an admin, I want to invite a new user by email so that they receive a temporary password.
- As an admin, I want to remove a user so that they can no longer access the admin.
- As an unauthenticated user visiting `/admin`, I want to be redirected to the login page.

## Design & UX

### Login Page — `/admin/login`

Minimal, centred form following the neo-brutalist design:

- Email input field
- Password input field
- "Log in" submit button
- Error message display (wrong credentials, network error)
- On success, redirect to `/admin/recipes`

**First-login flow (NEW_PASSWORD_REQUIRED):**
- After submitting credentials, if the API returns a challenge, show a "Set new password" form
- New password input + confirm password input
- Submit calls `POST /auth/confirm-new-password` with the session token
- On success, redirect to `/admin/recipes`

**States:**
- **Default:** Empty form
- **Submitting:** Button disabled with loading indicator
- **Error:** Inline error message below the form (e.g. "Incorrect email or password")
- **Challenge:** New password form replaces the login form

### Admin Layout

All `/admin/*` routes share a common admin layout:

- Simple top bar with: site name (linked to homepage), current user email, "Log out" button
- Sidebar or tab navigation with: "Recipes" (all users), "Users" (admin only)
- Main content area

### Recipe List — `/admin/recipes`

Table/list of the current user's recipes (contributors see only theirs, admins see all):

- Columns: title, status (draft/published badge), tags, last updated
- Actions per row: Edit, Preview, Publish/Unpublish, Delete
- "New recipe" button at the top
- Empty state: "No recipes yet. Create your first recipe."

**States:**
- **Loading:** Skeleton table rows
- **Empty:** Empty state message with CTA
- **Error:** Error message with retry

### Recipe Editor — `/admin/recipes/new` and `/admin/recipes/:id/edit`

Structured form with sections:

**Basic info:**
- Title (text input, required)
- Intro (textarea, required)
- Cover image (upload area with preview, required)
  - Click to upload
  - Shows image preview after upload
  - "Replace" button to change the image
  - Alt text input (required)

**Metadata:**
- Prep time (number input, minutes)
- Cook time (number input, minutes)
- Servings (number input)

**Tags:**
- Tag input with autocomplete dropdown
- As the user types, matching existing tags appear in a dropdown
- Pressing Enter or clicking a suggestion adds the tag
- If no match, the typed text becomes a new tag
- Tags display as removable chips/badges below the input

**Ingredients:**
- Dynamic list of ingredient rows
- Each row: quantity (text input), unit (text input), item (text input, required)
- "Add ingredient" button at the bottom
- Move up/down buttons on each row (disabled at boundaries)
- Remove button on each row (require at least 1 ingredient)

**Steps:**
- Dynamic list of step rows
- Each row: step text (textarea, required), optional image upload with alt text
- "Add step" button at the bottom
- Move up/down buttons on each row (disabled at boundaries)
- Remove button on each row (require at least 1 step)
- Step numbers auto-update when reordered

**Form actions:**
- "Save as draft" — saves without publishing
- "Publish" — saves and sets status to published
- "Save changes" — when editing, saves without changing status
- "Delete" — with confirmation dialog
- All save actions show a success toast/notification

**Validation:**
- Title is required
- Cover image with alt text is required
- At least one ingredient (with item filled) is required
- At least one step (with text filled) is required
- Validation errors shown inline next to the relevant field
- Save buttons are always enabled. On submit, validation runs and errors are shown inline. This is more accessible than disabling the button (users can discover what's wrong by attempting to save)

**States:**
- **Loading (edit mode):** Skeleton form while recipe data loads
- **Submitting:** Save button disabled with loading indicator
- **Success:** Toast notification "Recipe saved" / "Recipe published"
- **Error:** Inline error or toast for API failures
- **Unsaved changes:** If the user tries to navigate away with unsaved changes, show a confirmation prompt

### Recipe Preview — `/admin/recipes/:id/preview`

Renders the recipe exactly as it appears on the public detail page (reuses the `RecipeDetail` component from PRD 3), but:
- Works for both draft and published recipes
- Shows a banner at the top: "Preview — this recipe is not yet published" (for drafts)
- "Edit" and "Publish" buttons in the banner

### User Management — `/admin/users` (admin only)

**User list:**
- Table: email, role (admin/contributor badge), status (confirmed/pending)
- Remove button per user (not for the current user — cannot remove yourself)
- "Invite user" button at the top

**Invite form:**
- Modal or inline form
- Email input (required, validated as email format)
- Role select: admin or contributor
- "Send invite" button
- Success message: "Invite sent to {email}"

**States:**
- **Loading:** Skeleton table
- **Empty:** "No other users. Invite someone to collaborate."
- **Error:** Error message with retry
- **Invite success:** Success toast
- **Invite error:** Inline error (e.g. "User already exists")
- **Remove confirmation:** Confirmation dialog before removing a user

### Design System Compliance

All admin components follow the existing neo-brutalist system:
- `var(--radius-none)` on all elements — no rounded corners
- Hard-edged shadows (`var(--shadow-sm)`, `var(--shadow-md)`) on cards and form containers
- `var(--border-width)` solid borders on inputs
- Design tokens for colours, spacing, typography
- Dark mode support via `data-theme` tokens
- System font stacks (no custom fonts)

## Technical Considerations

### Auth Library

**Option chosen: direct Cognito API calls via `fetch`** rather than `amazon-cognito-identity-js`. The library is ~100KB+, bundles `crypto-js`, and is effectively deprecated in favour of `@aws-amplify/auth`. Since this is a small personal site, calling the Cognito `InitiateAuth` and `RespondToAuthChallenge` APIs directly via `fetch` avoids the dependency entirely. Passwords are transmitted over HTTPS (encrypted in transit), and the auth Lambda (PRD 1) handles the server-side Cognito SDK calls.

**Note:** This means the auth flow uses `USER_PASSWORD_AUTH` (not SRP) from the client perspective — the client sends `{ email, password }` to `POST /auth/login`, and the auth Lambda handles the Cognito interaction. PRD 1's Lambda already supports this. The SRP flow (`USER_SRP_AUTH` on the Cognito user pool client) would only be needed if the client spoke directly to Cognito, which it does not — it goes through our API. **PRD 1 should be updated to also enable `USER_PASSWORD_AUTH` on the user pool client alongside `USER_SRP_AUTH`**, or the Lambda can use `AdminInitiateAuth` which bypasses client auth flow restrictions.

This eliminates the `amazon-cognito-identity-js` dependency entirely.

### Auth Context & Protected Routes

**`src/contexts/AuthContext.tsx`:**
- React context providing: `user` (current user info including email, groups), `isAuthenticated`, `isAdmin`, `login()`, `logout()`, `getAccessToken()`.
- On mount, check `localStorage` for an existing valid session. If the access token is expired, use the refresh token to obtain a new one.
- `login()` initiates the SRP auth flow and returns the result (success or challenge).
- `logout()` clears the session and redirects to `/admin/login`.
- `getAccessToken()` returns the current access token string for API calls (auto-refreshes if expired).

**`src/components/ProtectedRoute/ProtectedRoute.tsx`:**
- Wraps admin routes. If not authenticated, redirects to `/admin/login`.
- Accepts an optional `requiredRole` prop (e.g. `"admin"`) for admin-only pages.
- Shows a loading spinner while checking auth state on initial mount.

### Auth API Service

**`src/api/auth.ts`:**
- `login(email, password): Promise<AuthResult>` — wraps Cognito SRP flow
- `completeNewPassword(user, newPassword): Promise<void>` — handles challenge
- `logout(): void`
- `refreshSession(): Promise<CognitoUserSession>`
- `getCurrentSession(): Promise<CognitoUserSession | null>`

**`src/api/users.ts`:**
- `fetchUsers(): Promise<User[]>` — `GET /auth/users` (admin only)
- `inviteUser(email, role): Promise<void>` — `POST /auth/users`
- `removeUser(userId): Promise<void>` — `DELETE /auth/users/{userId}`

All authenticated API calls use `getAccessToken()` from AuthContext to attach the `Authorization: Bearer` header.

### Recipe API Service Extension

Extend `src/api/recipes.ts` (from PRD 3) with authenticated endpoints:
- `fetchMyRecipes(token): Promise<Recipe[]>` — `GET /me/recipes`
- `createRecipe(token, data): Promise<Recipe>` — `POST /recipes`
- `updateRecipe(token, id, data): Promise<Recipe>` — `PUT /recipes/{id}`
- `publishRecipe(token, id): Promise<void>` — `PATCH /recipes/{id}/publish`
- `unpublishRecipe(token, id): Promise<void>` — `PATCH /recipes/{id}/unpublish`
- `deleteRecipe(token, id): Promise<void>` — `DELETE /recipes/{id}`
- `getUploadUrl(token, params): Promise<{ uploadUrl: string, key: string }>` — `POST /recipes/images/upload-url`

### New Routes

Add to `src/App.tsx`:
```
/admin/login      → LoginPage (public)
/admin/recipes    → AdminRecipeList (protected)
/admin/recipes/new → RecipeEditor (protected)
/admin/recipes/:id/edit → RecipeEditor (protected)
/admin/recipes/:id/preview → RecipePreview (protected)
/admin/users      → UserManagement (protected, admin only)
```

### New Components

Following existing conventions (`src/components/<Name>/<Name>.tsx` + barrel + test):

- **`LoginForm`** — Email/password form with SRP auth and new-password challenge handling
- **`ProtectedRoute`** — Auth gate component with role check
- **`AdminLayout`** — Top bar + sidebar/tabs + content area for admin pages
- **`RecipeForm`** — The main recipe editor form with all sections
- **`ImageUpload`** — Reusable image upload component with presigned URL flow, preview, and replace
- **`TagInput`** — Autocomplete tag input with chip display. Fetches existing tags on mount (cached). Filters locally as the user types (no API call per keystroke — the tag list is small)
- **`IngredientList`** — Ingredient-specific dynamic list (quantity/unit/item fields, add/remove/reorder)
- **`StepList`** — Step-specific dynamic list (textarea + optional image, add/remove/reorder)
- Both share a **`useReorderableList`** hook for add/remove/move-up/move-down logic
- **`ConfirmDialog`** — Modal confirmation dialog for destructive actions (delete recipe, remove user)
- **`Toast`** — Success/error notification component

### New Pages

- **`src/pages/Login/Login.tsx`**
- **`src/pages/AdminRecipeList/AdminRecipeList.tsx`**
- **`src/pages/RecipeEditor/RecipeEditor.tsx`** — handles both create and edit
- **`src/pages/RecipePreview/RecipePreview.tsx`** — reuses `RecipeDetail` display components
- **`src/pages/UserManagement/UserManagement.tsx`**

### Image Upload Flow

1. User selects a file in the `ImageUpload` component.
2. Component shows a local preview via `URL.createObjectURL()`.
3. Component calls `getUploadUrl()` to get a presigned S3 URL and the S3 key.
4. Component uploads the file directly to S3 via `PUT` to the presigned URL.
5. On success, the S3 key is stored in the form state (e.g. `coverImage.key`).
6. The thumbnail variant becomes available after the resizer Lambda processes it (typically <5 seconds). The component can poll or show the local preview until the processed image is accessible.
7. On error, show an inline error message with a retry option.

### SSR Considerations

Admin pages do **not** need SSR — they are client-side only:
- No SEO value for admin pages
- Auth state is client-side (localStorage)
- Register `/admin/*` routes in `meta.ts` as known routes returning 200

**Critical:** The entire `/admin/*` route subtree must be **lazy-loaded** using React's `lazy()` + `Suspense`. This prevents admin components (which access `localStorage`, `window`, etc.) from being included in the SSR bundle and executing server-side where these APIs don't exist. The SSR render will output the `Suspense` fallback (a minimal loading shell), and the client hydrates and loads the admin bundle on demand. This also has the benefit of keeping admin code out of the main bundle — visitors who never visit `/admin` don't download it.

### Environment Variables

The Cognito user pool ID and client ID need to be available to the frontend:
- Use Vite environment variables: `VITE_COGNITO_USER_POOL_ID` and `VITE_COGNITO_CLIENT_ID`
- These are public values (not secrets) — safe to embed in the client bundle
- Set in `.env` locally and in the GitHub Actions build environment

### Dependencies

**No new npm dependencies.** Auth is handled via direct `fetch` calls to the auth API. Form state management uses React's built-in `useState`/`useReducer` — no form library needed at this scale.

### TDD Approach

Follow test-driven development: write component tests with Vitest + Testing Library before implementing. Mock the `src/api/auth.ts`, `src/api/users.ts`, and `src/api/recipes.ts` modules in tests. Use `vi.useFakeTimers()` for debounce/timeout testing.

## Acceptance Criteria

### Login
- [ ] `/admin/login` displays a login form with email and password fields.
- [ ] Submitting valid credentials authenticates via SRP and redirects to `/admin/recipes`.
- [ ] Submitting invalid credentials shows an inline error message "Incorrect email or password".
- [ ] The submit button is disabled and shows a loading state while authentication is in progress.
- [ ] If the API returns `NEW_PASSWORD_REQUIRED`, the login form is replaced with a "Set new password" form.
- [ ] The new password form requires the new password to be entered twice (confirmation). Mismatched passwords show an inline error.
- [ ] After successfully setting a new password, the user is redirected to `/admin/recipes`.
- [ ] Network errors show a generic "Something went wrong. Please try again." message.

### Auth Context & Protected Routes
- [ ] Visiting any `/admin/*` route (except `/admin/login`) while unauthenticated redirects to `/admin/login`.
- [ ] After login, the user is redirected to the originally requested admin page. The attempted URL is preserved in a query parameter (e.g. `/admin/login?redirect=/admin/users`).
- [ ] A loading spinner is shown while auth state is being checked on initial page load.
- [ ] `logout()` clears the session, removes tokens from localStorage, and redirects to `/admin/login`.
- [ ] Expired access tokens are automatically refreshed using the refresh token. If the refresh token is also expired, the user is redirected to login.
- [ ] Admin-only pages (`/admin/users`) redirect non-admin (contributor) users to `/admin/recipes` with an "Access denied" toast.
- [ ] The auth context exposes `isAdmin` based on the user's Cognito group membership.

### Admin Recipe List
- [ ] `/admin/recipes` displays a list of the current user's recipes (contributors see own, admins see all).
- [ ] Each row shows: title, status badge (draft/published), tags, last updated date.
- [ ] Each row has action buttons: Edit, Preview, Publish/Unpublish (toggles based on current status), Delete.
- [ ] "New recipe" button navigates to `/admin/recipes/new`.
- [ ] Delete shows a confirmation dialog before executing.
- [ ] Empty state shows "No recipes yet. Create your first recipe." with a CTA button.
- [ ] Skeleton rows are shown while loading. Error state shows a message with retry.

### Recipe Editor
- [ ] `/admin/recipes/new` displays an empty recipe form.
- [ ] `/admin/recipes/:id/edit` loads the existing recipe data and populates the form.
- [ ] Title input is required — form cannot be saved without it.
- [ ] Cover image upload: clicking the upload area opens a file picker. After selection, a local preview is shown. The image is uploaded to S3 via presigned URL. Alt text input is required.
- [ ] Cover image can be replaced by clicking "Replace" and selecting a new file.
- [ ] Intro textarea is required.
- [ ] Prep time, cook time, and servings are number inputs.
- [ ] Tag input shows autocomplete suggestions from existing tags (fetched from `GET /recipes/tags`) as the user types. Pressing Enter or clicking a suggestion adds the tag as a chip. Typing a non-existent tag and pressing Enter creates a new tag. Tags can be removed by clicking the X on the chip.
- [ ] Ingredients: each row has quantity, unit, and item fields. Item is required. "Add ingredient" appends a new empty row. Move up/down buttons reorder rows (disabled at top/bottom boundaries). Remove button removes the row (minimum 1 ingredient enforced — remove is disabled on the last row).
- [ ] Steps: each row has a text area (required) and optional image upload with alt text. "Add step" appends a new row. Move up/down and remove buttons work the same as ingredients (minimum 1 step). Step numbers auto-update after reordering.
- [ ] "Save as draft" saves the recipe with `status: "draft"`. "Publish" saves with `status: "published"`. When editing, "Save changes" preserves the current status.
- [ ] After a successful save, a success toast is displayed ("Recipe saved" / "Recipe published").
- [ ] Save buttons are always enabled. On submit, validation runs and errors are shown inline next to the relevant field. The first invalid field is focused.
- [ ] Client-side file validation rejects files over 10MB or non-image MIME types before uploading.
- [ ] If the user navigates away with unsaved changes, a confirmation prompt is shown. This covers both browser navigation (`beforeunload`) and React Router navigation (using `useBlocker` or equivalent). If the user's session expires mid-edit, the form state is preserved and a "Session expired — please log in again" message is shown (unsaved work is not lost).
- [ ] Image upload errors show an inline error with a retry option.
- [ ] API save errors show a toast with the error message.

### Recipe Preview
- [ ] `/admin/recipes/:id/preview` renders the recipe using the same display components as the public recipe detail page.
- [ ] Draft recipes show a banner: "Preview — this recipe is not yet published" with "Edit" and "Publish" buttons.
- [ ] Published recipes show a banner: "This recipe is published" with an "Edit" button and a link to the public page.

### User Management (Admin Only)
- [ ] `/admin/users` is only accessible to users in the `admin` Cognito group. Contributors see a 403 or are redirected.
- [ ] Displays a table of users: email, role badge (admin/contributor), status (confirmed/pending).
- [ ] "Invite user" button opens a form with email input and role select (admin/contributor).
- [ ] Email input validates email format. Submit is disabled for invalid emails.
- [ ] After a successful invite, a success toast is shown: "Invite sent to {email}".
- [ ] If the email already exists, an inline error is shown: "User already exists".
- [ ] Remove button shows a confirmation dialog. The current user cannot remove themselves (button is disabled/hidden).
- [ ] After successful removal, the user disappears from the list with a success toast.
- [ ] Skeleton rows while loading. Error state with retry.

### Design & Responsiveness
- [ ] All admin components use CSS Modules and the existing design token system.
- [ ] No rounded corners — `var(--radius-none)` on all elements.
- [ ] Form inputs have `var(--border-width) solid var(--color-border)` borders.
- [ ] Hard-edged shadows on form containers and cards.
- [ ] Dark mode is fully supported.
- [ ] Admin pages are usable on mobile (single-column layout, stacked form fields).
- [ ] Focus styles use `:focus-visible` with `outline: var(--border-width) solid var(--color-primary)`.

### Accessibility
- [ ] Login form fields have associated `<label>` elements.
- [ ] Error messages are linked to inputs via `aria-describedby`.
- [ ] Form validation errors use `aria-invalid` on the relevant input.
- [ ] Confirmation dialogs use `role="dialog"` with `aria-labelledby` and trap focus.
- [ ] Toast notifications use `role="status"` with `aria-live="polite"`.
- [ ] Tag input uses `role="combobox"` with `aria-expanded` and `aria-controls`. The dropdown uses `role="listbox"` with `aria-activedescendant` for keyboard navigation.
- [ ] Move up/down buttons have descriptive `aria-label` (e.g. "Move ingredient 2 up").
- [ ] All interactive elements are keyboard-navigable.
- [ ] The admin sidebar/tabs use appropriate `nav` landmark and `aria-current` for the active page.
- [ ] Dynamic list changes (add/remove/reorder) are announced via `aria-live="polite"` region.
- [ ] Image upload states (uploading, success, error) are announced to screen readers.
- [ ] Confirmation dialogs return focus to the triggering element on close.
- [ ] Touch targets for move up/down and remove buttons meet minimum 44x44px.

### Responsive Layout
- [ ] On mobile (<640px): admin sidebar collapses to a horizontal tab bar or hamburger menu. Recipe list becomes stacked cards instead of table rows. Form fields stack single-column. Metadata fields (prep/cook/servings) stack vertically.
- [ ] On tablet (640–1023px): sidebar visible, form fields may be two-column where appropriate.
- [ ] On desktop (1024px+): full sidebar + content layout.

### Toast Behaviour
- [ ] Toasts auto-dismiss after 5 seconds.
- [ ] Toasts have a manual dismiss (close) button.
- [ ] Toasts stack if multiple are shown simultaneously.
- [ ] Toasts use `role="status"` and `aria-live="polite"`.

### Testing

**Mocking strategy:** Tests mock `src/api/auth.ts`, `src/api/users.ts`, and `src/api/recipes.ts` modules. `amazon-cognito-identity-js` is not called directly in tests.

- [ ] `LoginForm` tests: renders form, handles successful login (redirect), handles invalid credentials (error message), handles NEW_PASSWORD_REQUIRED challenge (shows new password form), handles network error, submit button disabled while loading.
- [ ] `ProtectedRoute` tests: redirects to login when unauthenticated, renders children when authenticated, redirects non-admin from admin-only routes, shows loading spinner while checking auth.
- [ ] `AuthContext` tests: provides user info after login, handles logout (clears state), auto-refreshes expired tokens, redirects to login when refresh fails.
- [ ] `AdminRecipeList` tests: renders recipe list, shows empty state, shows status badges, handles delete with confirmation, handles publish/unpublish toggle.
- [ ] `RecipeForm` tests: renders empty form for create, populates form for edit, validates required fields (title, cover image, intro, 1 ingredient, 1 step), saves as draft, publishes, shows validation errors inline, tag autocomplete shows suggestions and adds tags, ingredient add/remove/reorder, step add/remove/reorder, shows unsaved changes prompt.
- [ ] `ImageUpload` tests: shows file picker on click, displays local preview, handles upload success, handles upload error with retry, rejects files over 10MB, rejects non-image files.
- [ ] `TagInput` tests: shows autocomplete dropdown matching input, adds tag on Enter, adds tag on click, creates new tag for non-matching input, removes tag on chip X click.
- [ ] `IngredientList` tests: adds rows, removes rows (minimum enforced), reorders with move up/down (boundary disabled).
- [ ] `StepList` tests: adds rows with text + optional image, removes rows (minimum enforced), reorders, step numbers update after reorder.
- [ ] `useReorderableList` hook tests: add, remove, moveUp, moveDown, boundary conditions.
- [ ] `RecipePreview` tests: renders recipe content, shows draft banner with Edit/Publish buttons for drafts, shows published banner with Edit button and public link for published recipes.
- [ ] `AdminLayout` tests: renders top bar with user email and logout button, sidebar shows correct nav items, active page has `aria-current`.
- [ ] `Toast` tests: renders message, auto-dismisses after 5 seconds (fake timers), manual dismiss works, uses `role="status"`.
- [ ] Login redirect-back test: after login, user is redirected to the originally requested admin URL (not always `/admin/recipes`).
- [ ] `UserManagement` tests: renders user table, invites user (success toast), handles duplicate email error, removes user with confirmation, current user cannot remove themselves.
- [ ] `ConfirmDialog` tests: renders with message, calls confirm callback, calls cancel callback, traps focus.
- [ ] Tests follow TDD — written before implementation.

