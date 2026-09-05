import 'dotenv/config'
import { createDb } from './index'
import { records } from './schema'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
const db = createDb(process.env.DATABASE_URL)
await db.insert(records).values([
  { title: 'Connect the first real data source', status: 'active', value: 32 },
  {
    title: 'Replace starter records with domain entities',
    status: 'active',
    value: 68,
  },
  {
    title: 'Verify isolated customer deployment',
    status: 'completed',
    value: 100,
  },
])
console.log('Seed complete')
