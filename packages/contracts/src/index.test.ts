import { describe, expect, it } from 'vitest'
import {
  collaboratorResponseSchema,
  createContentItemInputSchema,
  updateContentItemInputSchema,
} from './index.js'

describe('content contracts', () => {
  it('enforces content limits, unique tags, and nonempty updates', () => {
    expect(
      createContentItemInputSchema.safeParse({
        title: '',
        body: 'body',
        tags: [],
      }).success,
    ).toBe(false)
    expect(
      createContentItemInputSchema.safeParse({
        title: 'Valid',
        body: 'body',
        tags: ['News', 'news'],
      }).success,
    ).toBe(false)
    expect(
      createContentItemInputSchema.safeParse({
        title: 'Valid',
        body: 'body',
        tags: Array.from({ length: 9 }, (_, index) => `${index}`),
      }).success,
    ).toBe(false)
    expect(updateContentItemInputSchema.safeParse({}).success).toBe(false)
    expect(
      updateContentItemInputSchema.safeParse({ body: 'Updated' }).success,
    ).toBe(true)
  })

  it('requires a safe reply and a nonempty partial suggestion', () => {
    expect(
      collaboratorResponseSchema.safeParse({
        reply: 'Useful note',
        suggestion: { title: 'Better title' },
      }).success,
    ).toBe(true)
    expect(
      collaboratorResponseSchema.safeParse({ reply: '', suggestion: null })
        .success,
    ).toBe(false)
    expect(
      collaboratorResponseSchema.safeParse({ reply: 'No-op', suggestion: {} })
        .success,
    ).toBe(false)
  })
})
