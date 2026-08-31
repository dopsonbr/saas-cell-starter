# Agent Workflow

1. Read `AGENTS.md`.
2. Read relevant ADRs and `docs/product.md`.
3. For non-trivial work, create a plan from `docs/plans/_template.md`.
4. Implement vertically: contract -> API -> DB (if needed) -> API client -> UI.
5. Keep diffs scoped; do not "improve" unrelated architecture.
6. Run relevant local checks/E2E and attach verification evidence to the plan. Do not assume a CI pipeline exists.
7. Update docs/ADR only when the system contract changed.

Agents should prefer explicit, boring code over framework shortcuts that weaken deployable boundaries.
