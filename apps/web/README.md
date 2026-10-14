# FTHEFORM Web

The web application is the Next.js frontend for FTHEFORM. It contains the public landing and auth screens plus the authenticated dashboard for creating, listing, editing, and deleting forms.

## Run Locally

From the repository root:

```bash
pnpm --filter web dev
```

Open the web origin configured in `NEXT_PUBLIC_WEB_URL`. The API must be running separately with `pnpm --filter @repo/api dev`.

## Environment

Set both validated public origins. `NEXT_PUBLIC_API_URL` must end in `/trpc`:

```env
NEXT_PUBLIC_WEB_URL=<public-web-origin>
NEXT_PUBLIC_API_URL=<public-api-origin>/trpc
```

Authentication uses the Better Auth session cookie supplied by the API, so the API CORS configuration must allow the web origin.

## Frontend Structure

- `app/` contains the public form route, builder, dashboard, response review, login, and sign-up pages.
- `components/` contains auth and shared UI components.
- `hooks/form/` contains hooks for forms, fields, snapshots, submissions, and responses.
- `hooks/auth/` contains auth procedure hooks and social sign-in helpers.
- `trpc/` contains the typed browser client and HTTP links.

## Checks and Deployment

```bash
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
pnpm --filter web start
```

Deploy this app as a standard Next.js application. Set both variables at build time, and configure the API's `WEB_URL` to exactly match `NEXT_PUBLIC_WEB_URL`.
