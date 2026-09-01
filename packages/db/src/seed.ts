import 'dotenv/config'
import { createDb } from './index.js'
import { contentItems } from './schema.js'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
const db = createDb(process.env.DATABASE_URL)
await db.insert(contentItems).values([
  {
    title: 'Welcome to your content library',
    body: 'Replace this neutral sample with the first real workflow for your product.',
    tags: ['starter'],
    status: 'draft',
    createdByUserId: 'starter-seed',
  },
])
console.log('Seed complete')
