# Plan: Reusable polyrepo SaaS architecture

## Outcome

A detailed provider-neutral architecture guide on a separate branch, suitable for adapting cell-based SaaS to another domain. Generalize source-inspected Ravelo patterns while preserving the executable starter's smaller baseline.

## Constraints

- Documentation scope: no runtime extraction, infrastructure provisioning or deployment.
- Preserve tenant isolation, HTTP boundaries and existing manual provisioning defaults.
- Distinguish implemented behavior from candidate MCP work and proposed architecture.
- Public documents contain no customer data, private resource identities, credentials or machine paths.
- Names, providers, CI, issue conventions and repository count are choices for adopters.
- Keep this deliverable and its verification record self-contained in the repository; no external ticket or documentation service is required.

## API changes

None. Proposed interfaces and flows are reference designs only.

## Database changes

None. No migrations or data operations.

## UI states

No application UI changes. Documentation covers empty/loading/error/success, denied access, stale policy, pending approval and retry/reconciliation states as acceptance requirements for future implementations.

## Implementation steps

1. Inspect starter instructions, source and Git state; inspect current reference repositories and candidate boundaries.
2. Create an isolated branch from current remote main.
3. Write overview, repository map, tenant/control/runtime, shared-system, AI/MCP and adoption guides plus a documentation ADR.
4. Review contract consistency, domain neutrality, implementation claims and navigation; run applicable repository checks.
5. Commit and push the documentation branch with its complete delivery and verification record in this repository.

## Acceptance criteria

- [x] Linked guides cover every requested architectural area and include diagrams.
- [x] Domain examples and phased adoption explain how to reuse the design.
- [x] Current starter functionality and proposed expansion are explicit.
- [x] Markdown links, formatting and repository validation pass or limitations are recorded.
- [x] Documentation branch is committed/pushed and the remote revision is verified.

## Verification evidence

Base revision: `0551a3af6f68d830155319e153fdd3503c68b0b3`. Source inspection and validation date: September 28, 2026.

- Node 24.19.0 and pnpm 10.25.0; `pnpm install --frozen-lockfile` passed without dependency/lockfile changes.
- `pnpm check` passed: 15 tests across five files, all workspace typechecks, code lint/format checks, and package/application builds.
- Relative-link/code-fence inspection passed across ten changed/new Markdown documents: 30 local links resolve and five Mermaid fences are balanced. Diagram semantics were reviewed; browser-rendered diagram acceptance was not run.
- Provider/private-identifier scan of the new architecture, ADR and plan found no implementation vendor names, customer/resource identifiers, credentials or absolute machine paths.
- Independent review of all guides, ADR and plan found no actionable issues. `git diff --check` passed.
- Browser/API E2E and hosted checks were not run: this change modifies documentation only and does not alter customer-facing behavior.

The branch contains six architecture guides, ADR 0008, this delivery plan and entry links from the existing README/architecture guide. Runtime expansion, deployment and hosted acceptance remain outside this task.

## Repository delivery

The complete deliverable is available on [codex/polyrepo-architecture](https://github.com/dopsonbr/saas-cell-starter/tree/codex/polyrepo-architecture). The branch remains unmerged; no runtime files, dependency manifests or infrastructure were changed.

Start with the [architecture overview](../architecture/README.md). All six guides, diagrams, the adoption examples, ADR and verification evidence are ordinary repository files. They require no external project tracker, private documentation mirror or account to understand. Existing implementation runbooks remain authoritative for their own systems and were not superseded.
