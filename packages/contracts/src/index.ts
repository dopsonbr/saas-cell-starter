import { z } from 'zod'

export const contentStatusSchema = z.enum(['draft', 'published', 'archived'])
export const contentItemIdSchema = z.string().uuid()
export const shareTokenSchema = z.string().uuid()

export const tagsSchema = z
  .array(z.string().trim().min(1).max(24))
  .max(8)
  .refine(
    (tags) =>
      new Set(tags.map((tag) => tag.toLowerCase())).size === tags.length,
    { message: 'Tags must be unique regardless of case' },
  )

const titleSchema = z.string().trim().min(1).max(120)
const bodySchema = z.string().trim().min(1).max(5_000)

export const contentDraftSchema = z.object({
  title: z.string().trim().max(120),
  body: z.string().trim().max(5_000),
  tags: tagsSchema,
})

export const contentSuggestionSchema = z
  .object({
    title: titleSchema.optional(),
    body: bodySchema.optional(),
    tags: tagsSchema.optional(),
  })
  .refine((suggestion) => Object.keys(suggestion).length > 0, {
    message: 'A suggestion must change at least one field',
  })

export const collaboratorIntentSchema = z.enum([
  'brainstorm',
  'improve-title',
  'tighten-body',
  'alternate-angle',
  'suggest-tags',
  'critique',
  'freeform',
])

export const collaboratorContextSchema = z.object({
  intent: collaboratorIntentSchema,
  currentDraft: contentDraftSchema,
})

export const collaboratorResponseSchema = z.object({
  reply: z.string().trim().min(1).max(800),
  suggestion: contentSuggestionSchema.nullable(),
})

export const contentItemSchema = z.object({
  id: contentItemIdSchema,
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  status: contentStatusSchema,
  createdByUserId: z.string(),
  shareUrl: z.string().url().nullable(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const createContentItemInputSchema = z.object({
  title: titleSchema,
  body: bodySchema,
  tags: tagsSchema.default([]),
})

export const updateContentItemInputSchema = z
  .object({
    title: titleSchema.optional(),
    body: bodySchema.optional(),
    tags: tagsSchema.optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field is required',
  })

export const dashboardSchema = z.object({
  total: z.number().int(),
  draft: z.number().int(),
  published: z.number().int(),
  archived: z.number().int(),
  recent: z.array(contentItemSchema),
})

export const shareContentItemResultSchema = z.object({
  item: contentItemSchema,
  shareUrl: z.string().url(),
  publishedAt: z.string().datetime(),
})

export const publicContentItemSchema = z.object({
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  publishedAt: z.string().datetime(),
})

export type ContentStatus = z.infer<typeof contentStatusSchema>
export type ContentItemDto = z.infer<typeof contentItemSchema>
export type CreateContentItemInput = z.infer<
  typeof createContentItemInputSchema
>
export type UpdateContentItemInput = z.infer<
  typeof updateContentItemInputSchema
>
export type DashboardDto = z.infer<typeof dashboardSchema>
export type ShareContentItemResult = z.infer<
  typeof shareContentItemResultSchema
>
export type PublicContentItemDto = z.infer<typeof publicContentItemSchema>
export type CollaboratorIntent = z.infer<typeof collaboratorIntentSchema>
export type ContentDraft = z.infer<typeof contentDraftSchema>
export type ContentSuggestion = z.infer<typeof contentSuggestionSchema>
export type CollaboratorContext = z.infer<typeof collaboratorContextSchema>
export type CollaboratorResponse = z.infer<typeof collaboratorResponseSchema>
