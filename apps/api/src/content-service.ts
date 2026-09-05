import { randomUUID } from 'node:crypto'
import type {
  ContentItemDto,
  CreateContentItemInput,
  DashboardDto,
  PublicContentItemDto,
  ShareContentItemResult,
  UpdateContentItemInput,
} from '@starter/contracts'
// biome-ignore format: The package scope length changes during initialization.
import { and, type createDb, desc, eq, ne, schema, sql } from '@starter/db'

type Db = ReturnType<typeof createDb>
type ContentItemRow = typeof schema.contentItems.$inferSelect

function toDto(row: ContentItemRow, frontendUrl: string): ContentItemDto {
  const origin = frontendUrl.replace(/\/$/, '')
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tags: row.tags,
    status: row.status,
    createdByUserId: row.createdByUserId,
    shareUrl: row.shareToken ? `${origin}/share/${row.shareToken}` : null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function createContentService(db: Db, frontendUrl: string) {
  const origin = frontendUrl.replace(/\/$/, '')
  return {
    async dashboard(): Promise<DashboardDto> {
      const [totals, recent] = await Promise.all([
        db
          .select({
            total: sql<number>`count(*)::int`,
            draft: sql<number>`count(*) filter (where ${schema.contentItems.status} = 'draft')::int`,
            published: sql<number>`count(*) filter (where ${schema.contentItems.status} = 'published')::int`,
            archived: sql<number>`count(*) filter (where ${schema.contentItems.status} = 'archived')::int`,
          })
          .from(schema.contentItems),
        db
          .select()
          .from(schema.contentItems)
          .orderBy(desc(schema.contentItems.updatedAt))
          .limit(5),
      ])
      const total = totals[0]
      return {
        total: total?.total ?? 0,
        draft: total?.draft ?? 0,
        published: total?.published ?? 0,
        archived: total?.archived ?? 0,
        recent: recent.map((row) => toDto(row, frontendUrl)),
      }
    },

    async list(): Promise<ContentItemDto[]> {
      const rows = await db
        .select()
        .from(schema.contentItems)
        .orderBy(desc(schema.contentItems.updatedAt))
      return rows.map((row) => toDto(row, frontendUrl))
    },

    async get(id: string): Promise<ContentItemDto | null> {
      const [row] = await db
        .select()
        .from(schema.contentItems)
        .where(eq(schema.contentItems.id, id))
        .limit(1)
      return row ? toDto(row, frontendUrl) : null
    },

    async create(
      input: CreateContentItemInput,
      userId: string,
    ): Promise<ContentItemDto> {
      const [row] = await db
        .insert(schema.contentItems)
        .values({ ...input, createdByUserId: userId })
        .returning()
      if (!row) throw new Error('Insert failed')
      return toDto(row, frontendUrl)
    },

    async update(
      id: string,
      input: UpdateContentItemInput,
    ): Promise<ContentItemDto | null> {
      const [row] = await db
        .update(schema.contentItems)
        .set({ ...input, updatedAt: new Date() })
        .where(
          and(
            eq(schema.contentItems.id, id),
            ne(schema.contentItems.status, 'archived'),
          ),
        )
        .returning()
      return row ? toDto(row, frontendUrl) : null
    },

    async share(id: string): Promise<ShareContentItemResult | null> {
      const now = new Date()
      const candidateToken = randomUUID()
      const [row] = await db
        .update(schema.contentItems)
        .set({
          status: 'published',
          shareToken: sql`coalesce(${schema.contentItems.shareToken}, ${candidateToken}::uuid)`,
          publishedAt: sql`coalesce(${schema.contentItems.publishedAt}, ${now})`,
          updatedAt: now,
        })
        .where(
          and(
            eq(schema.contentItems.id, id),
            ne(schema.contentItems.status, 'archived'),
          ),
        )
        .returning()
      if (!row?.shareToken || !row.publishedAt) return null
      const item = toDto(row, frontendUrl)
      return {
        item,
        shareUrl: `${origin}/share/${row.shareToken}`,
        publishedAt: row.publishedAt.toISOString(),
      }
    },

    async revoke(id: string): Promise<ContentItemDto | null> {
      const [row] = await db
        .update(schema.contentItems)
        .set({
          status: 'draft',
          shareToken: null,
          publishedAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.contentItems.id, id),
            ne(schema.contentItems.status, 'archived'),
          ),
        )
        .returning()
      return row ? toDto(row, frontendUrl) : null
    },

    async archive(id: string): Promise<ContentItemDto | null> {
      const [row] = await db
        .update(schema.contentItems)
        .set({
          status: 'archived',
          shareToken: null,
          publishedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.contentItems.id, id))
        .returning()
      return row ? toDto(row, frontendUrl) : null
    },

    async publicByToken(token: string): Promise<PublicContentItemDto | null> {
      const [row] = await db
        .select()
        .from(schema.contentItems)
        .where(
          and(
            eq(schema.contentItems.shareToken, token),
            eq(schema.contentItems.status, 'published'),
          ),
        )
        .limit(1)
      if (!row?.publishedAt) return null
      return {
        title: row.title,
        body: row.body,
        tags: row.tags,
        publishedAt: row.publishedAt.toISOString(),
      }
    },
  }
}
