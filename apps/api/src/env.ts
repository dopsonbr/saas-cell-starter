import { z } from 'zod'

const optionalValue = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
)

export const apiEnvSchema = z
  .object({
    DATABASE_URL: z.string().url(),
    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_PUBLISHABLE_KEY: z.string().min(1),
    CLERK_JWT_KEY: optionalValue,
    EXPECTED_CLERK_ORG_ID: z.string().min(1),
    FRONTEND_URL: z.string().url(),
    CUSTOMER_SLUG: z.string().min(1).default('local'),
    AI_PROVIDER: z.enum(['mock', 'openai', 'vercel-gateway']).default('mock'),
    AI_MODEL: optionalValue,
    AI_GATEWAY_API_KEY: optionalValue,
    OPENAI_API_KEY: optionalValue,
    VERCEL_OIDC_TOKEN: optionalValue,
    VERCEL_GIT_COMMIT_SHA: optionalValue,
  })
  .superRefine((value, context) => {
    if (value.AI_PROVIDER !== 'mock' && !value.AI_MODEL) {
      context.addIssue({
        code: 'custom',
        path: ['AI_MODEL'],
        message: 'AI_MODEL is required',
      })
    }
    if (value.AI_PROVIDER === 'openai' && !value.OPENAI_API_KEY) {
      context.addIssue({
        code: 'custom',
        path: ['OPENAI_API_KEY'],
        message: 'OPENAI_API_KEY is required when AI_PROVIDER=openai',
      })
    }
    if (
      value.AI_PROVIDER === 'vercel-gateway' &&
      value.AI_MODEL &&
      !value.AI_MODEL.includes('/')
    ) {
      context.addIssue({
        code: 'custom',
        path: ['AI_MODEL'],
        message: 'Gateway model IDs must use provider/model format',
      })
    }
  })

export const env = apiEnvSchema.parse(process.env)
