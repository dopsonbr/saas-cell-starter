import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { desc, eq, sql } from 'drizzle-orm'
import { createRecordInputSchema } from '@starter/contracts'
import { createDb, schema } from '@starter/db'
import { createLogger } from '@starter/telemetry'
import { env } from './env'
import { requireCustomerAuth } from './auth'

const app = new Hono()
const db = createDb(env.DATABASE_URL)
const log = createLogger({ service: 'api', customer_slug: env.CUSTOMER_SLUG })

app.use('*', cors({
  origin: env.FRONTEND_URL,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}))

app.get('/health', (c) => c.json({ ok: true, service: 'api' }))
app.use('/v1/*', requireCustomerAuth)

app.get('/v1/dashboard', async (c) => {
  const started = Date.now()
  const [totals] = await db.select({
    total: sql<number>`count(*)::int`,
    active: sql<number>`count(*) filter (where ${schema.records.status} = 'active')::int`,
    completed: sql<number>`count(*) filter (where ${schema.records.status} = 'completed')::int`,
    totalValue: sql<number>`coalesce(sum(${schema.records.value}), 0)::int`,
  }).from(schema.records)

  const recentRows = await db.select().from(schema.records).orderBy(desc(schema.records.createdAt)).limit(5)
  log.info('dashboard.loaded', { duration_ms: Date.now() - started, row_count: recentRows.length })

  return c.json({
    total: totals?.total ?? 0,
    active: totals?.active ?? 0,
    completed: totals?.completed ?? 0,
    totalValue: totals?.totalValue ?? 0,
    recent: recentRows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  })
})

app.get('/v1/records', async (c) => {
  const rows = await db.select().from(schema.records).orderBy(desc(schema.records.createdAt))
  return c.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })))
})

app.post('/v1/records', async (c) => {
  const parsed = createRecordInputSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'Invalid request', issues: parsed.error.flatten() }, 400)

  const [created] = await db.insert(schema.records).values(parsed.data).returning()
  if (!created) return c.json({ error: 'Insert failed' }, 500)
  log.info('record.created', { record_id: created.id })
  return c.json({ ...created, createdAt: created.createdAt.toISOString() }, 201)
})

app.onError((error, c) => {
  log.error('request.failed', { error_name: error.name, route: c.req.path })
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
