# FTHEFORM Web

The web application is the Next.js frontend for FTHEFORM. It contains the public landing and auth screens plus the authenticated dashboard for creating, listing, editing, and deleting forms.

## Run Locally

From the repository root:

```bash
pnpm --filter web dev
```

Open `http://localhost:3000`. The API must be running separately with `pnpm --filter @repo/api dev`.

## Environment

Set `NEXT_PUBLIC_API_URL` to the API's TRPC endpoint:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/trpc
```

Authentication uses the Better Auth session cookie supplied by the API, so the API CORS configuration must allow the web origin.

## Frontend Structure

- `app/` contains Next.js routes, including login, sign-up, and dashboard pages.
- `components/` contains auth and shared UI components.
- `hooks/form/` contains hooks for form and form-field procedures.
- `hooks/auth/` contains auth procedure hooks and social sign-in helpers.
- `trpc/` contains the typed browser client and HTTP links.

## Checks and Deployment

```bash
pnpm --filter web check-types
pnpm --filter web lint
pnpm --filter web build
pnpm --filter web start
```

Deploy this app as a standard Next.js application. Set `NEXT_PUBLIC_API_URL` at build time, and configure the API's `WEB_URL` to the deployed frontend origin.
