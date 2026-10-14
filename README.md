# Turborepo starter

This Turborepo starter is maintained by the Turborepo core team.

## Using this example

# FTHEFORM

FTHEFORM is a pnpm/Turborepo monorepo for authenticated form creation and management. The web application talks to an Express API, the API exposes authenticated tRPC procedures and OpenAPI documentation, and PostgreSQL stores forms, fields, users, and submissions.

## Repository Map

| Path                         | Role                                               | Deployment                  |
| ---------------------------- | -------------------------------------------------- | --------------------------- |
| `apps/web`                   | Next.js frontend and authenticated dashboard       | Deploy as a web application |
| `apps/api`                   | Express API, Better Auth, tRPC, and OpenAPI server | Deploy as a Node.js service |
| `packages/database`          | Drizzle schema, migrations, and auth persistence for forms, snapshots, fields, submissions, and answers | Internal package |
| `packages/services`          | Business logic for auth, forms, fields, snapshots, submissions, and answers | Internal package |
| `packages/trpc`              | Shared server router and client types              | Internal package            |
| `packages/logger`            | Shared Winston logger                              | Internal package            |
| `packages/eslint-config`     | Shared lint configuration                          | Internal package            |
| `packages/typescript-config` | Shared TypeScript configurations                   | Internal package            |

## Requirements

- Node.js 18 or newer
- pnpm 12
- Docker Desktop or another Docker runtime for PostgreSQL

```bash
pnpm install
pnpm db:up
pnpm db:migrate
```

Configure `DEV_DATABASE_URL` for the API running on the host (`localhost:5432`) and `PROD_DATABASE_URL` for the API and migrations running in Compose (the `postgresdb` service hostname). `NODE_ENV` must be `development` or `production`; the database package selects and validates the matching URL. The API also needs Better Auth secrets and provider credentials, `BASE_URL`, and `WEB_URL`. The web needs `NEXT_PUBLIC_API_URL`.

## Development

```bash
pnpm --filter @repo/api dev
pnpm --filter web dev
```

The web app runs on `http://localhost:3000`. The API runs on `http://localhost:4000` by default.

Useful root commands are `pnpm dev`, `pnpm build`, `pnpm check-types`, `pnpm lint`, `pnpm format`, `pnpm db:generate`, and `pnpm db:migrate`.

## Request Flow

The browser uses the typed TRPC client in `apps/web/trpc`. Requests go to the API's `/trpc` endpoint. The API builds an auth-aware context from Better Auth cookies, protected procedures verify the session, and services enforce form ownership using the authenticated user ID. Publishing a form creates a versioned snapshot; public form submissions are tied to that snapshot and their answers are persisted separately from the in-progress draft. Form owners can review submitted responses and their answers from the form's Responses page.

The API also serves `/health`, `/openapi.json`, `/docs`, `/api/auth/*`, and the OpenAPI-backed `/api/*` procedures.

## Deployment

Deploy `apps/api` and `apps/web` as separate applications. Build from the repository root with `pnpm --filter @repo/api build` and `pnpm --filter web build`. Run the API with `pnpm --filter @repo/api start`. Configure the production database, auth settings, public API URL, allowed web origin, and `NEXT_PUBLIC_API_URL`. Apply database migrations before starting the API.

For the included Compose setup, start PostgreSQL with `docker compose up -d postgresdb`. Development uses `DEV_DATABASE_URL` from the host; production uses a separate `PROD_DATABASE_URL` on the `postgresdb` service. Provision that production database once before starting the production stack, for example `docker compose exec postgresdb sh -c 'createdb -U "$POSTGRES_USER" ftheform_prod'`. Then run `docker compose up -d --build`; Compose waits for PostgreSQL health and successful migrations before starting the API.

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
