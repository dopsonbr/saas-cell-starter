# ADR 0008: Document an optional polyrepo platform expansion

Status: Accepted for documentation; runtime adoption is deferred.

## Context

The starter provides one product codebase and physically isolated customer cells. Experience operating a larger product shows reusable boundaries for shared UI, evaluation and prompt releases, staff provisioning, tenant policy, provider simulators and assistant access. A reusable guide needs to explain those boundaries without implying that every new product must start with all of them.

## Decision

Publish a [provider-neutral reference architecture](../architecture/README.md) describing an optional polyrepo platform. Keep source ownership, runtime isolation, business authorization and lifecycle isolation separate. Product services retain domain enforcement and customer data; control services operate lifecycle metadata and privileged provisioning. Version shared packages and runtime contracts explicitly.

This decision authorizes the documentation model only. [ADR 0005](0005-no-control-plane-initially.md) continues to describe the executable starter: manual provisioning, no included control plane and no required CI pipeline. Existing auth, UI package ownership, database isolation and secret injection rules continue to apply until a future implementation ADR names an adopted change, migration and acceptance scope.

## Alternatives

- **Keep only the minimal cell guide:** simplest onboarding, but loses reusable fleet and cross-repository lessons.
- **Immediately extract all repositories and services:** creates infrastructure, compatibility and operating costs before there is a product requirement.
- **Require one repository per tenant or function:** confuses source ownership with isolation and encourages source/schema drift.

## Consequences

Readers can adopt the reference incrementally and use different infrastructure providers, frameworks, repository names and delivery processes. Each adopted component needs explicit authority, contracts, failure semantics and verification. The documentation must continue distinguishing shipped starter functionality, inspected reference patterns and proposed extensions. No runtime feature or production acceptance follows from publishing the guide.
