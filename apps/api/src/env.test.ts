import { describe, expect, it } from 'vitest'

const base = {
  DATABASE_URL: 'postgresql://example.com/database',
  CLERK_SECRET_KEY: 'secret',
  CLERK_PUBLISHABLE_KEY: 'publishable',
  EXPECTED_CLERK_ORG_ID: 'org_expected',
  FRONTEND_URL: 'https://cell.example.com',
}

Object.assign(process.env, base)
const { apiEnvSchema } = await import('./env.js')

describe('AI provider environment', () => {
  it('allows credential-free mock mode and ignores its model', () => {
    expect(
      apiEnvSchema.safeParse({ ...base, AI_PROVIDER: 'mock' }).success,
    ).toBe(true)
  })

  it('requires a model and direct OpenAI credential', () => {
    expect(
      apiEnvSchema.safeParse({ ...base, AI_PROVIDER: 'openai' }).success,
    ).toBe(false)
    expect(
      apiEnvSchema.safeParse({
        ...base,
        AI_PROVIDER: 'openai',
        AI_MODEL: 'gpt-5-mini',
        OPENAI_API_KEY: 'key',
      }).success,
    ).toBe(true)
  })

  it('requires provider/model syntax for Gateway', () => {
    expect(
      apiEnvSchema.safeParse({
        ...base,
        AI_PROVIDER: 'vercel-gateway',
        AI_MODEL: 'gpt-5-mini',
      }).success,
    ).toBe(false)
    expect(
      apiEnvSchema.safeParse({
        ...base,
        AI_PROVIDER: 'vercel-gateway',
        AI_MODEL: 'openai/gpt-5-mini',
      }).success,
    ).toBe(true)
  })
})
