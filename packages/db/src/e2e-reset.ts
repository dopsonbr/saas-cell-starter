import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'
import { contentItems } from './schema.js'

const databaseUrl = process.env.E2E_DATABASE_URL
if (!databaseUrl) throw new Error('E2E_DATABASE_URL is required')
if (process.env.E2E_ALLOW_RESET !== '1') {
  throw new Error('Refusing to reset E2E data without E2E_ALLOW_RESET=1')
}

const db = drizzle(neon(databaseUrl))
await migrate(db, { migrationsFolder: './drizzle' })
await db.delete(contentItems)
console.log('E2E database migrated and content_items reset')
