import { z } from 'zod'

export const recordStatusSchema = z.enum(['active', 'completed'])

export const recordSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: recordStatusSchema,
  value: z.number().int(),
  createdAt: z.string().datetime(),
})

export const createRecordInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  value: z.number().int().min(0).max(1_000_000),
})

export const dashboardSchema = z.object({
  total: z.number().int(),
  active: z.number().int(),
  completed: z.number().int(),
  totalValue: z.number().int(),
  recent: z.array(recordSchema),
})

export type RecordDto = z.infer<typeof recordSchema>
export type CreateRecordInput = z.infer<typeof createRecordInputSchema>
export type DashboardDto = z.infer<typeof dashboardSchema>
