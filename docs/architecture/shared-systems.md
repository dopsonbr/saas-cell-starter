# Shared systems and independent verification

This guide describes proposed extensions to the [reference architecture](README.md), not services installed by the starter. Extract a capability when independent ownership or release cadence justifies it. The starter's local UI package can remain local until several products need it; an integration worker can remain inside `product-app` until its operations warrant separation.

## Shared UI without shared product authority

`design-system` owns accessible primitives, semantic tokens, themes, typography, icons and component examples. `product-app`, `control-plane` and an `evals` review interface own their layouts, routing, data loading and workflows. The library must not import product authorization, database types or API clients. A disabled button communicates state; the receiving API still enforces permission.

Prefer semantic contracts such as warning text, selected navigation and destructive action over copied color values. Preserve native form values, keyboard navigation, accessible names, focus restoration, pending states and explicit theme selection. Let consumers own page resets and responsive composition where their needs differ. If styles have several delivery formats, generate them from one authoritative source rather than maintaining divergent implementations.

Release built modules, declarations and required assets from a clean committed revision. Keep framework runtimes as peer dependencies where bundling another copy would break composition. The release contract records package name/version, producer revision, content digest and supported runtime range. Consumers pin the artifact, verify its integrity and commit corresponding dependency changes. A private registry or checked-in archive can provide this contract; adjacent source directories and floating branch dependencies cannot.

For changed release contents, issue a new version and integrate the producer before consumer updates. Verify the library's component behavior, then the affected consumer journeys: a library showcase passing keyboard tests does not prove a product dialog restores focus correctly. Test narrow screens, long labels, both themes, pending actions and native form submission. Keep a compatible old artifact available for rollback.

## Evals measure behavior; applications enforce it

`evals` owns cases, synthetic datasets, scorers, prompt templates, model settings and historical results. `product-app` owns canonical request schemas, authorization, deterministic calculations, parsing, state transitions and write transactions. It supplies validated context to a prompt and validates the result. A prompt instruction or favorable evaluation score must never become the authorization check.

Organize cases around measurable capabilities and processing stages: acquisition, interpretation, proposal, approval and execution. Measure transcription separately from interpretation; distinguish extraction accuracy from whether the application safely handles uncertain extraction. Deterministic scorers should cover exact amounts, identifiers, scope, required abstention and prohibited writes. A model judge can supplement quality review but cannot erase a deterministic failure or grade away a critical security violation.

Every run identifies the evaluator and application revisions, dataset/scorer hashes, prompt bytes, effective model settings, case population and evidence category. Categories include offline fixture, live model with synthetic input, hosted synthetic application and observed assistant-client behavior. A passing fixture is not an observed host interaction. Preserve failed, missing and skipped cases; declare repeated trials before execution instead of selecting the best result afterward. Record generation and judging costs together, with unknown prices explicitly unknown.

Initially, ship versioned prompt defaults as a small immutable package. Workbench and reporting dependencies should not enter the application runtime. Prompt changes require deliberate versions, relevant paired evaluations and consumer compatibility checks. The application remains deployable without an evaluator checkout or workbench service.

A later optional publisher can separate three objects:

1. Committed prompt source and its qualification evidence.
2. An immutable bundle identified by exact bytes and a digest.
3. An environment selection containing the bundle reference and increasing generation.

Upload and verify the bundle before changing selection. Reject stale publishers and competing changes with a conditional update. Rollback selects an earlier bundle using a newer generation; it does not rewind ordering. Define how APIs validate, cache and refresh selections and when they retain a last verified compatible bundle or fail closed. Document that boundary per capability. Source publication, environment selection and confirmed application adoption are separate events. A read-only report viewer needs neither publishing credentials nor model execution endpoints.

## External adapters and synthetic providers

The application adapter translates an external contract into domain operations. Keep external account, location, object and revision identities intact until normalization is complete. Namespace identifiers by connection and provider scope; an item ID may be unique only inside one account. Keep customer integration credentials inside the authorized cell or an explicitly scoped secret boundary.

Each `mock-provider-a` implements a declared subset of an external API with invented accounts and data. Document supported wire shapes, required credentials, pagination, timestamps, correction semantics and unsupported operations. Distinguish documented provider behavior from simulator conveniences. Do not silently accept unknown filters, reinterpret units or broaden a query when a feature is unsupported.

Useful fixtures include revisions that retain object identity, deleted catalog entries, missing mappings, partial refunds, expired credentials, throttling and intermittent failures. Keep financial arithmetic exact. A refund need not imply a physical return; a finished-item count need not be the application's stock ledger. Such decisions belong to domain normalization, not similarity between field names.

Use isolated signed scenario tokens or per-test fixtures instead of a public global reset. Bind snapshots and cursors to account, query, scenario and dataset revision so replay across cold starts is stable. Preserve the external contract's actual inclusive/exclusive time boundaries. A synthetic snapshot guarantee may exceed the real provider's guarantees; consumers still need overlapping incremental windows, stable deduplication and live-contract validation.

Mocks must fail closed outside allowed synthetic lifecycles, use separate consumer/control credentials and never silently proxy real accounts. Persistent generators are optional: give them dedicated synthetic storage, explicit source identity and bounded scheduling. Test wrong-account credentials, query changes during pagination, cursor tampering, expired sessions, delayed corrections and restart recovery. Producer smoke, application adapter integration and live provider qualification remain separate acceptance layers.

## Collection workers own coordination metadata

An optional `integration-worker` owns collection schedules, provider cursors, leases, destination configuration, bounded attempts and delivery receipts. The tenant application owns durable domain records. The shared worker database must not become a second customer-content store. Retain identifiers, counts, status and sanitized errors; any required sensitive payload spool needs an explicit tenant-scoped storage and retention design.

Trusted configuration binds a destination to lifecycle, tenant, allowed subresource, endpoint and credential reference. The receiving API independently resolves the credential to those same permissions. A batch can assert its expected target for mismatch detection, but cannot choose a database or grant itself tenant scope. Allowlist destinations and prohibit redirects or revalidate them against the same policy.

Treat execution as at-least-once. A bounded worker invocation follows this protocol:

1. Atomically claim due work with an expiring lease and unique ownership token.
2. Read a stable sequence/cursor and construct a batch with a stable idempotency key and content digest.
3. Deliver with a deadline. The receiver atomically stores domain changes and an idempotency receipt; conflicting bytes under the same key are rejected.
4. Validate the receipt and advance the cursor only while still owning the lease.
5. On ambiguity, retry the same sequence or query its receipt. Back off failures and pause persistent faults for review.

A synthetic worker can regenerate identical payloads. A live source may change between attempts: use a stable provider snapshot, a tenant-owned outbox or an explicit reconciliation protocol rather than assuming regeneration is identical. Prevent configuration edits from changing an unresolved batch. Define retention for receipts and deduplication records to cover the retry horizon.

Cron merely wakes a dispatcher. Durable database or workflow state owns progress; a function's memory does not. Bound claims, page sizes and per-invocation time, and use lease fencing so a late worker cannot overwrite a successor. A queue or durable workflow engine is an alternative to database leases if it preserves the same retry and receipt semantics.

Test concurrent claims, crash after receiver commit but before response, lease expiry, invalid receipt, wrong destination, credential revocation, poison batches and resumed delivery after configuration repair. Verify downstream records and the customer view; a sender's successful HTTP status alone is insufficient.

## Assurance, telemetry and release evidence

`assurance` owns an independent catalog of invariants, application adapters, procedures and evidence packaging. Enforcement stays in the owning application. Test real authorization and database behavior using exact clean revisions and isolated synthetic fixtures. Policy examples alone do not establish implementation behavior.

Record the complete required control population, including planned, unrun, failed and errored controls. Bind evidence to application and controls revisions, package and catalog digests, schema versions, execution time and limitations. A report's integrity check establishes consistent bytes; it does not establish factual authenticity, certification or release approval. Preserve older failures and issue new runs after fixes.

Hosted checks observe the exercised component's source and lifecycle before and after execution. Record deployment identity corroboration separately from a public version response. Changes to routing, credentials, migration state or security policy can invalidate applicability even when source is unchanged. Development execution cannot prove production behavior merely because both use the same code.

Shared telemetry should contain opaque correlation identifiers, operation status, duration, counts, retry category and source/configuration version. Exclude raw records, model prompts, documents, tokens, request bodies and database values. Restrict access and retention even for metadata. Sanitize exceptions before export; tracing middleware must not capture forbidden payloads implicitly. Detailed customer artifacts belong in the cell under its own access policy.

Before adopting a shared release, verify producer provenance, package integrity, consumer compatibility and the affected end-to-end journey. Include prompt/configuration selection and migration versions in the composition record. Exercise rollback within its actual compatibility limits. Release tooling may automate these checks, but a required CI service or uniform approval process is not part of this reference.
