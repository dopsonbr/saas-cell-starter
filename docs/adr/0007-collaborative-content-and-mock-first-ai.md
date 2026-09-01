# ADR 0007: Collaborative content sample and mock-first AI boundary

- Status: Accepted
- Date: 2026-09-01

## Context

The starter needs a reproducible product-shaped workflow that exercises authentication, persistence, public sharing, streaming AI, and browser states without becoming a speculative domain framework or requiring paid AI credentials.

## Decision

Ship a generic `content_items` sample with draft, published, and terminal archived states. Every authenticated member of the deployment-pinned Clerk organization has equal lifecycle permissions. `createdByUserId` is audit metadata. Public access uses a nullable unique UUID token; publish is idempotent, revoke clears it, and every inaccessible token state returns `404`.

Ship a deterministic mock AI collaborator as the default. Provider adapters remain server-only in `apps/api`, validated transport schemas live in `packages/contracts`, and the web app renders structured field suggestions. Applying a suggestion changes local form state but never persists without an explicit save.

Direct OpenAI and Vercel AI Gateway are opt-in. A production cell must establish provider-side budget and rate controls before enabling either. This decision does not introduce a shared rate-limit store or control plane.

## Consequences

- Local development, template verification, and E2E remain deterministic without live AI access.
- Products get a complete example of organization authorization, database lifecycle, revocable public access, and structured streaming.
- Product initialization should replace the generic sample when a clearer domain exists.
- Live-provider cost and abuse controls remain an explicit per-cell deployment prerequisite.
