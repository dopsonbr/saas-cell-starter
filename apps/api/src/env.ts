import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_JWT_KEY: z.string().min(1).optional(),
  EXPECTED_CLERK_ORG_ID: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  CUSTOMER_SLUG: z.string().min(1).default('local'),
})

export const env = schema.parse(process.env)
