import type { CustomerAuthVariables } from '@starter/auth/server'
import {
  collaboratorContextSchema,
  collaboratorResponseSchema,
  contentItemIdSchema,
  createContentItemInputSchema,
  shareTokenSchema,
  updateContentItemInputSchema,
} from '@starter/contracts'
import { createDb } from '@starter/db'
import { createLogger } from '@starter/telemetry'
import {
  chatParamsFromRequestBody,
  EventType,
  type StreamChunk,
  toServerSentEventsResponse,
} from '@tanstack/ai'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requireCustomerAuth } from './auth.js'
import {
  createCollaboratorStream,
  validateCollaboratorMessages,
} from './collaborator.js'
import { createContentService } from './content-service.js'
import { env } from './env.js'

const app = new Hono<{ Variables: CustomerAuthVariables }>()
const db = createDb(env.DATABASE_URL)
const items = createContentService(db, env.FRONTEND_URL)
const log = createLogger({ service: 'api', customer_slug: env.CUSTOMER_SLUG })

function credentialMode(
  requestOidcToken?: string,
): 'api-key' | 'oidc' | 'mock' | 'missing' {
  if (env.AI_PROVIDER === 'mock') return 'mock'
  if (env.AI_PROVIDER === 'openai')
    return env.OPENAI_API_KEY ? 'api-key' : 'missing'
  if (env.AI_GATEWAY_API_KEY) return 'api-key'
  return env.VERCEL_OIDC_TOKEN || requestOidcToken ? 'oidc' : 'missing'
}

function errorCategory(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('429') || message.includes('rate')) return 'rate_limited'
  if (message.includes('402') || message.includes('budget'))
    return 'budget_exceeded'
  if (message.includes('timeout') || message.includes('abort')) return 'timeout'
  if (
    message.includes('api key') ||
    message.includes('oidc') ||
    message.includes('credential')
  ) {
    return 'provider_auth_missing'
  }
  if (message.includes('schema') || message.includes('structured')) {
    return 'structured_output_error'
  }
  return 'provider_unavailable'
}

type ObservedChunk = { type: string; [key: string]: unknown }

async function* observeCollaboratorStream(
  stream: AsyncIterable<ObservedChunk>,
  requestOidcToken: string | undefined,
  timeout: ReturnType<typeof setTimeout>,
  metadata: { intent: string; runId: string; startedAt: number },
): AsyncGenerator<ObservedChunk> {
  try {
    for await (const chunk of stream) {
      if (chunk.type === 'RUN_ERROR') {
        const message =
          'message' in chunk && typeof chunk.message === 'string'
            ? chunk.message
            : ''
        const category = errorCategory(new Error(message))
        log.error('collaborator.stream_failed', {
          error_category: category,
          credential_mode: credentialMode(requestOidcToken),
          intent: metadata.intent,
          run_id: metadata.runId,
          duration_ms: Date.now() - metadata.startedAt,
        })
        yield { ...chunk, message: category }
        continue
      }
      if (
        chunk.type === 'CUSTOM' &&
        'name' in chunk &&
        chunk.name === 'structured-output.complete' &&
        'value' in chunk &&
        chunk.value &&
        typeof chunk.value === 'object' &&
        'object' in chunk.value
      ) {
        collaboratorResponseSchema.parse(chunk.value.object)
      }
      if (chunk.type === 'RUN_FINISHED') {
        log.info('collaborator.completed', {
          provider: env.AI_PROVIDER,
          credential_mode: credentialMode(requestOidcToken),
          intent: metadata.intent,
          run_id: metadata.runId,
          duration_ms: Date.now() - metadata.startedAt,
        })
      }
      yield chunk
    }
  } catch (error) {
    const category = errorCategory(error)
    log.error('collaborator.stream_failed', {
      error_category: category,
      credential_mode: credentialMode(requestOidcToken),
      intent: metadata.intent,
      run_id: metadata.runId,
      duration_ms: Date.now() - metadata.startedAt,
    })
    yield {
      type: EventType.RUN_ERROR,
      message: category,
      code: category,
      runId: metadata.runId,
      timestamp: Date.now(),
    }
  } finally {
    clearTimeout(timeout)
  }
}

app.use(
  '*',
  cors({
    origin: env.FRONTEND_URL,
    allowHeaders: ['Content-Type', 'Authorization', 'X-Run-Id'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'api',
    ...(env.VERCEL_GIT_COMMIT_SHA
      ? { revision: env.VERCEL_GIT_COMMIT_SHA }
      : {}),
  }),
)

app.get('/public/v1/items/:shareToken', async (c) => {
  const token = shareTokenSchema.safeParse(c.req.param('shareToken'))
  if (!token.success) return c.json({ error: 'Not found' }, 404)
  const item = await items.publicByToken(token.data)
  return item ? c.json(item) : c.json({ error: 'Not found' }, 404)
})

app.use('/v1/*', requireCustomerAuth)

app.get('/v1/dashboard', async (c) => c.json(await items.dashboard()))
app.get('/v1/items', async (c) => c.json(await items.list()))

app.post('/v1/ai/collaborator', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body || Buffer.byteLength(JSON.stringify(body), 'utf8') > 20_000) {
    return c.json(
      { error: 'Invalid collaborator request', category: 'invalid_request' },
      400,
    )
  }
  const params = await chatParamsFromRequestBody(body).catch(
    (error: unknown) => {
      log.warn('collaborator.rejected', {
        error_name: error instanceof Error ? error.name : 'UnknownError',
      })
      return null
    },
  )
  if (!params || !validateCollaboratorMessages(params.messages)) {
    return c.json(
      { error: 'Invalid collaborator request', category: 'invalid_request' },
      400,
    )
  }
  const context = collaboratorContextSchema.safeParse(params.forwardedProps)
  if (!context.success)
    return c.json(
      { error: 'Invalid collaborator context', category: 'invalid_request' },
      400,
    )

  const requestOidcToken = c.req.header('x-vercel-oidc-token')
  const gatewayToken =
    env.AI_GATEWAY_API_KEY ?? env.VERCEL_OIDC_TOKEN ?? requestOidcToken

  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    const abortController = new AbortController()
    timeout = setTimeout(
      () => abortController.abort('AI request timed out'),
      45_000,
    )
    c.req.raw.signal.addEventListener(
      'abort',
      () => abortController.abort('Client disconnected'),
      {
        once: true,
      },
    )
    const stream = createCollaboratorStream({
      provider: env.AI_PROVIDER,
      model: env.AI_MODEL,
      context: context.data,
      messages: params.messages,
      threadId: params.threadId,
      runId: params.runId,
      abortController,
      gatewayToken,
    })
    log.info('collaborator.started', {
      provider: env.AI_PROVIDER,
      credential_mode: credentialMode(requestOidcToken),
      intent: context.data.intent,
      run_id: params.runId,
    })
    const startedAt = Date.now()
    return toServerSentEventsResponse(
      observeCollaboratorStream(
        stream as unknown as AsyncIterable<ObservedChunk>,
        requestOidcToken,
        timeout,
        {
          intent: context.data.intent,
          runId: params.runId,
          startedAt,
        },
      ) as unknown as AsyncIterable<StreamChunk>,
      { abortController },
    )
  } catch (error) {
    if (timeout) clearTimeout(timeout)
    const category = errorCategory(error)
    log.error('collaborator.failed', {
      error_name: error instanceof Error ? error.name : 'UnknownError',
      error_category: category,
      credential_mode: credentialMode(requestOidcToken),
    })
    return c.json({ error: 'Collaborator unavailable', category }, 503)
  }
})

app.get('/v1/items/:itemId', async (c) => {
  const id = contentItemIdSchema.safeParse(c.req.param('itemId'))
  if (!id.success) return c.json({ error: 'Not found' }, 404)
  const item = await items.get(id.data)
  return item ? c.json(item) : c.json({ error: 'Not found' }, 404)
})

app.post('/v1/items', async (c) => {
  const parsed = createContentItemInputSchema.safeParse(
    await c.req.json().catch(() => null),
  )
  if (!parsed.success) {
    return c.json(
      { error: 'Invalid request', issues: parsed.error.flatten() },
      400,
    )
  }
  const created = await items.create(parsed.data, c.get('auth').userId)
  log.info('content_item.created', { item_id: created.id })
  return c.json(created, 201)
})

app.patch('/v1/items/:itemId', async (c) => {
  const id = contentItemIdSchema.safeParse(c.req.param('itemId'))
  const parsed = updateContentItemInputSchema.safeParse(
    await c.req.json().catch(() => null),
  )
  if (!id.success) return c.json({ error: 'Not found' }, 404)
  if (!parsed.success) {
    return c.json(
      { error: 'Invalid request', issues: parsed.error.flatten() },
      400,
    )
  }
  const updated = await items.update(id.data, parsed.data)
  return updated
    ? c.json(updated)
    : c.json({ error: 'Item not found or archived' }, 404)
})

app.post('/v1/items/:itemId/share', async (c) => {
  const id = contentItemIdSchema.safeParse(c.req.param('itemId'))
  if (!id.success) return c.json({ error: 'Not found' }, 404)
  const shared = await items.share(id.data)
  return shared
    ? c.json(shared)
    : c.json({ error: 'Item not found or archived' }, 404)
})

app.delete('/v1/items/:itemId/share', async (c) => {
  const id = contentItemIdSchema.safeParse(c.req.param('itemId'))
  if (!id.success) return c.json({ error: 'Not found' }, 404)
  const item = await items.revoke(id.data)
  return item
    ? c.json(item)
    : c.json({ error: 'Item not found or archived' }, 404)
})

app.post('/v1/items/:itemId/archive', async (c) => {
  const id = contentItemIdSchema.safeParse(c.req.param('itemId'))
  if (!id.success) return c.json({ error: 'Not found' }, 404)
  const item = await items.archive(id.data)
  return item ? c.json(item) : c.json({ error: 'Item not found' }, 404)
})

app.onError((error, c) => {
  const routeTemplate = c.req.path.startsWith('/public/v1/items/')
    ? '/public/v1/items/:shareToken'
    : c.req.path.replace(
        /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
        '/:id',
      )
  log.error('request.failed', {
    error_name: error.name,
    route_template: routeTemplate,
  })
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
