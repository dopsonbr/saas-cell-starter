# Observability and Product Analytics

## Shared operational observability

Customer APIs are separate Vercel projects, but their operational signals should converge on a shared team-level destination. Start with structured JSON Runtime Logs and a shared Vercel log drain. Add OTLP export when traces/metrics need to be queried outside Vercel.

Every signal should include a non-sensitive `customer_slug` or opaque cell ID plus `service` and deployment/version metadata. Never emit raw business payloads.

## Shared product analytics

`packages/analytics` is deliberately an adapter boundary instead of hard-wiring a vendor into the starter. Pick one shared product-analytics project (for example PostHog or Amplitude) when instantiating a product and provide the adapter from `apps/web`.

Required event context:

- opaque customer/cell identifier
- event name
- feature/view identifier
- application version when useful

Do not send business records merely because they are convenient event properties.
