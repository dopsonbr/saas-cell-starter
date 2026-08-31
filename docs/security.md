# Security Model

## Security boundary

For customer business data, the primary boundary is:

`customer API deployment + customer database credentials + customer Neon project`

Clerk identity is shared, but authorization is pinned to one Clerk Organization ID per API deployment.

## Required API checks

For protected routes:

1. Require a Clerk session token.
2. Verify token signature and authorized party/origin.
3. Require `auth.orgId`.
4. Compare it with `EXPECTED_CLERK_ORG_ID`.
5. Only then execute customer-data operations.

## Secrets

Browser-visible configuration:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_URL`
- public analytics write keys only when the analytics provider considers them public

Server-only confidential values:

- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- telemetry/exporter credentials

Server-only configuration that is not confidential:

- `CLERK_PUBLISHABLE_KEY`
- `CLERK_JWT_KEY` (public verification key)
- `EXPECTED_CLERK_ORG_ID`
- `FRONTEND_URL`

Do not put server-only values in variables prefixed with `VITE_`. On Vercel, mark confidential Preview/Production variables Sensitive. Local and E2E environments must use dedicated non-production credentials. See `docs/secrets.md`.

## Telemetry policy

Allowed shared fields include:

- `customer_slug` or opaque cell ID
- `service.name`
- route template
- status code
- latency
- trace/request IDs
- database duration and row count
- feature identifier
- error category

Disallowed without an explicit privacy review:

- raw request/response bodies
- tokens or cookies
- emails/names
- customer documents
- database values
- SQL bind parameters
- full URLs containing customer data

## CORS

Each API deployment allows only its paired `FRONTEND_URL`. Preview deployments require deliberate handling; do not use wildcard origins in production merely to make Vercel previews convenient.
