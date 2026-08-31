# End-to-end testing

The starter uses one Playwright suite for both the browser and the HTTP API. There is no CI requirement; E2E is a local/pre-release command that uses a synthetic customer cell.

## What is exercised

### API E2E

The `api` Playwright project starts the real local Hono server and verifies over HTTP:

- `/health` is public
- protected endpoints reject unauthenticated requests
- an authenticated Clerk session can load `/v1/dashboard`
- the dashboard request reaches the configured Neon database
- invalid authenticated writes are rejected by contract validation

API tests use Playwright's request client; they do not import API handlers directly.

### Web E2E

The browser projects start the real Vite SPA and paired API and verify:

- signed-out users see the auth boundary
- a Clerk test user can establish an authenticated session
- the expected Clerk organization is made active
- the dashboard renders data from the API
- a user can create a record through UI -> HTTP API -> Neon and see the refreshed result

## Test environment

Copy:

```bash
cp tests/e2e/.env.e2e.example tests/e2e/.env.e2e.local
```

Populate it with a **Clerk development instance** and **dedicated Neon test database**. Create a synthetic user (a `+clerk_test` address is recommended by Clerk for tests) and make that user a member of `EXPECTED_CLERK_ORG_ID`.

Apply migrations before running E2E:

```bash
DATABASE_URL='<e2e database url>' pnpm --filter @starter/db db:migrate
```

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

Playwright starts the local API and web servers automatically. Existing servers on ports 3001/5173 are reused.

## Deliberate omissions

The default suite has one Clerk organization. Wrong-organization `403` verification remains a security acceptance check when changing auth middleware. If cross-org behavior becomes an area of active development, add a second synthetic organization/user fixture rather than weakening the middleware for tests.

The E2E suite does not use production customer data, production Clerk credentials, or a production Neon project.
