import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

export { and, desc, eq, ne, sql } from 'drizzle-orm'

import * as schema from './schema.js'

export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl)
  return drizzle(sql, { schema })
}

export { schema }
