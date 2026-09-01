# New Product Checklist

## Initialize

- [ ] Create a repo from the GitHub template
- [ ] Run `pnpm init:project -- --name "Product Name" --slug product-slug --ai-provider mock`
- [ ] Replace starter sample domain (`content_items`) with the first real product concept when known
- [ ] Run `pnpm run doctor` and `pnpm verify:template`
- [ ] Update marketing headline/value proposition
- [ ] Create `docs/product.md` from your product brief

## Identity

- [ ] Create Clerk application
- [ ] Enable Organizations
- [ ] Create synthetic/local organization
- [ ] Configure SPA publishable key
- [ ] Configure API secret/JWT key
- [ ] Set `EXPECTED_CLERK_ORG_ID`

## Data

- [ ] Create first customer/dev Neon project
- [ ] Set `DATABASE_URL` only on the API
- [ ] Generate and commit migrations
- [ ] Run migrations

## Vercel

- [ ] Create shared marketing project (`apps/marketing`)
- [ ] Create first customer web project (`apps/web`)
- [ ] Create first customer API project (`apps/api`)
- [ ] Configure production domains
- [ ] Configure exact API CORS frontend origin

## Secrets

- [ ] Classify env vars using `docs/secrets.md`
- [ ] Mark confidential Vercel Preview/Production values Sensitive
- [ ] Create separate development/E2E credentials; do not reuse production secrets

## E2E test cell

- [ ] Create independent expected-org and wrong-org Clerk test users
- [ ] Create a dedicated Neon E2E database and run migrations
- [ ] Populate `tests/e2e/.env.e2e.local`
- [ ] `pnpm e2e:install`
- [ ] `pnpm e2e`

## Quality

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] `pnpm test`
- [ ] sign-in works
- [ ] wrong Clerk org receives `403`
- [ ] SPA hard-refresh works on nested route
- [ ] API request reaches Neon
- [ ] logs contain cell metadata but no customer payloads
