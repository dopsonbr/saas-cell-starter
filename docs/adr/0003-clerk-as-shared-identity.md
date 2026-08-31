# ADR 0003: Clerk as shared identity

Status: Accepted

One Clerk application can serve the product. Each customer is represented by a Clerk Organization. Every customer API deployment is configured with one expected organization ID and rejects authenticated sessions from other organizations.
