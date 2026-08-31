import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const records = pgTable('records', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  status: text('status', { enum: ['active', 'completed'] }).notNull().default('active'),
  value: integer('value').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
