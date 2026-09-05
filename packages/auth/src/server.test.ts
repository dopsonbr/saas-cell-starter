import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authenticateRequest = vi.hoisted(() => vi.fn())

vi.mock('@clerk/backend', () => ({
  createClerkClient: () => ({ authenticateRequest }),
}))

const { createCustomerAuthMiddleware } = await import('./server.js')

function authState(userId?: string, orgId?: string) {
  return {
    isAuthenticated: Boolean(userId),
    toAuth: () => ({ userId, orgId }),
  }
}

function createTestApp() {
  const app = new Hono()
  app.use(
    '*',
    createCustomerAuthMiddleware({
      secretKey: 'secret',
      publishableKey: 'publishable',
      frontendUrl: 'https://cell.example.com',
      expectedOrgId: 'org_expected',
    }),
  )
  app.get('/protected', (context) => context.json({ ok: true }))
  return app
}

describe('customer organization authorization', () => {
  beforeEach(() => authenticateRequest.mockReset())

  it.each([
    ['an unauthenticated request', authState(), 401],
    ['a session without an active organization', authState('user_1'), 403],
    ['a member of another organization', authState('user_1', 'org_wrong'), 403],
  ])('rejects %s', async (_label, state, expectedStatus) => {
    authenticateRequest.mockResolvedValue(state)
    expect((await createTestApp().request('/protected')).status).toBe(
      expectedStatus,
    )
  })

  it('allows every authenticated member of the expected organization', async () => {
    authenticateRequest.mockResolvedValue(authState('user_1', 'org_expected'))
    expect((await createTestApp().request('/protected')).status).toBe(200)
  })
})
