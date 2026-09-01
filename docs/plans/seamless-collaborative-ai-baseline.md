# Plan: Collaborative AI product baseline

## Outcome

Upgrade the starter so a freshly initialized project provides a reproducible B2B SaaS baseline with Clerk organization authentication, a dedicated Hono API and Neon database, a generic content lifecycle, a mock-first AI collaborator, hardened E2E coverage, and three-project Vercel packaging.

Deliver the work from `codex/seamless-collaborative-ai-baseline` as one pull request to `main`. Do not merge or deploy production.

## Constraints

- Preserve `React SPA -> authenticated HTTP API -> dedicated Neon database`.
- Keep Clerk integration in `packages/auth`, customer authorization and data access in `apps/api`, reusable primitives in `packages/ui`, and request/response schemas in `packages/contracts`.
- Give all members of `EXPECTED_CLERK_ORG_ID` equal item permissions; retain the creator ID as audit metadata.
- Default AI to a deterministic credential-free mock. OpenAI and Vercel AI Gateway remain optional server-side providers.
- Keep local/pre-release validation canonical. Do not add required CI, a shared customer-data store, a control plane, or production deployment.

## API changes

- Add authenticated dashboard, item list/create/read/update/share/revoke/archive endpoints under `/v1`.
- Add signed-out `GET /public/v1/items/:shareToken` with fail-closed `404` responses.
- Add authenticated `POST /v1/ai/collaborator` using validated AG-UI input and structured SSE output.
- Extend `/health` with optional source revision metadata.

Lifecycle rules:

- Create as `draft`.
- Draft and published items are editable; published edits are immediately public.
- Sharing publishes and returns an idempotent existing-or-new token.
- Revoking clears the token and publication timestamp and returns the item to draft.
- Archiving is terminal and clears public access.

## Database changes

- Replace the generic records schema with `content_items`: UUID ID, title, body, JSON tags, lifecycle status, creator user ID, unique nullable share token, and published/created/updated timestamps.
- Commit the initial Drizzle migration and a harmless generic seed.
- Add a guarded E2E reset command that requires `E2E_DATABASE_URL` and `E2E_ALLOW_RESET=1`.

## UI states

- Add routed dashboard/library, new-item, editor, and public-share views.
- Cover loading, empty, validation, saving, success, error, revoked, and archived states.
- Lazy-load the collaborator and support ready, streaming, stopped, retry, error, and completed states.
- Render typed suggestion cards with per-field and apply-all controls; never autosave or expose raw structured JSON.

## Implementation steps

1. Pin the toolchain and all external dependencies, commit the lockfile, and correct package ESM/build exports.
2. Replace initialization with a guarded atomic workflow; add doctor, template, E2E, and deployment verification commands.
3. Implement content contracts, migration, service, HTTP endpoints, API client, and routed UI.
4. Implement deterministic mock and optional OpenAI/Gateway structured streaming with bounded input, timeout, safe telemetry, and abort handling.
5. Harden Playwright with dedicated ports, independent expected/wrong-organization users, a guarded database reset, deployed-mode server omission, and deterministic API/browser scenarios.
6. Update architecture, product, development, testing, deployment, security, secrets, onboarding, README, AGENTS guidance, and an ADR for the sample/provider boundary.
7. Run local verification, self-review against `origin/main`, push the branch, and open one PR for review.

## Acceptance criteria

- [ ] A disposable copy initializes once, refuses an unforced second run, preserves existing environment files, and passes frozen install plus `pnpm check`.
- [ ] Mock AI works without credentials; live providers fail closed when their model or credentials are missing.
- [ ] AI suggestions remain unsaved until the user explicitly saves.
- [ ] Content lifecycle, public revocation, organization pinning, invalid input, CORS, and structured stream behavior are covered.
- [ ] Browser tests cover authentication, persistence after refresh, presentation integrity, and representative mobile usability.
- [ ] Server workspace packages build to resolvable JavaScript for direct Vercel packaging.
- [ ] No secrets, auth states, test artifacts, or customer payloads enter Git or shared telemetry.
- [ ] One pushed PR targets `main`; no production deployment or merge occurs.

## Verification evidence

Record exact results for frozen install, typecheck, lint, build, doctor, template verification, configured E2E checks, local Vercel packaging, `git diff --check`, and final branch/PR state in the pull-request description. Clearly list any external checks that could not run because credentials or deployment URLs were unavailable.
