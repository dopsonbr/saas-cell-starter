# Architecture

## System shape

A product has one shared marketing site and many isolated customer cells.

```text
                         Clerk application
                               │
                        organization/session
                               │
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
 customer A                 customer B             customer N
 ┌───────────┐              ┌───────────┐
 │ React SPA │              │ React SPA │
 └─────┬─────┘              └─────┬─────┘
       │ bearer JWT                │ bearer JWT
 ┌─────▼─────┐              ┌─────▼─────┐
 │ Hono API  │              │ Hono API  │
 └─────┬─────┘              └─────┬─────┘
       │                           │
 ┌─────▼─────┐              ┌─────▼─────┐
 │ Neon DB A │              │ Neon DB B │
 └───────────┘              └───────────┘
       │                           │
       └──── sanitized shared telemetry / analytics ────>
```

## Why this starter chooses physical isolation

The deployment/database boundary prevents an ordinary application bug such as a missing tenant predicate from reading another customer's data. The tradeoff is operational: releases, migrations, environment configuration, and incident response happen across multiple deployments.

For early-stage B2B SaaS, this starter intentionally accepts that tradeoff and keeps provisioning manual. Automation should be introduced only when repeated operational work justifies a control plane.

## Source-code topology vs deployment topology

There is **one product codebase**, not one codebase per customer.

```text
source repo
  apps/web   ─────────► customer-a-web
            ├────────► customer-b-web
            └────────► customer-n-web

  apps/api   ─────────► customer-a-api
            ├────────► customer-b-api
            └────────► customer-n-api
```

Each API deployment receives only its own Neon `DATABASE_URL` and expected Clerk Organization ID.

## Frontend/backend boundary

Allowed dependency direction:

```text
apps/web -> packages/auth/react
apps/web -> packages/ui
apps/web -> packages/api-client -> packages/contracts
apps/api -> packages/auth/server
apps/api -> packages/contracts
apps/api -> packages/db
```

Forbidden:

```text
apps/web -> apps/api
apps/web -> packages/db
packages/api-client -> packages/db
```

`packages/contracts` contains transport-level schemas/DTOs only. It must not become a shared domain layer that lets backend implementation details leak into the browser.

## Authentication and authorization

`packages/auth` is the single Clerk integration boundary. Its `react` export owns the Clerk provider and browser auth components; its `server` export owns reusable request authentication and organization enforcement.

The SPA gets a short-lived Clerk session token and sends it as `Authorization: Bearer <token>` to the dedicated API. The API verifies the token and checks that its `orgId` equals the deployment's `EXPECTED_CLERK_ORG_ID`.

This means a valid user from another customer organization still cannot use the wrong customer's API deployment.

## Data-driven UI

The starter dashboard intentionally loads all business data from `/v1/*` endpoints through TanStack Query. UI components never synthesize authoritative business state locally.

## Collaborative-content sample

`content_items` demonstrates a production-shaped lifecycle without pretending to be a product domain. Every authenticated member of the deployment-pinned Clerk organization has equal permissions. `createdByUserId` is audit metadata, not an ownership boundary. Draft and published items remain editable; publishing is idempotent; revocation returns an item to draft; archiving is terminal.

Public access is the exceptional unauthenticated route `GET /public/v1/items/:shareToken`. Malformed, unknown, revoked, draft, and archived tokens all return the same `404` boundary.

AI follows the same runtime separation: schemas live in `packages/contracts`, provider code and credentials remain in `apps/api`, and the browser renders only validated structured suggestions. Suggestions change unsaved local form state only.

## Component library

`packages/ui` owns reusable shadcn primitives, design-system utilities, and global Tailwind styling. Feature-specific compositions stay in the consuming app; generic primitives belong in `packages/ui`. The package follows shadcn monorepo aliases so the CLI can add reusable primitives to the shared package instead of copying them into `apps/web`.

## Secrets boundary

Applications receive configuration through environment variables. Vercel is the initial injection/store boundary for deployments; confidential Preview/Production values are marked Sensitive. Product code does not know whether those environment variables originated in Vercel directly or were synchronized from a dedicated secrets manager. See `docs/secrets.md` and ADR 0006.

## End-to-end verification

`tests/e2e` exercises the SPA and API across their real HTTP boundary with Playwright. It uses a synthetic Clerk organization/user and a dedicated Neon test database. The API suite sends network requests rather than importing handlers, and the web suite proves UI -> API -> database behavior. No CI pipeline is part of the architecture.
