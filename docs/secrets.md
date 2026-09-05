# Secrets management

## Decision for the starter

Keep application code unaware of a secrets vendor. Secrets are injected as environment variables at process/build time.

For Vercel deployments, use **project-level environment variables** and mark confidential Production/Preview values as **Sensitive**. Sensitive values are write-only after creation. Development and E2E use separate non-production credentials; never pull production secrets onto a developer machine.

This keeps the initial architecture small while preserving a clean migration path to an external secrets manager later.

## Classification

### Public/browser configuration

These are not secrets and may be exposed to the browser:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_URL`
- `VITE_APP_URL`

### Server configuration that is not confidential

Keep these out of browser bundles because they configure server behavior, but they do not require secret storage:

- `CLERK_PUBLISHABLE_KEY`
- `CLERK_JWT_KEY` (public verification key)
- `EXPECTED_CLERK_ORG_ID`
- `FRONTEND_URL`
- `CUSTOMER_SLUG`

### Confidential values

Treat these as secrets:

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- telemetry/exporter auth headers or tokens
- third-party API keys introduced by product features
- `OPENAI_API_KEY`
- `AI_GATEWAY_API_KEY`
- `VERCEL_OIDC_TOKEN`

`AI_MODEL` and `AI_PROVIDER` are server-only configuration, not secrets. The gateway credential order is API key, environment OIDC token, then Vercel request-injected OIDC token. The mock provider ignores model and credential variables.

On Vercel, mark confidential Production/Preview variables Sensitive.

## Local development

Use dedicated development credentials. Two supported patterns:

1. Keep ignored `apps/*/.env.local` files populated with development-only credentials.
2. Link the appropriate Vercel project and use Vercel CLI environment tooling to populate/run the development environment.

Never copy a production customer `DATABASE_URL` or production Clerk secret into local E2E configuration.

## E2E testing

`tests/e2e/.env.e2e.local` is ignored and should point to:

- a Clerk development instance
- a synthetic test user that belongs to the configured test organization
- a dedicated Neon test database

The test environment is a disposable synthetic customer cell, not a production customer cell.

## When to add a dedicated secrets manager

Add a central secrets system when one or more become true:

- secrets need to stay synchronized across Vercel plus other runtimes such as Cloudflare
- rotating one credential across many customer deployments becomes repetitive
- you need richer audit trails, version history, approval flows, or point-in-time recovery
- developers need a consistent CLI-based secrets workflow without local env files
- the number of Vercel projects makes project-by-project updates error-prone

At that point, prefer a manager that can remain the source of truth and sync/inject into Vercel rather than adding secrets-fetching logic to application code. Infisical and Doppler are reasonable options; both support local CLI injection and Vercel synchronization. Keep the application consuming ordinary environment variables either way.

## Rotation rule

Rotate upstream first, update the injected Vercel value while the old credential remains valid, redeploy, verify, then revoke the old credential. Do not invalidate a credential before the replacement has reached the deployment.
