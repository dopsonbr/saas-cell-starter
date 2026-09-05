# SaaS Cell Starter

Reusable starter for a B2B SaaS where **each customer gets an isolated React SPA, API deployment, and Neon Postgres project**. Authentication is shared through Clerk; operational telemetry and product analytics can flow to shared destinations.

## Architecture

```text
                          Shared Clerk
                              │
                ┌─────────────┴─────────────┐
                │                           │
      Customer A deployment       Customer B deployment
      ┌──────────────────┐        ┌──────────────────┐
      │ React/Vite SPA   │        │ React/Vite SPA   │
      └────────┬─────────┘        └────────┬─────────┘
               │ HTTPS                    │ HTTPS
      ┌────────▼─────────┐        ┌────────▼─────────┐
      │ Dedicated Hono   │        │ Dedicated Hono   │
      │ API on Vercel    │        │ API on Vercel    │
      └────────┬─────────┘        └────────┬─────────┘
               │                          │
      ┌────────▼─────────┐        ┌────────▼─────────┐
      │ Dedicated Neon   │        │ Dedicated Neon   │
      │ project          │        │ project          │
      └──────────────────┘        └──────────────────┘
               │                          │
               └──── shared telemetry ────┘
```

There is **no control plane** and **no required CI pipeline** in this starter. Provisioning and release promotion are intentionally documented/manual until scale justifies automation.

## Stack

- React + Vite + TypeScript
- TanStack Router + TanStack Query
- shadcn-style component library in `packages/ui` + Tailwind CSS
- Clerk integration isolated in `packages/auth` for React and API auth
- Hono for a dedicated HTTP API
- Drizzle ORM + Neon Postgres
- Vercel for `marketing`, customer `web`, and customer `api` projects
- Provider-neutral structured telemetry with customer/cell metadata

## Repository

```text
apps/
  marketing/       Shared public product/landing site
  web/             Customer SPA; one deployment per customer
  api/             Customer API; one deployment per customer
packages/
  analytics/       Shared product-analytics adapter boundary
  auth/            Clerk React provider/components + server auth middleware
  api-client/      Browser-safe HTTP client only
  contracts/       HTTP DTOs and validation schemas only
  db/              Server-only Drizzle schema and Neon connection
  telemetry/       Structured telemetry helpers
  ui/              Shared shadcn component library and design-system styles

tests/
  e2e/             Playwright browser + real HTTP API end-to-end tests

docs/
  adr/             Architecture decisions
  plans/           Agent implementation plans
  secrets.md       Secrets classification, Vercel policy, upgrade triggers
  testing.md       Local API + web E2E setup
```

## Architectural invariants

1. The browser talks to the backend **only through HTTP**.
2. `apps/web` consumes auth through `@starter/auth/react` and shared components through `@starter/ui`; it must never import `db` or API internals.
3. `apps/api` is the only application allowed to access `DATABASE_URL`.
4. Every customer API verifies Clerk authentication **and** the expected Clerk Organization ID through `@starter/auth/server`.
5. Each customer gets its own Neon project and database credentials.
6. Customer payloads must not be copied into shared telemetry or analytics systems.
7. Marketing is shared per product; `web + api + db` are isolated per customer.
8. Confidential deployment values are injected at runtime/build time; application code does not fetch secrets from a secrets manager.

See [`AGENTS.md`](./AGENTS.md) and [`docs/architecture.md`](./docs/architecture.md) before making structural changes.

## First-time setup

```bash
corepack enable
pnpm install
pnpm init:project -- --name "My Product" --slug my-product
```

Then configure local environment files:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env.local
cp apps/marketing/.env.example apps/marketing/.env.local
```

Create a Clerk application and organization, create a Neon project for your first customer, and populate the env files. The browser uses `VITE_CLERK_PUBLISHABLE_KEY`; the API uses `CLERK_PUBLISHABLE_KEY` plus the server-only `CLERK_SECRET_KEY` for explicit request verification.

## Development

Run everything:

```bash
pnpm dev
```

Or independently:

```bash
pnpm --filter @starter/web dev
pnpm --filter @starter/api dev
pnpm --filter @starter/marketing dev
```

Default local URLs:

- customer SPA: `http://localhost:5173`
- API: `http://localhost:3001`
- marketing: `http://localhost:5174`

## Database

```bash
pnpm --filter @starter/db db:generate
pnpm --filter @starter/db db:migrate
pnpm --filter @starter/db db:seed
```

The sample domain is intentionally generic: `records`. Replace it when starting a real product rather than accumulating generic starter abstractions.

## Vercel deployment model

Create three Vercel projects from this repository:

| Project               | Root directory   | Scope                         |
| --------------------- | ---------------- | ----------------------------- |
| `<product>-marketing` | `apps/marketing` | One shared product deployment |
| `<customer>-web`      | `apps/web`       | One per customer              |
| `<customer>-api`      | `apps/api`       | One per customer              |

For every additional customer, create a new **web Vercel project**, **API Vercel project**, and **Neon project**, then bind the customer's Clerk organization ID through `EXPECTED_CLERK_ORG_ID`.

Vercel requires an SPA rewrite so client-side routes resolve to `index.html`; this starter includes it in `apps/web/vercel.json`. Hono is deployed as its own Vercel backend application.

See [`docs/deployment.md`](./docs/deployment.md) for the full environment matrix and customer onboarding checklist, [`docs/secrets.md`](./docs/secrets.md) for secrets policy, and [`docs/observability.md`](./docs/observability.md) for shared telemetry/analytics policy.

## End-to-end testing

The starter includes Playwright E2E for both the dedicated API and customer SPA. Tests run against the real local HTTP servers, Clerk development auth, and a dedicated Neon test database. No CI service is required.

```bash
cp tests/e2e/.env.e2e.example tests/e2e/.env.e2e.local
pnpm e2e:install
pnpm e2e

# narrower loops
pnpm e2e:api
pnpm e2e:web
```

See [`docs/testing.md`](./docs/testing.md).

## Secrets

The default deployment model uses Vercel project environment variables. Mark confidential Preview/Production values such as `DATABASE_URL`, `CLERK_SECRET_KEY`, and exporter credentials as **Sensitive**. Keep development/E2E credentials separate from production. The code consumes ordinary environment variables so an external source of truth such as Infisical or Doppler can be introduced later without changing application code.

See [`docs/secrets.md`](./docs/secrets.md) and ADR 0006.

## Making this a reusable template

Recommended flow:

1. Push this repository to GitHub.
2. Mark it as a **Template repository**.
3. Create a new repository from the template for each SaaS product.
4. Run `pnpm init:project -- --name "..." --slug ...` once.
5. Commit the renamed scaffold before product work starts.

Do **not** create a separate source repo per customer. Customers are separate deployments of one product codebase.

## Shared auth and UI packages

- Add reusable shadcn primitives from `apps/web` with `pnpm dlx shadcn@latest add <component> -c apps/web`; the monorepo aliases route UI primitives into `packages/ui`.
- Browser Clerk usage should import only from `@starter/auth/react`.
- API Clerk verification should import only from `@starter/auth/server`.
- App code should not depend directly on `@clerk/react`, `@clerk/backend`, `@clerk/ui`, `class-variance-authority`, `clsx`, or `tailwind-merge` unless an ADR intentionally changes package ownership.
