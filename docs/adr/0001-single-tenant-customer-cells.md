# ADR 0001: Single-tenant customer cells

Status: Accepted

Each customer gets a dedicated SPA deployment, API deployment, and Neon project. This trades infrastructure fleet management for strong data/runtime isolation and a simpler application authorization model. No shared customer business-data database is part of the baseline architecture.
