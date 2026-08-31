# ADR 0006: Platform-injected secrets first

Status: Accepted

## Decision

The starter does not require a dedicated secrets-management product. Applications receive configuration and secrets through environment variables. Vercel project environment variables are the initial deployment store, with confidential Preview/Production values marked Sensitive.

Application code must not call a secrets manager directly. This preserves portability and keeps local, Vercel, and future runtimes on the same environment-variable contract.

## Why

At the initial scale, introducing a second control system for secrets adds provisioning, identity, failure modes, and operational work without changing the runtime security boundary. Vercel already provides encrypted environment variables and write-only Sensitive values for deployed applications.

## Upgrade trigger

Adopt a dedicated source of truth such as Infisical or Doppler when centralized rotation, richer audit/versioning, multi-runtime synchronization, or the number of customer deployments makes Vercel-project-level management operationally expensive.
