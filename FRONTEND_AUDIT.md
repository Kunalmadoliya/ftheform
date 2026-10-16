# FRONTEND AUDIT: FTHEFORM REDO

**Date:** 2026-10-16  
**Auditor:** Senior Frontend Engineer  
**Status:** Phase 0 Complete — Awaiting Approval for Phase 1  

---

## 1. Constraint Confirmation

We strictly confirm and commit to the following operational boundaries:

1. **Forbidden Paths (Zero Modification Rule):**
   No files will be created, edited, moved, renamed, or deleted within:
   - `packages/**` (including `@repo/database`, `@repo/services`, `@repo/trpc`, `@repo/logger`, `@repo/eslint-config`, `@repo/typescript-config`)
   - `apps/api/**` (API server, routers, OpenAPI endpoints, rate limits)
   - `apps/web/hooks/**` (all hook definitions in `apps/web/hooks/api`, `auth`, `form`, and `use-mobile.ts`)
   - `apps/web/trpc/**` (`client.ts`, `create-client.ts`, `server.ts`)
   - `apps/web/lib/**` (`auth-client.ts`, `auth-redirect.ts`, `auth-redirect.test.ts`, `trpc-error-message.ts`, `utils.ts`)
   - `apps/web/env.ts` and `apps/web/providers/**` (`global.tsx`)
   - Every `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, `.env*`, and Drizzle migrations.

2. **Strictly No New Dependencies:**
   - No `pnpm add`, `npm install`, or `yarn add` commands will be run.
   - UI styling and motion will exclusively use native CSS, Tailwind CSS v4 inline themes/utilities, and the pre-installed `tw-animate-css`.

3. **Permitted Scope:**
   - Modifications and creations are strictly confined to:
     - `apps/web/app/**` (pages, layouts, `globals.css`)
     - `apps/web/components/**`

4. **Hook & tRPC Contract:**
   - Existing hooks and tRPC procedures must be consumed exactly as they exist today.
   - If a proposed UI element requires data or mutations that no current hook or procedure provides, we will NOT invent or stub backend endpoints. We document them as **Backend Gaps** and render clearly styled, explicit placeholders.

5. **Behavioral Integrity:**
   - All business logic, lifecycle states, security rules, concurrent lock handling, debounced autosave, visibility beacon dispatch, and CSV export guardrails must remain 100% intact.

---

## 2. Route Inventory (`apps/web/app/**`)

| Route Path | File Location | Purpose & Functionality | Components Rendered |
| :--- | :--- | :--- | :--- |
| `/` | `apps/web/app/page.tsx` | Public landing page: value proposition, product preview, features, how-it-works, footer. | Custom inline sections, `Button`, `Card`, `Badge`, `Input`, `Separator`, `ThemeToggle` |
| `/login` | `apps/web/app/login/page.tsx` | User login page: authenticates via email/password or OAuth; handles `next` redirect parameter. | `AuthForm mode="login"` |
| `/sign-up` | `apps/web/app/sign-up/page.tsx` | User registration page: registers new account; handles email verification and `next` return URL. | `AuthForm mode="sign-up"` |
| `/dashboard` | `apps/web/app/dashboard/page.tsx` | Authenticated dashboard: displays recent forms, stat cards, lifecycle filtering tabs (live/draft/archived), and form actions. | `DashboardPage` (`showAllForms={false}`) |
| `/forms` | `apps/web/app/forms/page.tsx` | Forms directory: displays complete list of user forms across lifecycle states. | `DashboardPage` (`showAllForms={true}`) |
| `/forms/[formId]/builder` | `apps/web/app/forms/[formId]/builder/page.tsx` | Form builder workspace: 3-pane form editor, field palette, drag-and-drop canvas, field inspector, settings, AI generator dock. | `BuilderPage` |
| `/builder/[formId]` | `apps/web/app/builder/[formId]/page.tsx` | **Duplicate route:** Currently renders `BuilderPage`. Will be configured to redirect to `/forms/[formId]/builder`. | `BuilderPage` (to be replaced with redirect) |
| `/form/[formUrl]` | `apps/web/app/form/[formUrl]/page.tsx` | Public respondent form interface: multi-step or full-form response flow, Web Locks concurrency, autosave, beacon sync, access policy enforcement. | `PublicFormPage`, `Button`, `Input`, `Textarea`, `StarRating` |
| `/forms/[formId]/responses` | `apps/web/app/forms/[formId]/responses/page.tsx` | Form-specific response inspector: master-detail viewer of individual submissions and answer records, delete response. | `ResponsesPage`, `Card`, `Button` |
| `/responses` | `apps/web/app/responses/page.tsx` | Cross-form responses workspace: overview of submissions across all user forms. | `WorkspaceLayout` wrapping `ResponsesPage` |
| `/analytics` | `apps/web/app/analytics/page.tsx` | Workspace analytics: views, submissions, conversion rates, 14-day timeline bar chart, choice distributions. | `WorkspaceLayout` wrapping `AnalyticsPage` |
| `/templates` | `apps/web/app/templates/page.tsx` | Template gallery: 8 pre-built form templates; instant form creation with pre-populated fields. | `WorkspaceLayout` wrapping `TemplatesPage` |
| `/admin` | `apps/web/app/admin/page.tsx` | **New Route to Create:** Admin dashboard gated by `useUserRole() === "admin"`. | `AdminPage` (new) |
| Layout & Styles | `apps/web/app/layout.tsx` | Root HTML structure, fonts, providers. | `GlobalProviders`, font definitions |
| Stylesheet | `apps/web/app/globals.css` | Tailwind v4 configuration, theme variables, base styles. | CSS Tokens |

---

## 3. Component Inventory

### A. Feature & Workspace Components (`apps/web/components/**` excluding `ui/`)

| Component | File Path | Purpose | Props | Hooks & APIs Used |
| :--- | :--- | :--- | :--- | :--- |
| `ThemeToggle` | `apps/web/components/theme-toggle.tsx` | Toggles light and dark modes. | None | `useTheme`, `useState`, `useEffect` |
| `AuthForm` | `apps/web/components/auth/auth-form.tsx` | Email/password & OAuth form with email verification step. | `{ mode: "login" \| "sign-up" }` | `useRouter`, `useState`, `useEffect`, `authClient` |
| `AiFormGenerator` | `apps/web/components/builder/ai-form-generator.tsx` | One-shot AI prompt input that polls job status and refreshes fields. | `{ formId: string }` | `useState`, `useRef`, `useEffect`, `trpc.useUtils`, `trpc.formAi.startGeneration`, `trpc.formAi.getGenerationStatus` |
| `BuilderHeader` | `apps/web/components/builder/builder-header.tsx` | Builder top bar with title rename, auto-save status, theme toggle, preview, publish, share. | `{ title, onTitleChange, onTitleSave, onPreview, onShare, onPublish, isPublished, isPublishing, savedAt? }` | None |
| `BuilderPage` | `apps/web/components/builder/builder-page.tsx` | Main builder orchestrator; manages form data, field mutations, settings, modals, and panes. | `{ formId: string }` | `useRouter`, `authClient.useSession`, `useUserRole`, `useFormById`, `useForm`, `useFormFields`, `useState`, `useEffect` |
| `FieldInspector` | `apps/web/components/builder/field-inspector.tsx` | Property inspector for selected field (label, required, placeholders, options, min/max, stars, dates). | `{ field?: BuilderField, onSave, onDelete }` | `useState`, `useEffect` |
| `FieldTypeItem` | `apps/web/components/builder/field-type-item.tsx` | Palette item button for an individual field type. | `{ definition: FieldTypeDefinition, onAdd }` | None |
| `FieldTypePalette` | `apps/web/components/builder/field-type-palette.tsx` | Sidebar palette of 9 supported field types. | `{ onAdd }` | None |
| `FormCanvas` | `apps/web/components/builder/form-canvas.tsx` | Canvas rendering form title, description, and field cards with drag/arrow reordering. | `{ fields, selectedFieldId?, title, description, onTitleChange, onTitleSave, onDescriptionChange, onDescriptionSave, onSelect, onEdit, onDelete, onMove, onReorder, onAdd }` | `useState`, `useRef` |
| `FormPreviewDialog` | `apps/web/components/builder/form-preview-dialog.tsx` | Modal preview dialog showing interactive respondent preview. | `{ open, onOpenChange, title, description, fields }` | `useState` (in `PreviewField`) |
| `FormSettingsBar` | `apps/web/components/builder/form-settings-bar.tsx` | Controls response limit (admin-only edit), open/close state, access policies, and multi-submissions. | `{ isPublished, isOpen, responseLimit, accessPolicy, allowMultipleSubmissions, canEditResponseLimit, onOpenChange, onResponseLimitSave, onAccessPolicyChange, onMultipleSubmissionsChange }` | `useState`, `useEffect` |
| `ShareFormDialog` | `apps/web/components/builder/share-form-dialog.tsx` | Dialog for copying published form link. | `{ open, onOpenChange, formUrl?, isPublished, isPublishing }` | `useState`, `useEffect` |
| `DashboardPage` | `apps/web/components/dashboard/dashboard-page.tsx` | Dashboard view: stats, lifecycle tabs, forms grid, edit dialog, safe permanent deletion with CSV export guard. | `{ showAllForms?: boolean }` | `useRouter`, `authClient.useSession`, `useForm`, `useFormLifecycle`, `useSubmissionsAcrossForms`, `useState`, `useEffect` |
| `FormCard` | `apps/web/components/dashboard/form-card.tsx` | Form tile in dashboard grid with actions menu (edit, publish/unpublish, archive/restore, delete). | `{ form: FormSummary, fieldCount?, onEdit, onDelete, onArchive, onRestore, onPublish, onUnpublish }` | None |
| `FormsGrid` | `apps/web/components/dashboard/forms-grid.tsx` | Grid layout rendering form cards or empty state. | `{ forms, onEdit, onDelete, onArchive, onRestore, onPublish, onUnpublish }` | None |
| `SidebarNav` | `apps/web/components/dashboard/sidebar-nav.tsx` | Sidebar navigation with unread response indicator. | None | `usePathname`, `useState`, `useEffect`, `trpc.form.listFormsByUser`, `useSubmissionsAcrossForms` |
| `StatCard` | `apps/web/components/dashboard/stat-card.tsx` | Tile displaying numeric metric and descriptive label. | `{ label, value, detail }` | None |
| `StarRating` | `apps/web/components/forms/star-rating.tsx` | Accessible star rating input with hover preview and radio accessibility. | `{ label, maxStars, value?, onChange }` | `useState` |
| `WorkspaceLayout` | `apps/web/components/workspace/workspace-layout.tsx` | Shared shell for workspace subpages (`/responses`, `/analytics`, `/templates`). | `{ title: string, children: ReactNode }` | `useRouter`, `authClient.useSession`, `useEffect` |
| `ResponsesPage` | `apps/web/components/workspace/responses-page.tsx` | All-forms responses page with expandable submission answer details. | None | `trpc.form.listFormsByUser`, `useSubmissionsAcrossForms`, `useAnswersForSubmissions`, `trpc.formSnapshot.getSnapshotById`, `useMemo`, `useState` |
| `AnalyticsPage` | `apps/web/components/workspace/analytics-page.tsx` | Aggregated analytics with 14-day timeline bar chart and choice distribution bars. | None | `trpc.form.listFormsByUser`, `useFormResponses`, `useAnswersForSubmissions`, `useFormSnapshots`, `useMemo` |
| `TemplatesPage` | `apps/web/components/workspace/templates-page.tsx` | Gallery of 8 pre-configured templates with multi-field batch creation. | None | `useRouter`, `useForm`, `trpc.formField.createFormField`, `useState` |

---

### B. Shadcn UI Components Usage (`apps/web/components/ui/*`)

#### Currently Imported and Active Outside UI Directory (12 Components):
1. `badge.tsx` (used in `app/page.tsx`, `form-settings-bar.tsx`, `form-card.tsx`)
2. `button.tsx` (used in 17 files across landing, builder, dashboard, auth, workspace)
3. `card.tsx` (used in 8 files across responses, app, builder, dashboard, workspace)
4. `collapsible.tsx` (used in `builder/form-canvas.tsx`)
5. `dialog.tsx` (used in `form-preview-dialog.tsx`, `share-form-dialog.tsx`, `dashboard-page.tsx`)
6. `dropdown-menu.tsx` (used in `dashboard/form-card.tsx`)
7. `input.tsx` (used in 10 files across public form, landing, auth, builder, dashboard)
8. `label.tsx` (used in 5 files across auth, builder, dashboard)
9. `separator.tsx` (used in `app/page.tsx`)
10. `sonner.tsx` (used in `providers/global.tsx`)
11. `switch.tsx` (used in `field-inspector.tsx`, `form-settings-bar.tsx`)
12. `textarea.tsx` (used in 6 files across public form, builder, dashboard)

#### Unused Outside UI Directory (41 Components):
`accordion.tsx`, `alert-dialog.tsx`, `alert.tsx`, `aspect-ratio.tsx`, `avatar.tsx`, `breadcrumb.tsx`, `button-group.tsx`, `calendar.tsx`, `carousel.tsx`, `chart.tsx`, `checkbox.tsx`, `command.tsx`, `context-menu.tsx`, `drawer.tsx`, `empty.tsx`, `field.tsx`, `form.tsx`, `hover-card.tsx`, `input-group.tsx`, `input-otp.tsx`, `item.tsx`, `kbd.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `pagination.tsx`, `popover.tsx`, `progress.tsx`, `radio-group.tsx`, `resizable.tsx`, `scroll-area.tsx`, `select.tsx`, `sheet.tsx`, `sidebar.tsx`, `skeleton.tsx`, `slider.tsx`, `spinner.tsx`, `table.tsx`, `tabs.tsx`, `toggle-group.tsx`, `toggle.tsx`, `tooltip.tsx`.

*(Note: In upcoming phases, `tabs.tsx` will be utilized for the builder right-pane tabs, `drawer.tsx` for mobile builder drawers, and `progress.tsx` for the public form progress line.)*

---

## 4. Hook Inventory (`apps/web/hooks/**`)

All hooks listed below are located inside forbidden path `apps/web/hooks/**` and **MUST NOT BE CHANGED**.

| Hook Name | Source File | Returned Fields & API Contract | Direct Consumers | Status |
| :--- | :--- | :--- | :--- | :--- |
| `useUserRole` | `auth/use-user-role.ts` | Query result for `auth.getCurrentUserRole` (`data?: { userRole: "user" \| "admin" }`, `isPending`, `error`, etc.) | `builder-page.tsx`, `app/admin/page.tsx` (Phase 6) | **MUST NOT CHANGE** |
| `useFormLifecycle` | `form/use-form.ts` | `{ formsQuery, archiveFormAsync, restoreFormAsync, deleteFormAsync, getDeletionPreview, exportCsv, isLifecycleMutationPending }` | `dashboard-page.tsx` | **MUST NOT CHANGE** |
| `useForm` | `form/use-form.ts` | `{ forms, formsQuery, createFormAsync, createForm, renameForm, renameFormAsync, updateFormDescription, updateFormDescriptionAsync, updateSettingsAsync, deleteForm, deleteFormAsync, toggleFormOpen, toggleFormOpenAsync, updateResponseLimit, updateResponseLimitAsync, incrementFormViewCount, incrementFormViewCountAsync, publishForm, publishFormAsync, unpublishForm, unpublishFormAsync, error, failureCount, isError, isIdle, isSuccess, isPending, status }` | `builder-page.tsx`, `dashboard-page.tsx`, `templates-page.tsx` | **MUST NOT CHANGE** |
| `useFormById` | `form/use-form.ts` | Query result for `form.getFormById({ formId })` | `builder-page.tsx` | **MUST NOT CHANGE** |
| `useFormFields` | `form/use-form-fields.ts` | `{ fields, fieldsQuery, createField, createFieldAsync, updateField, updateFieldAsync, deleteField, deleteFieldAsync, reorderFields, reorderFieldsAsync, isCreating, isUpdating, isDeleting, isReordering }` | `builder-page.tsx` | **MUST NOT CHANGE** |
| `usePublicForm` | `form/use-public-form.ts` | `{ form, snapshot, formQuery, snapshotQuery, incrementView, incrementViewAsync, incrementViewMutation, utils }` | `app/form/[formUrl]/page.tsx` | **MUST NOT CHANGE** |
| `useSubmission` | `form/use-submission.ts` | `{ startSubmission, startSubmissionAsync, updateDraftAnswer, updateDraftAnswerAsync, saveBulkAnswers, saveBulkAnswersAsync, updateLastActivity, updateLastActivityAsync, submitForm, submitFormAsync, markNotSubmitted, markNotSubmittedAsync, deleteSubmission, deleteSubmissionAsync, saveAnswer, saveAnswerAsync, activeSubmissionQuery, submissionQuery, versionQuery, isStarting, isSavingDraft, isSavingAnswers, isSubmitting, startError, draftError, answersError, submitError }` | `app/form/[formUrl]/page.tsx` | **MUST NOT CHANGE** |
| `useFormResponses` | `form/use-form-responses.ts` | `{ submissions, submissionsQuery, answers, answersQuery, fieldAnswers, fieldAnswersQuery, deleteSubmissionAsync, isDeletingSubmission }` | `forms/[formId]/responses/page.tsx`, `workspace/analytics-page.tsx` | **MUST NOT CHANGE** |
| `useLatestFormSnapshot` | `form/use-form-snapshots.ts`| Query result for `formSnapshot.getLatestSnapshot` | Used internally by `usePublicForm` | **MUST NOT CHANGE** |
| `useFormSnapshotById` | `form/use-form-snapshots.ts`| Query result for `formSnapshot.getSnapshotById` | `forms/[formId]/responses/page.tsx` | **MUST NOT CHANGE** |
| `useFormSnapshots` | `form/use-form-snapshots.ts`| Query result for `formSnapshot.listSnapshotsByForm` | `workspace/analytics-page.tsx` | **MUST NOT CHANGE** |
| `useSubmissionsAcrossForms` | `form/use-submissions-across-forms.ts` | `{ entries: { form, submissions, query }[], isPending, isError }` | `dashboard-page.tsx`, `sidebar-nav.tsx`, `workspace/responses-page.tsx` | **MUST NOT CHANGE** |
| `useAnswersForSubmissions` | `form/use-submissions-across-forms.ts` | `{ answersBySubmission: Map<string, Answer[]>, isPending, isError }` | `workspace/analytics-page.tsx`, `workspace/responses-page.tsx` | **MUST NOT CHANGE** |
| `useIsMobile` | `use-mobile.ts` | `boolean` (checks `window.innerWidth < 768px`) | `sidebar.tsx`, builder mobile drawers | **MUST NOT CHANGE** |
| `useHealth` | `api/health.ts` | `{ status, isError }` querying `trpc.health.getHealth` | `app/admin/page.tsx` (Phase 6) | **MUST NOT CHANGE** |
| `useSignin` | `auth/use-auth.ts` | `{ signInAsync, signIn, error, failureCount, isError, isIdle, isSuccess, isPending, status }` | Currently unused (`auth-form` calls Better Auth client directly) | **MUST NOT CHANGE** |
| `useSignup` | `auth/use-auth.ts` | `{ signUpAsync, signUp, error, failureCount, isError, isIdle, isSuccess, isPending, status }` | Currently unused (`auth-form` calls Better Auth client directly) | **MUST NOT CHANGE** |
| `useGoogleSignIn` | `auth/use-auth.ts` | `{ googleSignIn }` | Currently unused (`auth-form` calls Better Auth client directly) | **MUST NOT CHANGE** |
| `useGithubSignIn` | `auth/use-auth.ts` | `{ githubSignIn }` | Currently unused (`auth-form` calls Better Auth client directly) | **MUST NOT CHANGE** |

---

## 5. tRPC Surface Actually Used by the Frontend

Below is the verified inventory of all procedures consumed by the web application:

### Authentication Router (`trpc.auth.*`)
- `trpc.auth.getCurrentUserRole` (query): returns `{ userRole: "user" | "admin" }`. Used by builder for admin response limit guard; will gate `/admin`.
- `trpc.auth.signIn` (mutation): defined in hook.
- `trpc.auth.signUp` (mutation): defined in hook.

### Form Router (`trpc.form.*`)
- `trpc.form.createInitialForm` (mutation): creates new form record with title. Used in dashboard, templates, and "Create with AI".
- `trpc.form.getFormById` (query): retrieves full form entity including status, access policies, response limit.
- `trpc.form.getPublicFormById` (query): public form access (returns form flags, title, description, isOwner). Throws `NOT_FOUND` if archived.
- `trpc.form.renameForm` (mutation): updates title.
- `trpc.form.updateFormDescription` (mutation): updates description.
- `trpc.form.updateSettings` (mutation): updates `accessPolicy` and `allowMultipleSubmissions`.
- `trpc.form.toggleFormOpen` (mutation): toggles `isOpen`.
- `trpc.form.updateResponseLimit` (mutation): updates `responseLimit` (requires admin role on server).
- `trpc.form.publishForm` (mutation): publishes form, creates snapshot, generates public URL.
- `trpc.form.unpublishForm` (mutation): unpublishes form.
- `trpc.form.archiveForm` (mutation): sets `{ isArchived: true }`.
- `trpc.form.restoreForm` (mutation): sets `{ isArchived: false }`.
- `trpc.form.deleteForm` (mutation): locks row, deletes submissions, snapshots, and form. Requires `confirmDeleteResponses` and `expectedSubmittedCount` if count > 0.
- `trpc.form.getDeletionPreview` (query/fetch): returns `{ submittedCount, inProgressCount, isPublished, isArchived }`.
- `trpc.form.exportCsv` (query/fetch): returns `{ csv, submittedCount }` with UTF-8 BOM, injection protection.
- `trpc.form.listFormsByLifecycle` (query): returns `{ forms, counts: { live, draft, archived } }`.
- `trpc.form.listFormsByUser` (query): lists all forms owned by current user.
- `trpc.form.incrementFormViewCount` (mutation): increments view metrics.

### AI Generation Router (`trpc.formAi.*`)
- `trpc.formAi.startGeneration` (mutation): accepts `{ formId, prompt }`, enqueues background AI job.
- `trpc.formAi.getGenerationStatus` (query): accepts `{ jobId }`, polled until `completed` or `failed`.

### Form Field Router (`trpc.formField.*`)
- `trpc.formField.listFormFields` (query): returns ordered fields for a form.
- `trpc.formField.createFormField` (mutation): adds a new field to form.
- `trpc.formField.updateFormField` (mutation): updates label, required, config.
- `trpc.formField.deleteFormField` (mutation): deletes a field.
- `trpc.formField.reorderFields` (mutation): accepts `{ orderedFieldIds }` to persist display order.

### Form Snapshot Router (`trpc.formSnapshot.*`)
- `trpc.formSnapshot.getLatestSnapshot` (query): gets published fields snapshot.
- `trpc.formSnapshot.getSnapshotById` (query): retrieves exact snapshot corresponding to a submission.
- `trpc.formSnapshot.listSnapshotsByForm` (query): lists snapshot history for versioning/analytics.

### Submission Router (`trpc.submission.*`)
- `trpc.submission.startSubmission` (mutation): initiates or resumes a submission draft.
- `trpc.submission.getActiveSubmission` (query): checks for in-progress submission.
- `trpc.submission.getSubmissionById` (query): fetches submission details.
- `trpc.submission.updateDraftAnswer` (mutation): saves partial draft answers. Also callable via `navigator.sendBeacon`.
- `trpc.submission.updateLastActivity` (mutation): updates last seen timestamp.
- `trpc.submission.submitForm` (mutation): finalizes submission.
- `trpc.submission.markNotSubmitted` (mutation): marks abandoned draft.
- `trpc.submission.checkVersionMismatch` (query): verifies respondent snapshot version against latest form version.
- `trpc.submission.listSubmissionsByForm` (query): lists submissions for a form.
- `trpc.submission.deleteSubmission` (mutation): deletes individual submission.

### Answer Router (`trpc.answer.*`)
- `trpc.answer.saveAnswer` (mutation): writes individual field answer.
- `trpc.answer.saveBulkAnswers` (mutation): writes batch answers.
- `trpc.answer.getAnswersBySubmission` (query): retrieves answers for a given submission ID.
- `trpc.answer.getAnswersByField` (query): retrieves answers for an individual field ID.

### Health Router (`trpc.health.*`)
- `trpc.health.getHealth` (query): returns API health status.

---

## 6. Logic That Must Be Preserved (Per File)

### 1. Public Form: `apps/web/app/form/[formUrl]/page.tsx`
- **Form ID Extraction:** Regex `formUrl.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})-/i)` must extract the UUID prefix.
- **One-time View Count Increment:** `incrementViewAsync({ formId })` triggered once per mount, tracked via ref `viewAttemptedFor` to avoid React 19 double-mount duplicate counts.
- **Web Locks Submission Synchronization:** `navigator.locks.request("ftheform:submission:${formId}", startOrResume)` to prevent race conditions when multiple tabs or concurrent sessions initialize a response.
- **Submission Status Discrimination:** Handles statuses `already_submitted` (marks submitted and displays recognition message), `submitted`, and `filling` (populates previous `draftAnswer` into state).
- **Autosave Queue & Debounce:** Answers autosave with a 500ms debounce. Debounce promises are chained via `autosaveQueue.current = queuedSave.catch(...)` to guarantee strict sequential delivery without out-of-order overwrite.
- **`visibilitychange` Beacon Flush:** When document visibility changes to `hidden`, active debounce timers are cleared and `navigator.sendBeacon` is called with:
  - Endpoint: `${env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")}/submission.updateDraftAnswer`
  - Body: Blob `{ json: { submissionId, draftAnswer: answers } }` with type `application/json`
  - Fallback: standard `saveDraft` promise if beacon is rejected.
- **Version Mismatch Detection:** Polled/queried via `versionQuery.data?.mismatch`. If form version was republished while respondent was filling, form submission is blocked and `restartAfterVersionChange` modal confirmation is triggered.
- **Required Rating Check:** Custom validation ensures rating questions with `required: true` have a numeric value >= 1 before submission can proceed.
- **Access Policy Gating:**
  - `UNAUTHORIZED` (authenticated only) -> Redirect prompt to `/login?next=...`
  - `FORBIDDEN` (anonymous only) -> Prompt user to sign out using `authClient.signOut()`.
  - Closed / Limit reached -> Specific rejection titles.
  - Owner preview mode -> Banner indicating preview mode, submit button disabled (`form.isOwner ? "Preview only" : ...`).

### 2. Dashboard: `apps/web/components/dashboard/dashboard-page.tsx`
- **Lifecycle Derivation & Tabs:** Live / Draft / Archived tabs backed by `useFormLifecycle` with live query counts.
- **Two-Phase Permanent Delete Protection:**
  - Queries `getDeletionPreview(formId)`.
  - Zero submitted responses: direct permanent delete confirmation button.
  - Greater than zero submitted responses: requires typing the exact form title in an input field before enabling delete button.
  - CSV Export flow: "Download CSV, then delete" fetches `exportCsv`, downloads `[title]-responses.csv` with UTF-8 BOM, and records `exportedSubmittedCount`.
  - `CONFLICT` error handling: if submissions arrived between CSV download and deletion, the backend throws `CONFLICT`. The dialog intercepts this, invalidates preview, sets `mustDeleteUsingExport = true`, and forces the user to export the latest responses before retrying.
  - `NOT_FOUND` handling: if form was already deleted concurrently, dialog closes cleanly and lists refresh.

### 3. Builder: `apps/web/components/builder/builder-page.tsx`
- **Autosave on Blur:** Inline title and description inputs trigger `saveTitle()` and `saveDescription()` on `blur`.
- **Role Gating for Response Limit:** Response limit editing is strictly disabled unless `userRoleQuery.data?.userRole === "admin"`. Non-admin users see read-only input with informative tooltip/subtext.
- **Settings Synchronization:** Access policy (`anonymous_and_authenticated`, `anonymous_only`, `authenticated_only`) and `allowMultipleSubmissions` update atomically via `updateSettingsAsync`.
- **Publish & Share Workflow:** `handleShare()` checks whether the form is published; if still draft, it invokes `publishForm()` automatically before displaying `ShareFormDialog`.
- **Field Reordering:** Supports drag-and-drop and up/down movement, persisting via `reorderFieldsAsync` with array of ordered IDs.
- **AI Form Generation Integration:** AI generation operates additively, calling `startGeneration` and polling `getGenerationStatus`. Completed generation preserves existing fields and invalidates `listFormFields` and `getFormById`.

### 4. Auth & Redirection: `apps/web/components/auth/auth-form.tsx` & App Routes
- Safe redirection via `getAuthReturnPath` and `getAuthCallbackUrl` ensuring open redirect vulnerabilities (`//`, `\`, external domains) are blocked and defaulted to `/dashboard`.
- Social auth integration (Google, GitHub) passing dynamic `callbackURL`.
- Multi-step email verification view on sign-up before accessing dashboard.

---

## 7. Design Token Plan (`apps/web/app/globals.css`)

### Core Concept: Monochromatic Architectural Minimalism
- **Zero non-grayscale colors** across primary, secondary, accent, sidebar, or chart tokens.
- **One unified radius scale**: Replace default `0.875rem` (14px) with crisp `0.375rem` (6px) or `0.25rem` (4px).
- **Destructive only**: Retain a muted, low-saturation red strictly for delete actions and error alerts.
- **Fonts**: Geist Sans for UI, Geist Mono for labels/numbers/metrics. Completely remove `Inter`.

### Token Mapping: Before vs. After

| Token | Current Value (Light) | Target Value (Light) | Current Value (Dark) | Target Value (Dark) | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--radius` | `0.875rem` (14px) | `0.375rem` (6px) | `0.875rem` (14px) | `0.375rem` (6px) | Eliminates bubbly shadcn look; razor-sharp bento aesthetic. |
| `--background` | `oklch(1 0 0)` | `oklch(1 0 0)` (#ffffff) | `oklch(0.145 0 0)` | `oklch(0.10 0 0)` (#121212) | Deep, clean monochromatic canvas. |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.12 0 0)` (#1a1a1a) | `oklch(0.985 0 0)` | `oklch(0.96 0 0)` (#f5f5f5) | High contrast, accessible type. |
| `--primary` | `oklch(0.505 0.213 27.518)` (Red) | `var(--foreground)` | `oklch(0.444 0.177 26.899)` (Red) | `var(--foreground)` | **Primary is pure foreground (black/white).** |
| `--primary-foreground`| `oklch(0.971 0.013 17.38)` | `var(--background)` | `oklch(0.971 0.013 17.38)` | `var(--background)` | Inverted foreground/background pairing. |
| `--secondary` | `oklch(0.967 0.001 286.375)` | `oklch(0.96 0 0)` | `oklch(0.274 0.006 286.033)` | `oklch(0.18 0 0)` | Muted neutral grayscale. |
| `--secondary-foreground`| `oklch(0.21 0.006 285.885)` | `oklch(0.12 0 0)` | `oklch(0.985 0 0)` | `oklch(0.96 0 0)` | Crisp neutral contrast. |
| `--muted` | `oklch(0.97 0 0)` | `oklch(0.96 0 0)` | `oklch(0.269 0 0)` | `oklch(0.16 0 0)` | Subdued background tile tint. |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.48 0 0)` | `oklch(0.708 0 0)` | `oklch(0.65 0 0)` | Legible secondary labels. |
| `--accent` | `oklch(0.97 0 0)` | `oklch(0.94 0 0)` | `oklch(0.269 0 0)` | `oklch(0.20 0 0)` | Grayscale hover/focus states. |
| `--accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.12 0 0)` | `oklch(0.985 0 0)` | `oklch(0.96 0 0)` | High contrast accent text. |
| `--card` | `oklch(1 0 0)` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | `oklch(0.13 0 0)` | Clean card elevation. |
| `--card-foreground` | `oklch(0.145 0 0)` | `oklch(0.12 0 0)` | `oklch(0.985 0 0)` | `oklch(0.96 0 0)` | Card typography. |
| `--border` | `oklch(0.922 0 0)` | `oklch(0.90 0 0)` | `oklch(1 0 0 / 10%)` | `oklch(1 0 0 / 12%)` | Crisp 1px structural borders. |
| `--input` | `oklch(0.922 0 0)` | `oklch(0.90 0 0)` | `oklch(1 0 0 / 15%)` | `oklch(1 0 0 / 14%)` | Input boundary borders. |
| `--ring` | `oklch(0.708 0 0)` | `oklch(0.12 0 0)` | `oklch(0.556 0 0)` | `oklch(0.96 0 0)` | High visibility sharp keyboard focus ring. |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.55 0.18 25)` | `oklch(0.704 0.191 22.216)` | `oklch(0.62 0.17 25)` | Muted red for errors and permanent delete only. |
| `--sidebar` | `oklch(0.985 0 0)` | `oklch(0.98 0 0)` | `oklch(0.205 0 0)` | `oklch(0.12 0 0)` | Sidebar background neutral. |
| `--sidebar-foreground`| `oklch(0.145 0 0)` | `oklch(0.12 0 0)` | `oklch(0.985 0 0)` | `oklch(0.96 0 0)` | Sidebar text. |
| `--sidebar-primary` | `oklch(0.577 0.245 27.325)` (Red) | `var(--sidebar-foreground)` | `oklch(0.637 0.237 25.331)` (Red) | `var(--sidebar-foreground)` | **Sidebar primary is monochrome.** |
| `--sidebar-border` | `oklch(0.922 0 0)` | `oklch(0.90 0 0)` | `oklch(1 0 0 / 10%)` | `oklch(1 0 0 / 12%)` | 1px border separation. |
| `--chart-1` to `5` | Mixed values | Monochromatic stepped lightness: `oklch(0.85 0 0)` to `oklch(0.25 0 0)` | Mixed values | Monochromatic stepped lightness: `oklch(0.90 0 0)` to `oklch(0.30 0 0)` | Pure grayscale charts. |

---

## 8. Per-Page Change Plan

### Target 1: Landing Page (`/`)
- **Files to Edit:**
  - `apps/web/app/page.tsx`: Rewrite landing structure: minimalist nav, hero with prominent prompt input, bento feature grid, 3-step how-it-works, display-only pricing table, minimalist footer.
- **Files to Create:**
  - `apps/web/components/landing/landing-nav.tsx`: Clean monochromatic navigation bar with logo, anchors, auth buttons, theme toggle.
  - `apps/web/components/landing/hero-prompt.tsx`: Large prompt input ("Describe your form"). Signed-out submit stores text in `sessionStorage.setItem("pending_ai_prompt", prompt)` and routes to `/sign-up`.
  - `apps/web/components/landing/bento-features.tsx`: Minimalist 1px-bordered bento grid displaying core product features with precise copy.
  - `apps/web/components/landing/how-it-works.tsx`: 3 numbered steps (Shape the question, Send one link, Make the call).
  - `apps/web/components/landing/pricing-section.tsx`: Free (5 forms), Pro (approx Rs 400, 10 AI credits, 10 forms), Business (Contact). Clear display-only note.
  - `apps/web/components/landing/landing-footer.tsx`: Clean footer with copyright, links, and system status indicator.

### Target 2: Auth Pages (`/login`, `/sign-up`)
- **Files to Edit:**
  - `apps/web/app/login/page.tsx`: Remove duplicate `"use client";`, align layout with monochromatic design.
  - `apps/web/app/sign-up/page.tsx`: Same logic, refined styling.
  - `apps/web/components/auth/auth-form.tsx`: Re-skin authentication card. Strip radial glow gradients and marketing slogans. Implement clean bento split card, Geist Mono tags, sharp input borders, seamless Google/GitHub social buttons. Preserves all Better Auth logic and email verification states.

### Target 3: Dashboard (`/dashboard` & `/forms`)
- **Files to Edit:**
  - `apps/web/components/dashboard/dashboard-page.tsx`:
    - Stat cards converted to responsive bento grid tiles.
    - TWO distinct action buttons: `Create form` (direct blank form creation) and `Create with AI` (opens AI generation dialog).
    - SessionStorage check on mount: If `pending_ai_prompt` exists in `sessionStorage`, immediately open AI generation dialog, pre-fill prompt, and execute initial form creation.
    - Preserves all tab filtering (Live, Draft, Archived) with badges.
    - Preserves exact delete dialog (zero-responses confirm vs with-responses confirmation requiring title match + CSV download guardrail).
  - `apps/web/components/dashboard/form-card.tsx`: Restyle cards with 1px border, status badges, dropdown actions.
  - `apps/web/components/dashboard/forms-grid.tsx`: Bento grid layout for forms.
  - `apps/web/components/dashboard/sidebar-nav.tsx`: Monochromatic sidebar with Geist Mono badges, active state indicator, unread responses dot.
  - `apps/web/components/dashboard/stat-card.tsx`: Restyle stat tiles with Geist Mono numbers and clean labels.
- **Files to Create:**
  - `apps/web/components/dashboard/create-ai-dialog.tsx`: Modal dialog for "Create with AI" flow (creates initial form via `createFormAsync`, calls `startGeneration`, displays status spinner, redirects to `/forms/[formId]/builder`).

### Target 4: Form Builder (`/forms/[formId]/builder` & `/builder/[formId]`)
- **Files to Edit:**
  - `apps/web/app/builder/[formId]/page.tsx`: Replace duplicate component render with an immediate redirect to `/forms/[formId]/builder`.
  - `apps/web/app/forms/[formId]/builder/page.tsx`: Keep as canonical builder route.
  - `apps/web/components/builder/builder-page.tsx`:
    - Implement exact 3-pane layout:
      - **Left Pane (~260px):** Top half has 9-item field types grid (`FieldTypePalette`); bottom half has AI prompt dock (`AiPromptDock`) with job status list.
      - **Center Canvas:** Form title and description inline inputs, field cards list with drag handle, move up/down, edit, and delete triggers.
      - **Right Pane (~300px):** Tabs switching between "Field" (field inspector) and "Settings" (response limit, access policy, multiple submissions).
    - Mobile drawers: Sidebars convert to slide-over sheets/drawers on screens `< 768px`.
    - Replace `window.confirm` with accessible dialog component (`DeleteFieldDialog`).
  - `apps/web/components/builder/builder-header.tsx`: Inline title input, auto-save status, theme toggle, Preview, Share, Publish buttons.
  - `apps/web/components/builder/field-type-palette.tsx`: Compact 2-column or grid layout fitting into top section of left pane.
  - `apps/web/components/builder/field-inspector.tsx`: Tab-based inspector view for selected field.
  - `apps/web/components/builder/form-settings-bar.tsx`: Tab-based form settings view with admin-gated response limit.
  - `apps/web/components/builder/form-canvas.tsx`: Minimal bento card styling for fields, smooth drag states.
  - `apps/web/components/builder/form-preview-dialog.tsx`: Restyled preview modal.
  - `apps/web/components/builder/share-form-dialog.tsx`: Restyled share dialog.
- **Files to Create:**
  - `apps/web/components/builder/ai-prompt-dock.tsx`: Bottom dock in left pane with prompt input and chat-like list of generation jobs with statuses (`pending`, `running`, `completed`, `failed`).
  - `apps/web/components/builder/delete-field-dialog.tsx`: Dialog replacing browser `window.confirm` for field deletion.

### Target 5: Public Form (`/form/[formUrl]`)
- **Files to Edit:**
  - `apps/web/app/form/[formUrl]/page.tsx`:
    - Redesign rendering layer to **one question per screen**.
    - Top subtle progress line indicating completion percentage.
    - Keyboard navigation: Enter key advances to next question; Shift+Enter or back button goes to previous question.
    - Subtle slide and fade micro-animations between questions.
    - Star rating micro-animation on selection.
    - Designed dedicated full-screen states for:
      - Form closed
      - Response limit reached
      - Sign-in required (with link to login + return path)
      - Anonymous-only notice (with sign-out action)
      - Already submitted state
      - Submission thank-you confirmation
      - Owner preview mode indicator
      - Version mismatch alert dialog with restart action.
    - **Preserve 100% of internal state/hooks:** `navigator.locks`, single view tracking, autosave debounce queue, `visibilitychange` `sendBeacon` fallback.
  - `apps/web/components/forms/star-rating.tsx`: Monochromatic rating stars with clean hover/selection animation.
- **Files to Create:**
  - `apps/web/components/public-form/question-screen.tsx`: Individual slide for active field.
  - `apps/web/components/public-form/progress-line.tsx`: Top minimal progress bar.
  - `apps/web/components/public-form/navigation-controls.tsx`: Back and Next/Submit buttons with keyboard shortcut hint (`Press Enter ↵`).
  - `apps/web/components/public-form/status-screens.tsx`: Full-screen monochromatic state cards for closed, error, auth, and completed states.

### Target 6: Workspace Responses, Analytics, Templates
- **Files to Edit:**
  - `apps/web/app/forms/[formId]/responses/page.tsx` & `apps/web/components/workspace/responses-page.tsx`: Restyle master-detail response inspection with clean bento layout and monospace timestamps.
  - `apps/web/app/analytics/page.tsx` & `apps/web/components/workspace/analytics-page.tsx`: Restyle 14-day submissions timeline chart with monochromatic bars; choice distribution percentages with clean progress tracks.
  - `apps/web/app/templates/page.tsx` & `apps/web/components/workspace/templates-page.tsx`: Restyle 8 template cards into bento tiles.
  - `apps/web/components/workspace/workspace-layout.tsx`: Unify top bar and sidebar framing.

### Target 7: New Admin Route (`/admin`)
- **Files to Create:**
  - `apps/web/app/admin/page.tsx`: Route gated by `useUserRole()`. If `userRole !== "admin"`, redirects to `/dashboard`.
  - `apps/web/components/admin/admin-page.tsx`: Admin dashboard rendering available data from `useUserRole()` and `useHealth()`. Clearly displays placeholders for backend gaps.

---

## 9. Backend Gaps & Exact Placeholders

The following capabilities are missing from the backend and hooks, and will be rendered as explicit, clearly marked placeholders:

1. **Admin Global Users Management:**
   - *Backend Gap:* There are no tRPC procedures or hooks to list all platform users, view their email addresses, or update roles.
   - *UI Placeholder:* In `/admin`:
     ```tsx
     <div className="rounded-lg border border-dashed border-border p-6 text-sm">
       <p className="font-medium text-foreground">Global User Management</p>
       <p className="mt-1 text-xs text-muted-foreground">
         [Backend Gap] Multi-user directory procedure is not implemented in packages/trpc.
         Current active session role: <code className="font-mono">admin</code>.
       </p>
     </div>
     ```

2. **Admin Multi-Tenant Form Telemetry:**
   - *Backend Gap:* `form.listFormsByUser` only returns forms owned by the active user; there is no procedure to list all forms system-wide or aggregate global database statistics.
   - *UI Placeholder:* In `/admin`:
     ```tsx
     <div className="rounded-lg border border-dashed border-border p-6 text-sm">
       <p className="font-medium text-foreground">System-Wide Telemetry</p>
       <p className="mt-1 text-xs text-muted-foreground">
         [Backend Gap] Global multi-tenant inspection procedure is not implemented.
         Showing local workspace forms only.
       </p>
     </div>
     ```

3. **Billing, Plan Enforcement & AI Credits:**
   - *Backend Gap:* There is no billing engine, stripe integration, plans table, or credits tracker in `packages/**`. The pricing tiers (Free = 5 forms, Pro = Rs 400 / 10 AI credits / 10 forms, Business = Custom) are display-only.
   - *UI Placeholder:* On landing pricing cards and workspace header:
     ```tsx
     <span className="text-[11px] font-mono text-muted-foreground">
       Display only — plan limits not enforced by backend
     </span>
     ```

4. **Arbitrary Field Customization & Dynamic Types:**
   - *Backend Gap:* The backend strictly supports 9 fixed field types (`text`, `textarea`, `email`, `number`, `select`, `multiselect`, `checkbox`, `rating`, `date`). No custom plugins or dynamic field types exist.
   - *UI Enforcement:* Palette strictly restricted to the 9 supported types.

---

## 10. Risks, Assumptions, and Contradictions

1. **Pre-Existing ESLint Failure in Monorepo:**
   - *Risk:* Running `pnpm --filter web lint` currently fails with `ERR_PACKAGE_PATH_NOT_EXPORTED: Package subpath './config' is not defined by "exports" in packages/eslint-config/node_modules/eslint/package.json`.
   - *Cause:* The monorepo has ESLint 9.7.0 installed, while `@repo/eslint-config/next.js` uses an import syntax incompatible with this version.
   - *Constraint:* Rule 1 strictly forbids editing `packages/**` or `package.json`.
   - *Resolution:* Documented in this audit. Verification will rely on `pnpm --filter web check-types` (`next typegen && tsc --noEmit`), which succeeds with 0 errors.

2. **AI Generation One-Shot Semantics:**
   - *Observation:* `trpc.formAi.startGeneration` requires an existing `formId` and appends fields; it does not replace fields or carry conversational context.
   - *Handling:* On `/dashboard` and `/`, "Create with AI" first executes `createInitialForm({ title: "AI Generated Form" })`, invokes `startGeneration({ formId, prompt })`, polls status, and then navigates to the builder.

3. **Duplicate Route `/builder/[formId]`:**
   - *Resolution:* The file `apps/web/app/builder/[formId]/page.tsx` will be edited to issue a `redirect(`/forms/${formId}/builder`)` or client navigation rather than duplicating the builder page code.

4. **Fonts Constraint:**
   - *Observation:* `apps/web/app/layout.tsx` imports `Inter` from `next/font/google`.
   - *Resolution:* In Phase 1, `Inter` will be deleted from `layout.tsx`, and `GeistVF.woff` / `GeistMonoVF.woff` (already present in `apps/web/app/fonts`) will be configured as `--font-sans` and `--font-mono`.

---

## 11. Phased Execution Plan

Execution will proceed sequentially. No phase will start without explicit approval ("APPROVED PHASE N").

### Phase 1: Foundation & Shared Shell
- **Tasks:**
  - Update `globals.css`: pure monochrome tokens, 1px borders, `--radius: 0.375rem`, grayscale charts, muted red destructive token.
  - Update `app/layout.tsx`: remove `Inter`, wire `GeistVF` and `GeistMonoVF`.
  - Restyle core UI primitives used across the app (`button.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, `dialog.tsx`, `badge.tsx`, `switch.tsx`, `theme-toggle.tsx`).
- **Estimated Files Touched:** ~8 files.

### Phase 2: Dashboard & Navigation
- **Tasks:**
  - Redesign `/dashboard` and `/forms` using `DashboardPage`.
  - Bento metric tiles, Live/Draft/Archived tabs with counts.
  - TWO distinct buttons: "Create form" and "Create with AI".
  - Build `CreateAiDialog` with creation + status polling + builder redirect.
  - Restyle edit, archive, restore, and permanent delete dialog with CSV export guard.
  - Restyle `SidebarNav` with unread dot and active indicator.
- **Estimated Files Touched:** ~8 files.

### Phase 3: Form Builder Workspace
- **Tasks:**
  - 3-pane layout for `/forms/[formId]/builder`:
    - Left pane (~260px): Field palette top + AI prompt dock bottom with job history.
    - Center canvas: Inline title/desc, field cards with drag-and-drop & arrow reordering.
    - Right pane (~300px): Tabs for "Field" inspector and "Settings" bar.
  - Replace `window.confirm` with `DeleteFieldDialog`.
  - Mobile responsiveness: Drawers for left and right sidebars on small screens.
  - Redirect duplicate route `/builder/[formId]`.
- **Estimated Files Touched:** ~12 files.

### Phase 4: Public Form Experience
- **Tasks:**
  - Redesign `/form/[formUrl]` into a one-question-per-screen slide experience.
  - Top progress line, Enter key advance, Back button, slide/fade transitions.
  - Restyle `StarRating` with micro-animations.
  - Design dedicated states: closed, limit reached, sign-in required, anonymous-only, already submitted, thank you, owner preview, version mismatch dialog.
  - Maintain 100% of existing logic (`navigator.locks`, autosave debounce, `sendBeacon`).
- **Estimated Files Touched:** ~6 files.

### Phase 5: Landing & Authentication
- **Tasks:**
  - Redesign landing page `/`: nav, hero with large prompt input, bento features grid, 3-step how-it-works, display-only pricing, footer.
  - Wire landing hero prompt -> `sessionStorage` -> `/sign-up` -> dashboard auto-trigger.
  - Restyle `/login`, `/sign-up`, and `AuthForm` into monochromatic bento style.
- **Estimated Files Touched:** ~7 files.

### Phase 6: Admin Route & Workspace Subpages
- **Tasks:**
  - Create `/admin` page gated by `useUserRole() === "admin"`.
  - Build `AdminPage` with health check and clear backend gap placeholders.
  - Restyle workspace subpages (`/forms/[formId]/responses`, `/responses`, `/analytics`, `/templates`).
- **Estimated Files Touched:** ~8 files.

---

## 12. Questions for the User

1. **Pre-Existing ESLint Configuration:**
   As noted in Section 10, `pnpm --filter web lint` currently encounters an ESLint 9 configuration resolution issue inside `@repo/eslint-config` (`packages/eslint-config`). Since modifying `packages/**` is strictly forbidden by Rule 1, please confirm that `pnpm --filter web check-types` (`next typegen && tsc --noEmit`) will serve as the verification gate for each phase.

---

*Phase 0 audit complete. Standing by for Phase 1 approval.*
