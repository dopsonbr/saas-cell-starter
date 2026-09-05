import { createCustomerAuthMiddleware } from '@starter/auth/server'
import { env } from './env.js'

export const requireCustomerAuth = createCustomerAuthMiddleware({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
  frontendUrl: env.FRONTEND_URL,
  expectedOrgId: env.EXPECTED_CLERK_ORG_ID,
  ...(env.CLERK_JWT_KEY ? { jwtKey: env.CLERK_JWT_KEY } : {}),
})
