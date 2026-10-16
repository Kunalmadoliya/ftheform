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
```

Copy `.env.example` to `.env` and set `DATABASE_URL` for the host database. `NODE_ENV`, `PORT`, `BASE_URL`, `WEB_URL`, `BETTER_AUTH_SECRET`, and `DATABASE_URL` are validated before the API starts. The API also needs provider credentials and, for email verification, `RESEND_API_KEY` and `EMAIL_FROM`. The web requires `NEXT_PUBLIC_WEB_URL` and `NEXT_PUBLIC_API_URL` at build time.

All URLs come exclusively from environment variables — no URL, domain, hostname, or port is hardcoded in source code. Set them correctly for each environment; the guidance below uses generic placeholders.

After configuring `.env`, start only the local database and apply migrations:

```bash
pnpm db:up
pnpm db:migrate
```

To run the complete containerized stack instead of the local development processes, use `docker compose up --build`.

## Development

```bash
pnpm --filter @repo/api dev
pnpm --filter web dev
```

The web and API origins are `NEXT_PUBLIC_WEB_URL`/`WEB_URL` and `BASE_URL`, respectively. Set them to the development origins from `.env.example`. The web runs on port 3000 and the API listens on port 4000; both package dev scripts load the root `.env`.

### AI form generation

AI generation runs in the API process through Inngest and uses the existing OpenAI SDK on the server only. Configure `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default `gpt-4.1-mini`) in the root `.env`; never add these values to `NEXT_PUBLIC_*` variables. The Inngest SDK uses `INNGEST_DEV` to send local events to its development server. Local development does not require Inngest Cloud event or signing keys.

Apply the generation-job table migration before using the feature:

```bash
pnpm db:migrate
```

Start these processes in separate terminals:

```bash
pnpm --filter @repo/api dev
npx inngest-cli@latest dev -u "$BASE_URL/api/inngest"
pnpm --filter web dev
```

In production, configure `OPENAI_API_KEY` and `OPENAI_MODEL` for the API. For Inngest Cloud, also configure `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`; register the API endpoint at `https://<api-host>/api/inngest`. Do not set `INNGEST_DEV` in production. The included Compose setup passes these values only to the API service. Missing AI credentials do not prevent unrelated API routes from starting, but generation will fail with an actionable status until the relevant service is configured.

From a form builder, enter a description of the fields to generate in the right sidebar and choose **Generate fields**. Generated fields are validated against supported form field definitions and appended after the existing fields in a single transaction. They appear in the builder when the background job completes. If the form is already published, use **Republish** to create a new live snapshot; existing submissions remain tied to their original snapshot.

Generation is limited to one pending/running job per form, 10 starts per user per UTC day, and 100 total fields per form. Jobs still pending or running after 10 minutes are marked failed, and stored prompts are cleared after 30 days.

Useful root commands are `pnpm dev`, `pnpm build`, `pnpm check-types`, `pnpm lint`, `pnpm format`, `pnpm db:generate`, and `pnpm db:migrate`.

## Request Flow

The browser uses the typed TRPC client in `apps/web/trpc`. Requests go to the API's `/trpc` endpoint. The API builds an auth-aware context from Better Auth cookies, protected procedures verify the session, and services enforce form ownership using the authenticated user ID. Publishing a form creates a versioned snapshot; public form submissions are tied to that snapshot and their answers are persisted separately from the in-progress draft. Form owners can review submitted responses and their answers from the form's Responses page.

The API also serves `/health`, `/openapi.json`, `/docs`, `/api/auth/*`, and OpenAPI-documented procedures via the `/api` prefix. Note that only procedures explicitly marked with an `openapi` metadata block are exposed as REST endpoints through the OpenAPI adapter; other tRPC procedures are accessible only via the `/trpc` endpoint.

## Cookie and CSRF Security

All authentication cookies (Better Auth) and the respondent identity cookie use **`SameSite=Lax`** in every environment. The `Secure` attribute is set automatically when `BASE_URL` uses `https:` — it is not tied to `NODE_ENV`.

**Same-registrable-domain requirement:** `SameSite=Lax` cookies are sent by the browser only when the initiating page and the target share the same *registrable domain* (the domain + its public-suffix, e.g. `example.com`). Therefore:

- The web app (`WEB_URL`) and the API (`BASE_URL`) **must share the same registrable domain**.
  - ✅ `https://forms.example.com` + `https://api.example.com` — same domain `example.com` — works.
  - ❌ `https://forms.example.com` + `https://my-api.render.com` — different domains — cookies will be blocked.
- The API logs a loud warning at startup if the domains differ.

`SameSite=None` (cross-site) cookies are intentionally not supported.

For CSRF protection, every state-changing request (`POST`, `PUT`, `PATCH`, `DELETE`) on `/trpc` and `/api` must carry an `Origin` header (or `Referer` as fallback) matching a trusted origin. Requests that fail this check receive `403`. Inngest webhook callbacks and OAuth redirect callbacks are exempt.

Trusted origins are built from `WEB_URL` and the optional `TRUSTED_ORIGINS` environment variable (comma-separated list of full HTTPS origins, no wildcards). Set `TRUSTED_ORIGINS` if you run preview or staging deployments that need to access the same API.

## Deploying

> **Same-domain rule:** The web app and API must share the same registrable domain. Choose a domain you control and create DNS records for both the web app and the API before configuring your hosts.

Deploy `apps/web` to your preferred static/Node.js host and `apps/api` to a Node.js service host, building both from the repository root with `pnpm --filter web build` and `pnpm --filter @repo/api build`.

In all examples below, replace `<web-domain>` with your registrable domain (e.g. `example.com`) and choose subdomains that point to the correct services.

### Development example values

```
# Development: both services run on localhost — cookies work without HTTPS.
NODE_ENV=development
WEB_URL=http://localhost:3000
BASE_URL=http://localhost:4000
NEXT_PUBLIC_WEB_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/trpc
```

### Production example values

```
# Production: both services use HTTPS and share the same registrable domain.
NODE_ENV=production
WEB_URL=https://<web-domain>
BASE_URL=https://api.<web-domain>
NEXT_PUBLIC_WEB_URL=https://<web-domain>
NEXT_PUBLIC_API_URL=https://api.<web-domain>/trpc
```

Set the **web build-time** environment variables in your hosting provider's build settings:

- `NEXT_PUBLIC_WEB_URL=https://<web-domain>`
- `NEXT_PUBLIC_API_URL=https://api.<web-domain>/trpc`

Create a PostgreSQL database in your preferred provider (e.g. Neon) and copy its connection string. Keep any required TLS option (e.g. `sslmode=require`) in that value. Set the string as `DATABASE_URL` in both your API service and any environment used to run production migrations. Do not commit it or put it in a `NEXT_PUBLIC_*` variable.

Set these **API** environment variables in your hosting provider (the host provides `PORT`; `DATABASE_URL` is the production PostgreSQL connection string):

- `NODE_ENV=production`
- `PORT` (provided by host)
- `BASE_URL=https://api.<web-domain>`
- `WEB_URL=https://<web-domain>`
- `DATABASE_URL` (the production PostgreSQL connection string)
- `BETTER_AUTH_SECRET` and `RESPONDENT_COOKIE_SECRET` (separate random values of at least 32 characters)
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY` and `EMAIL_FROM` for verification email delivery
- `TRUSTED_ORIGINS` (optional; comma-separated additional trusted origins for preview/staging deployments)

Register these **OAuth callback URLs** with the providers — they must use the API's public URL (`BASE_URL`), not the web URL:

- `https://api.<web-domain>/api/auth/callback/google`
- `https://api.<web-domain>/api/auth/callback/github`

For local development, set `DATABASE_URL` in the root `.env` to the host PostgreSQL URL (normally `localhost:5432`). To explicitly run a migration against a remote database from PowerShell, set `$env:DATABASE_URL` to the remote connection string in that shell before `pnpm db:migrate`.

The API rejects production configuration unless both public origins use HTTPS and neither points to localhost. Apply database migrations before serving traffic. The included Compose setup starts PostgreSQL, runs migrations against the configured `POSTGRES_DB`, and then starts the API and web app on ports 4000 and 3000.

The interactive `/docs` page is enabled only in development.

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
