import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const contentStatus = pgEnum('content_status', [
  'draft',
  'published',
  'archived',
])

export const contentItems = pgTable(
  'content_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    status: contentStatus('status').notNull().default('draft'),
    createdByUserId: text('created_by_user_id').notNull(),
    shareToken: uuid('share_token'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('content_items_share_token_unique').on(table.shareToken),
  ],
)
