# End-to-end testing

The starter uses one Playwright suite for both the browser and the HTTP API. There is no CI requirement; E2E is a local/pre-release command that uses a synthetic customer cell.

## What is exercised

### API E2E

The `api` Playwright project starts the real local Hono server and verifies over HTTP:

- `/health` is public
- protected endpoints reject unauthenticated requests
- an authenticated expected-organization session can use the complete content lifecycle
- an independent wrong-organization session receives `403`
- unauthenticated checks use an empty request context
- invalid input, public revocation, CORS with `X-Run-Id`, and deterministic mock streaming

API tests use Playwright's request client; they do not import API handlers directly.

### Web E2E

The browser projects start the real Vite SPA and paired API and verify:

- signed-out users see the auth boundary
- a Clerk test user can establish an authenticated session
- the expected Clerk organization is made active
- the dashboard renders data from the API
- a user can create/edit/hard-refresh, apply an AI suggestion, explicitly save, publish, view publicly, and revoke
- loading, empty, error, success, revoked, archived, desktop, and mobile states
- structured suggestions are rendered as UI rather than raw JSON

## Test environment

Copy:

```bash
cp tests/e2e/.env.e2e.example tests/e2e/.env.e2e.local
```

Populate it with a **Clerk development instance** and **dedicated Neon test database**. Create two independent synthetic users: one only in `EXPECTED_CLERK_ORG_ID`, and one only in `E2E_WRONG_CLERK_ORG_ID`.

Set `E2E_DATABASE_URL` and explicitly opt in with `E2E_ALLOW_RESET=1`. Each suite migrates and resets only `content_items` before its serial run.

Install the browser once:

```bash
pnpm e2e:install
```

Then run:

```bash
pnpm e2e          # API + web
pnpm e2e:api      # HTTP API only
pnpm e2e:web      # SPA flows only
```

Playwright uses strict local ports API `3101` and web `5177`, one worker, and does not reuse processes unless `E2E_REUSE_SERVERS=1`. If both `E2E_WEB_URL` and `E2E_API_URL` are supplied, local server processes are omitted entirely.

Optional live-provider completion is enabled only when live provider variables are intentionally supplied. Missing live credentials or deployed preview URLs do not weaken or skip deterministic mock/local coverage.
