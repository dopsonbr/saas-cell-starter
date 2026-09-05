# Plan: Replace Biome with Oxlint and Oxfmt

## Outcome

The repository uses Oxlint for JavaScript and TypeScript linting and Oxfmt for
formatting. `pnpm lint` remains the consolidated non-writing quality gate, with
dedicated commands available for lint fixes and formatting.

## Constraints

- Preserve the React SPA, HTTP API, and dedicated database boundaries.
- Keep `pnpm typecheck` as the authoritative TypeScript compiler gate.
- Pin TypeScript consistently to the stable version the starter targets so a
  fresh install does not silently opt into a new compiler major.
- Preserve the existing formatting conventions: two-space indentation, single
  quotes, no semicolons, and an 80-column print width.
- Do not format generated, dependency, build, deployment, coverage, or
  Playwright artifact directories.
- Do not add a required CI pipeline or change application behavior.

## API changes

- None.

## Database changes

- None.

## UI states

- No UI behavior or state changes.

## Implementation steps

1. Replace the root Biome dependency and command with Oxlint and Oxfmt.
2. Add root Oxlint and Oxfmt configuration files that preserve the current
   conventions and generated-file exclusions.
3. Keep `pnpm lint` as the aggregate non-writing gate and add dedicated
   `lint:code`, `lint:fix`, `format`, and `format:check` scripts.
4. Resolve genuine Oxlint findings and apply the one-time Oxfmt migration.
5. Document the new local commands and remove all executable Biome references.
6. Repair any clean-install dependency gaps exposed by the required validation
   without changing application behavior.
7. Run the full local validation suite.

## Acceptance criteria

- [x] `@biomejs/biome` and `biome.json` are removed.
- [x] Oxlint and Oxfmt are installed and configured at the repository root.
- [x] `pnpm lint` runs Oxlint plus a non-writing Oxfmt check.
- [x] Generated and secret-bearing artifacts remain excluded.
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm check` pass.
- [x] No application behavior or architecture changes are introduced.

## Verification evidence

- `pnpm install` — passed; generated `pnpm-lock.yaml` and installed Oxlint
  1.81.0 plus Oxfmt 0.66.0.
- `pnpm format` — passed; formatted 96 matched files.
- `pnpm check` — passed, including workspace type-checking, Oxlint, Oxfmt's
  non-writing check, package builds, and application builds.
- Stale executable Biome reference search — passed with no matches outside this
  migration record.
- `git diff --check` — passed.
