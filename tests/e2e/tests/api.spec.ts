import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  expect,
  type Page,
  request as requestFactory,
  test,
} from '@playwright/test'

const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3101'
const wrongAuth = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../playwright/.auth/wrong.json',
)

async function token(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() =>
    Boolean(
      (window as unknown as { Clerk?: { session?: unknown } }).Clerk?.session,
    ),
  )
  const value = await page.evaluate(
    async () =>
      (
        window as unknown as {
          Clerk?: { session?: { getToken: () => Promise<string | null> } }
        }
      ).Clerk?.session?.getToken() ?? null,
  )
  if (!value) throw new Error('Unable to obtain Clerk session token')
  return value
}

test('health, authentication, organization, and CORS boundaries', async ({
  browser,
}) => {
  const unauthenticated = await requestFactory.newContext()
  expect((await unauthenticated.get(`${apiUrl}/health`)).status()).toBe(200)
  expect((await unauthenticated.get(`${apiUrl}/v1/items`)).status()).toBe(401)
  const preflight = await unauthenticated.fetch(`${apiUrl}/v1/items`, {
    method: 'OPTIONS',
    headers: {
      Origin: process.env.E2E_WEB_URL ?? 'http://localhost:5177',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'authorization,x-run-id',
    },
  })
  expect(preflight.headers()['access-control-allow-headers']).toContain(
    'X-Run-Id',
  )
  const wrongContext = await browser.newContext({ storageState: wrongAuth })
  const wrongPage = await wrongContext.newPage()
  const wrongToken = await token(wrongPage)
  expect(
    (
      await unauthenticated.get(`${apiUrl}/v1/items`, {
        headers: { authorization: `Bearer ${wrongToken}` },
      })
    ).status(),
  ).toBe(403)
  await wrongContext.close()
  await unauthenticated.dispose()
})

test('content persists through the complete lifecycle', async ({
  page,
  request,
}) => {
  const sessionToken = await token(page)
  const headers = {
    authorization: `Bearer ${sessionToken}`,
    'content-type': 'application/json',
    'x-run-id': `e2e-${Date.now()}`,
  }
  expect(
    (
      await request.post(`${apiUrl}/v1/items`, {
        headers,
        data: { title: '', body: '' },
      })
    ).status(),
  ).toBe(400)
  const createdResponse = await request.post(`${apiUrl}/v1/items`, {
    headers,
    data: { title: 'Lifecycle item', body: 'Initial body', tags: ['e2e'] },
  })
  expect(createdResponse.status()).toBe(201)
  const created = await createdResponse.json()
  expect(created.status).toBe('draft')
  expect(
    (
      await request.get(`${apiUrl}/v1/items/${created.id}`, { headers })
    ).status(),
  ).toBe(200)
  const updated = await request.patch(`${apiUrl}/v1/items/${created.id}`, {
    headers,
    data: { body: 'Persisted after refresh' },
  })
  expect((await updated.json()).body).toBe('Persisted after refresh')
  const first = await (
    await request.post(`${apiUrl}/v1/items/${created.id}/share`, { headers })
  ).json()
  const second = await (
    await request.post(`${apiUrl}/v1/items/${created.id}/share`, { headers })
  ).json()
  expect(second.shareUrl).toBe(first.shareUrl)
  const publicUrl = first.shareUrl
    .replace(process.env.E2E_WEB_URL ?? 'http://localhost:5177', apiUrl)
    .replace('/share/', '/public/v1/items/')
  expect((await request.get(publicUrl)).status()).toBe(200)
  expect(
    (
      await request.delete(`${apiUrl}/v1/items/${created.id}/share`, {
        headers,
      })
    ).status(),
  ).toBe(200)
  expect((await request.get(publicUrl)).status()).toBe(404)
  expect(
    (
      await request.post(`${apiUrl}/v1/items/${created.id}/archive`, {
        headers,
      })
    ).status(),
  ).toBe(200)
  expect(
    (
      await request.patch(`${apiUrl}/v1/items/${created.id}`, {
        headers,
        data: { title: 'Nope' },
      })
    ).status(),
  ).toBe(404)
  expect(
    (
      await request.post(`${apiUrl}/v1/items/${created.id}/share`, { headers })
    ).status(),
  ).toBe(404)
})

test('mock collaborator streams deterministically and rejects malformed context', async ({
  page,
  request,
}) => {
  const sessionToken = await token(page)
  const headers = {
    authorization: `Bearer ${sessionToken}`,
    'content-type': 'application/json',
  }
  const requestBody = {
    messages: [
      {
        id: 'message-1',
        role: 'user',
        parts: [{ type: 'text', content: 'onboarding' }],
      },
    ],
    forwardedProps: {
      intent: 'brainstorm',
      currentDraft: { title: '', body: '', tags: [] },
    },
    threadId: 'thread-e2e',
    runId: 'run-e2e',
  }
  const response = await request.post(`${apiUrl}/v1/ai/collaborator`, {
    headers,
    data: requestBody,
  })
  expect(response.status()).toBe(200)
  const body = await response.text()
  expect(body).toContain('structured-output.complete')
  expect(body).toContain('Onboarding Playbook')
  const malformed = await request.post(`${apiUrl}/v1/ai/collaborator`, {
    headers,
    data: { ...requestBody, forwardedProps: { intent: 'unsupported' } },
  })
  expect(malformed.status()).toBe(400)
})

test('optional live provider completes a structured response', async ({
  page,
  request,
}) => {
  test.skip(
    process.env.E2E_LIVE_AI !== '1',
    'Set E2E_LIVE_AI=1 with an intentional live provider configuration',
  )
  const sessionToken = await token(page)
  const response = await request.post(`${apiUrl}/v1/ai/collaborator`, {
    headers: {
      authorization: `Bearer ${sessionToken}`,
      'content-type': 'application/json',
    },
    data: {
      messages: [
        {
          id: 'live-message',
          role: 'user',
          parts: [{ type: 'text', content: 'Give concise feedback.' }],
        },
      ],
      forwardedProps: {
        intent: 'critique',
        currentDraft: { title: 'Live check', body: 'A short draft.', tags: [] },
      },
      threadId: 'live-thread',
      runId: `live-${Date.now()}`,
    },
  })
  expect(response.status()).toBe(200)
  expect(await response.text()).toContain('structured-output.complete')
})
