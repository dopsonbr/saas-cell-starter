# Adopting the architecture in another domain

The [reference architecture](README.md) is a set of reusable boundaries. Start with the product's own users, records, approval rules and isolation requirements; then select the platform components that make those requirements easier to operate.

## What is implemented here

This matrix compares the starter at base revision `0551a3af6f68d830155319e153fdd3503c68b0b3` with the documented expansion. A source-inspected pattern is not a claim of current hosted acceptance. The reference was prepared September 28, 2026 from current application/control sources, supporting repositories and separately identified candidate work.

| Area                  | Executable starter baseline                                                                        | Expansion described in this guide                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Source structure      | One workspace with customer web/API, marketing and shared packages                                 | Independently released capability repositories, each potentially containing a workspace                |
| Tenant isolation      | One expected organization and dedicated API/database per customer                                  | Durable tenant placement, database/runtime binding, private object/job boundaries and fleet operations |
| Web/routing           | Separate customer web deployments calling their dedicated APIs                                     | Optional shared web and database-free routing gateway                                                  |
| Business topology     | Organization-wide sample content; creator ID is audit metadata                                     | Explicit business-line/site/workspace relationships and scoped permissions                             |
| Control plane         | Manual provisioning and release guidance                                                           | Staff UI/control DB, signed policy, durable provisioning, reconciliation and publication               |
| Design system         | Local `packages/ui` consumed by apps                                                               | Extracted versioned library with producer/consumer release verification                                |
| AI                    | Validated structured suggestions, deterministic mock default, unsaved draft updates, explicit Save | Versioned prompt releases, cost-bounded evals and durable operation proposals                          |
| MCP                   | No server or delegated assistant connection                                                        | Protocol adapter, scoped grants, exact-action approval and receipt reconciliation                      |
| External integrations | No generalized connector or provider-simulator fleet                                               | Tenant-owned adapters plus bounded independent synthetic provider services                             |
| Background work       | No durable provisioning/collection platform                                                        | Scoped queues, leased workers, authenticated schedules and delivery receipts                           |
| Assurance             | Unit/type/lint/build checks plus configured API/browser E2E                                        | Independent control catalog and complete evidence tied to release composition                          |
| Delivery              | Local/pre-release checks; manual cell setup                                                        | Optional fleet orchestration and automated compatible rollout                                          |

The larger reference implementation supplied concrete patterns for cells, gateway separation, control provisioning, shared UI artifacts, evals, mocks and specialized collection. Delegated MCP work was inspected as a separate candidate; native assistant approval and hosted prompt promotion are extension/qualification work. This guide deliberately describes their intended contracts rather than claiming they shipped in the starter or are accepted on every assistant host.

## Map business concepts before renaming folders

| Architectural concept | Field-service product          | Learning platform                 | Document collaboration product       |
| --------------------- | ------------------------------ | --------------------------------- | ------------------------------------ |
| Tenant/organization   | Service company                | Training organization             | Customer company                     |
| Business line         | Maintenance specialty          | Program                           | Practice or department               |
| Site/context          | Service region or depot        | Campus or delivery channel        | Office or client engagement          |
| Operating workspace   | Specialty at an allowed region | Program at an allowed campus      | Department assigned to an engagement |
| Business records      | Work orders, materials, visits | Courses, enrollment, assessments  | Documents, review tasks, decisions   |
| External adapter      | Scheduling or parts system     | Roster or learning-content system | Document or records system           |
| Reviewable operation  | Adjust job requirements        | Propose a program change          | Propose a document update            |
| Synthetic provider    | Fake appointments and stock    | Fake rosters and enrollments      | Fake documents and revision events   |

These examples describe ownership and topology, not a required relational schema. Use a simple tenant/workspace model when that fits. A cross-product of all business lines and sites is rarely the right default; create the permitted pairs explicitly. Do not duplicate financial or inventory semantics merely because a field has the same name in two industries.

### Worked adaptation: field-service operations

Suppose one customer has two service lines, Installation and Maintenance, and two depots, North and South. Create exactly three workspaces: Installation/North, Maintenance/North and Maintenance/South. Installation/South does not exist until the customer explicitly adds it. An operator can belong to the customer yet have permission only for Maintenance/North.

The control plane provisions one customer cell and its resource bindings. It can enforce a purchased workspace limit, but the tenant application owns the three workspace records, their assignments and the version used for concurrent additions. The customer's scheduling connection maps external account and site identifiers to those workspaces; those external identifiers do not replace the application's identities.

A tenant worker imports synthetic appointments through the scheduling adapter. The receiver stores records and advances its import cursor only after a durable receipt. A browser or assistant asks for unassigned work within Maintenance/North. The application validates scope, returns bounded records and creates an immutable assignment proposal. The user reviews the change; apply rechecks permission and record versions, commits the assignment and receipt atomically, and returns the same outcome after a lost-response retry.

If a dispatcher moves the job before approval, apply returns a conflict and asks for a new preview. If the organization disables assistant access, subsequent assistant calls deny while normal authorized browser operations follow the separate core policy. If the scheduler provider times out, the same import identity is reconciled rather than creating another appointment. Each behavior belongs to an explicit authority boundary.

## Adopt in stages

| Stage                    | Implement                                                                                                           | Evidence needed to leave the stage                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Domain foundation     | Replace sample content with real domain schema/services; keep browser/API boundary; deploy isolated synthetic cells | Two tenants reject cross-tenant access; current membership, validation and persistence work through HTTP                                          |
| 2. Domain scoping        | Introduce only the necessary business topology, grants and immutable job/document scope                             | Explicit valid pairs, nonexistent pairs, workspace switching and queued work preserve original scope                                              |
| 3. Shared packages       | Extract UI and, when useful, prompts/evals; pin artifacts and publish contracts                                     | Clean producer release; exact-byte install; paired consumer checks; rollback to prior package                                                     |
| 4. Fleet administration  | Introduce staff authority, control DB, durable provisioning and policy distribution under an implementation ADR     | Empty-tenant bootstrap, interrupted provider effects, resume, policy replay, expired automation, route publication race and old-cell preservation |
| 5. Integrations and jobs | Add tenant-owned adapters and only the independent collectors/mocks actually needed                                 | Pagination/corrections, duplicate delivery, response loss, stale lease, receiver persistence and customer UI                                      |
| 6. Assistant access      | Add read tools first, then proposals and qualified user approval                                                    | Real client consent/revoke; wrong-resource/scope denials; preview binding; idempotency; stale approval and supported undo                         |
| 7. Operated fleet        | Add compatible rollout, recovery rehearsals, cost budgets and independent evidence                                  | Exact source/deployment identity, migration compatibility, restored synthetic cell, telemetry privacy and stated recovery objectives              |

Stages can overlap where dependencies allow. Do not extract a repository solely to complete this table. Adopt each runtime component through a product-specific decision that names the owner, cost, failure behavior and migration.

## Provider selection without hidden coupling

Choose providers against required semantics rather than their marketing category. Identity must support verified issuer/audience and current membership; persistence must support needed transactions and isolation; objects need private tenant-bound access; queues need documented delivery/retry behavior; compute needs suitable duration/concurrency/network limits; model access needs budgets and validated outputs. Provisioning APIs need stable resource lookup so timeout recovery can reconcile effects.

Document differences that affect correctness: timestamp precision, rate limits, eventual consistency, transaction scope, token revocation, queue redelivery, webhook signing and deployment immutability. Keep secrets in the platform injection boundary. A replacement provider is accepted only when the adapter and real integration tests meet the same contract. Avoid creating a universal provider abstraction before a second implementation or a known migration requires it.

## Acceptance and delivery record

For an implementation, record the selected repositories and revisions, contract/artifact digests, schema versions, lifecycle, cell bindings, configured limits and checks actually executed. A useful negative-case matrix includes wrong tenant/issuer/environment, deleted membership, denied workspace, expired policy, forged forwarding headers, direct tenant-origin access, private artifact lookup, mixed-lifecycle queues and untrusted document instructions.

Exercise operations as well as happy paths: crash between steps, expire a lease, lose a successful response, race an application release with provisioning, rotate keys with overlap, restore to isolated resources and reconcile unknown external effects. Test the same explicit topology the product claims to support.

State evidence levels separately: source review, deterministic local tests, synthetic provider contract checks, hosted synthetic integration, real provider acceptance and production release. Retain failures and unimplemented controls. Use measured workload and fleet limits before choosing pagination, discovery fanout, connection pooling, worker concurrency and rollout batch sizes; this pattern alone proves no tenant-count or throughput claim.

This branch delivers architecture documentation. No runtime expansion, hosted deployment, live-provider test, customer migration or release acceptance is implied.
