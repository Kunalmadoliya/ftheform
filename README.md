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

- Node.js 22 or newer
- pnpm 12
- Docker Desktop or another Docker runtime for PostgreSQL

```bash
pnpm install
pnpm db:up
pnpm db:migrate
```

Configure `DEV_DATABASE_URL` for the API running on the host (`localhost:5432`) and `PROD_DATABASE_URL` for the API and migrations running in Compose (the `postgresdb` service hostname). `NODE_ENV` must be `development` or `production`; the database package selects and validates the matching URL. The API also needs Better Auth secrets and provider credentials, `BASE_URL`, `WEB_URL`, `RESEND_API_KEY`, and `EMAIL_FROM` so it can send required email-verification links. The web needs `NEXT_PUBLIC_API_URL`.

Set `RESPONDENT_COOKIE_SECRET` to a separate random value of at least 32 characters; it signs respondent identity cookies and must be shared by every API instance. Prefer hosting the web app and API under the same site (for example, `forms.example.com` and `api.example.com`): the respondent cookie can then use `SameSite=Lax`. When the web and API are on different sites, production uses `SameSite=None; Secure`, which requires HTTPS and may be restricted by browser third-party-cookie policies.

## Development

```bash
pnpm --filter @repo/api dev
pnpm --filter web dev
```

The web app runs on `http://localhost:3000`. The API runs on `http://localhost:4000` by default.

### AI form generation

AI generation runs in the API process through Inngest and uses the existing OpenAI SDK on the server only. Configure `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default `gpt-4.1-mini`) in the root `.env`; never add these values to `NEXT_PUBLIC_*` variables. The Inngest SDK uses `INNGEST_DEV=http://localhost:8288` to send local events to its development server. Local development does not require Inngest Cloud event or signing keys.

Apply the generation-job table migration before using the feature:

```bash
pnpm db:migrate
```

Start these processes in separate terminals:

```bash
pnpm --filter @repo/api dev
npx inngest-cli@latest dev -u http://localhost:4000/api/inngest
pnpm --filter web dev
```

In production, configure `OPENAI_API_KEY` and `OPENAI_MODEL` for the API. For Inngest Cloud, also configure `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`; register the API endpoint at `https://<public-api-host>/api/inngest`. Do not set `INNGEST_DEV` in production. The included Compose setup passes these values only to the API service. Missing AI credentials do not prevent unrelated API routes from starting, but generation will fail with an actionable status until the relevant service is configured.

From a form builder, enter a description of the fields to generate in the right sidebar and choose **Generate fields**. Generated fields are validated against supported form field definitions and appended after the existing fields in a single transaction. They appear in the builder when the background job completes. If the form is already published, use **Republish** to create a new live snapshot; existing submissions remain tied to their original snapshot.

Useful root commands are `pnpm dev`, `pnpm build`, `pnpm check-types`, `pnpm lint`, `pnpm format`, `pnpm db:generate`, and `pnpm db:migrate`.

## Request Flow

The browser uses the typed TRPC client in `apps/web/trpc`. Requests go to the API's `/trpc` endpoint. The API builds an auth-aware context from Better Auth cookies, protected procedures verify the session, and services enforce form ownership using the authenticated user ID. Publishing a form creates a versioned snapshot; public form submissions are tied to that snapshot and their answers are persisted separately from the in-progress draft. Form owners can review submitted responses and their answers from the form's Responses page.

The API also serves `/health`, `/openapi.json`, `/docs`, `/api/auth/*`, and the OpenAPI-backed `/api/*` procedures.

## Deployment

Deploy `apps/api` and `apps/web` as separate applications. Build from the repository root with `pnpm --filter @repo/api build` and `pnpm --filter web build`. Run the API with `pnpm --filter @repo/api start`. Configure the production database, auth settings, public API URL, allowed web origin, and `NEXT_PUBLIC_API_URL`. Apply database migrations before starting the API.

For the included Compose setup, start PostgreSQL with `docker compose up -d postgresdb`. Development uses `DEV_DATABASE_URL` from the host; production uses a separate `PROD_DATABASE_URL` on the `postgresdb` service. Provision that production database once before starting the production stack, for example `docker compose exec postgresdb sh -c 'createdb -U "$POSTGRES_USER" ftheform_prod'`. Then run `docker compose up -d --build`; Compose waits for PostgreSQL health and successful migrations before starting the API.

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
