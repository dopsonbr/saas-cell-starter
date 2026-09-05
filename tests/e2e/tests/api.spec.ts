import { expect, test, type Page } from '@playwright/test'

const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3001'

async function getFreshSessionToken(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() =>
    Boolean(
      (window as unknown as { Clerk?: { session?: unknown } }).Clerk?.session,
    ),
  )
  const token = await page.evaluate(async () => {
    const clerkClient = (
      window as unknown as {
        Clerk?: { session?: { getToken: () => Promise<string | null> } }
      }
    ).Clerk
    return clerkClient?.session?.getToken() ?? null
  })
  if (!token)
    throw new Error('Unable to obtain Clerk session token for API E2E')
  return token
}

test('health endpoint is public', async ({ request }) => {
  const response = await request.get(`${apiUrl}/health`)
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body).toMatchObject({ ok: true, service: 'api' })
})

test('protected endpoint rejects an unauthenticated request', async ({
  request,
}) => {
  const response = await request.get(`${apiUrl}/v1/dashboard`)
  expect(response.status()).toBe(401)
})

test('authenticated dashboard request reaches the dedicated database', async ({
  page,
  request,
}) => {
  const token = await getFreshSessionToken(page)
  const response = await request.get(`${apiUrl}/v1/dashboard`, {
    headers: { authorization: `Bearer ${token}` },
  })
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body).toEqual(
    expect.objectContaining({
      total: expect.any(Number),
      active: expect.any(Number),
      completed: expect.any(Number),
      totalValue: expect.any(Number),
      recent: expect.any(Array),
    }),
  )
})

test('authenticated invalid writes are rejected by contract validation', async ({
  page,
  request,
}) => {
  const token = await getFreshSessionToken(page)
  const response = await request.post(`${apiUrl}/v1/records`, {
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    data: { title: '' },
  })
  expect(response.status()).toBe(400)
})
