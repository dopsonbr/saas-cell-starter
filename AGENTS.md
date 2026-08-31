# Agent Operating Contract

This is the canonical instruction file for coding agents in this repository. If another agent file conflicts with this one, **AGENTS.md wins**.

## Goal

Build maintainable B2B SaaS products using isolated customer cells:

`React SPA -> dedicated HTTP API -> dedicated Neon database`

Clerk is shared identity. Telemetry/analytics may be shared only when they do not contain customer payload data.

## Hard architecture rules

- Keep frontend and backend runtime boundaries real. Never add server actions, direct database access from the browser, or framework magic that bypasses the HTTP API.
- `apps/web` MUST NOT import from `apps/api` or `packages/db`.
- `packages/auth` owns Clerk integration. `packages/ui` owns reusable UI primitives and design-system utilities.
- `apps/api` owns authorization and all access to customer data.
- Treat the deployment as single-tenant. Do not add `tenant_id` filters to compensate for shared storage; each customer receives a dedicated database.
- Every protected API request must verify a Clerk session and `EXPECTED_CLERK_ORG_ID`.
- Never expose `CLERK_SECRET_KEY`, `DATABASE_URL`, or server-only telemetry credentials to Vite/client code. Keep all server-only configuration, including `CLERK_JWT_KEY`, out of browser bundles even when the value itself is public.
- Shared observability must contain metadata, IDs, timings, counts, error categories, and traces—not raw customer records, request bodies, document contents, emails, or database values.
- Do not introduce a control plane unless an ADR explicitly approves it.
- Do not add a required CI/CD pipeline to the starter. Validation is local/pre-release unless a product-specific ADR chooses otherwise.
- Application code must consume secrets through environment variables; do not add runtime coupling to a secrets vendor without an ADR.

## Preferred implementation patterns

### Frontend

- React + Vite + TypeScript.
- TanStack Router for client routing.
- TanStack Query for server state. Avoid putting API data into global client stores.
- Reusable shadcn primitives live in `packages/ui`; do not create a second app-local primitive library.
- Import Clerk browser APIs through `@starter/auth/react`, not directly from Clerk packages.
- Components should remain presentational when possible; data loading belongs in route/page hooks or feature hooks.
- Prefer tables/charts/views driven by API DTOs rather than hard-coded demo data.

### API

- Hono on Vercel.
- REST-ish JSON endpoints under `/v1`.
- Validate request input with schemas from `packages/contracts`.
- Return explicit DTOs; never return Drizzle rows blindly.
- Keep domain logic out of HTTP handlers once it is more than trivial orchestration.
- Public endpoints should be exceptional (`/health`, webhook endpoints that verify their own signatures).
- Import reusable Clerk request authentication through `@starter/auth/server`; app code owns env wiring and route policy.

### Database

- Drizzle migrations are source-controlled.
- Migrations must be forward-compatible with the currently deployed API during rollout.
- Never modify a customer schema manually.
- Schema differences between customers are forbidden. Use configuration/feature flags instead.

## Before implementing a feature

For non-trivial work, create `docs/plans/<slug>.md` from `docs/plans/_template.md` and include:

- problem / user outcome
- constraints
- API changes
- DB changes
- UI states
- acceptance criteria
- verification evidence

Small bug fixes and copy changes do not require a plan.

## Definition of done

There is no required CI pipeline. Run the relevant checks locally, or explain why a required external test environment was unavailable:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

For changes that affect customer-facing browser or API behavior, run the relevant Playwright suite when the E2E Clerk/Neon cell is configured:

```bash
pnpm e2e:web
pnpm e2e:api
```

For UI work, verify empty/loading/error/success states. For API work, verify unauthenticated, invalid-input, and happy-path behavior where applicable. Wrong-org behavior must be verified when auth middleware or organization policy changes.

## Documentation obligations

Update docs when changing architecture, security boundaries, environment variables, deployment shape, or customer onboarding. Create an ADR for structural decisions that would be expensive to reverse.

## Anti-patterns

Do not:

- replace the SPA/API split with Next.js server components/actions
- access Neon from React
- use Clerk user metadata as the primary product database
- share one Neon project across customer deployments without an ADR
- log tokens, secrets, raw request bodies, SQL values, or customer documents
- build speculative generic abstractions into the starter
- silently add infrastructure that requires a shared customer-data store
- commit `.env.local`, `.env.e2e.local`, Playwright auth state, tokens, or generated secret files


## Package ownership

- `packages/auth`: Clerk-specific browser/provider code and reusable API authentication middleware. Keep the `react` and `server` entry points runtime-safe and separate.
- `packages/ui`: reusable shadcn primitives, shared styles, hooks, and UI utilities. Keep product/feature components in apps until they are genuinely reusable.
- Do not make `packages/ui` depend on product domain packages or API clients.
