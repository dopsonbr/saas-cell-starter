import { createClerkClient } from '@clerk/backend'
import { createMiddleware } from 'hono/factory'

export type CustomerAuth = {
  userId: string
  orgId: string
}

export type CustomerAuthVariables = {
  auth: CustomerAuth
}

export type CustomerAuthOptions = {
  secretKey: string
  publishableKey: string
  frontendUrl: string
  expectedOrgId: string
  jwtKey?: string
}

export function createCustomerAuthMiddleware(options: CustomerAuthOptions) {
  const clerk = createClerkClient({
    secretKey: options.secretKey,
    publishableKey: options.publishableKey,
  })

  return createMiddleware<{ Variables: CustomerAuthVariables }>(
    async (c, next) => {
      const state = await clerk.authenticateRequest(c.req.raw, {
        authorizedParties: [options.frontendUrl],
        acceptsToken: 'session_token',
        ...(options.jwtKey ? { jwtKey: options.jwtKey } : {}),
      })

      if (!state.isAuthenticated) return c.json({ error: 'Unauthorized' }, 401)

      const auth = state.toAuth()
      if (!auth.userId || !auth.orgId)
        return c.json({ error: 'Organization required' }, 403)
      if (auth.orgId !== options.expectedOrgId)
        return c.json({ error: 'Wrong customer organization' }, 403)

      c.set('auth', { userId: auth.userId, orgId: auth.orgId })
      await next()
    },
  )
}
