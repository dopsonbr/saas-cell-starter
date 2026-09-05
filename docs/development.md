# Development

## Local topology

- web: `http://localhost:5173`
- api: `http://localhost:3001`
- marketing: `http://localhost:5174`

Use a dedicated Neon development branch/project and Clerk development instance. Local development may represent one synthetic customer cell.

## Commands

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
pnpm run doctor
pnpm verify:template
pnpm e2e:api
pnpm e2e:web
```

Database:

```bash
pnpm --filter @starter/db db:generate
pnpm --filter @starter/db db:migrate
pnpm --filter @starter/db db:seed
```

## Adding a feature

1. Add/adjust DTO schemas in `packages/contracts`.
2. Implement API behavior in `apps/api`.
3. Add a browser call in `packages/api-client`.
4. Consume it from a TanStack Query hook/page in `apps/web`.
5. Reuse primitives from `packages/ui`; add a new shared primitive there only when it is generic.
6. Add a DB migration only if storage changes.
7. Verify loading, empty, error, and populated states.

This order keeps the HTTP contract explicit.

## E2E

Use the Playwright suite in `tests/e2e` for real browser/API verification. It starts the local API and SPA and uses a synthetic Clerk organization/user plus a dedicated Neon test database. See `docs/testing.md` for setup. E2E is intentionally local/pre-release; this starter does not require CI.


## Adding shadcn components

Run from the repository root:

```bash
pnpm dlx shadcn@latest add dialog -c apps/web
```

The monorepo `components.json` files route shared UI primitives into `packages/ui`. Keep feature-specific composed components in `apps/web`.

## AI providers

`AI_PROVIDER=mock` is deterministic and needs no network credential or model. For `openai`, set `AI_MODEL` and server-only `OPENAI_API_KEY`. For `vercel-gateway`, use a `provider/model` ID and credentials in this precedence: `AI_GATEWAY_API_KEY`, `VERCEL_OIDC_TOKEN`, then Vercel's request-injected OIDC token. Never add these to Vite variables.

Before enabling live AI in a production cell, configure provider-side budget and rate controls for that customer. The starter intentionally has no shared rate-limit database or control plane.

Collaborator failures expose only stable categories: `invalid_request`, `rate_limited`, `budget_exceeded`, `timeout`, `provider_auth_missing`, `structured_output_error`, or `provider_unavailable`. Provider messages and customer text are not returned or logged.
