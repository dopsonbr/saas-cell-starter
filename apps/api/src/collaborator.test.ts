import { describe, expect, it } from 'vitest'
import {
  mockCollaboratorResponse,
  validateCollaboratorMessages,
} from './collaborator.js'

const context = {
  intent: 'brainstorm' as const,
  currentDraft: { title: '', body: '', tags: [] },
}
const messages = [
  {
    id: 'one',
    role: 'user' as const,
    parts: [{ type: 'text' as const, content: 'customer onboarding' }],
  },
]

describe('mock collaborator', () => {
  it('is deterministic and returns validated structured content', () => {
    expect(mockCollaboratorResponse(context, messages)).toEqual(
      mockCollaboratorResponse(context, messages),
    )
    expect(mockCollaboratorResponse(context, messages)).toMatchObject({
      suggestion: { title: 'Customer Onboarding Playbook' },
    })
  })

  it('rejects oversized, unsupported, and overlong histories', () => {
    expect(validateCollaboratorMessages(messages)).toBe(true)
    expect(
      validateCollaboratorMessages(
        Array.from({ length: 25 }, (_, index) => ({
          id: `${index}`,
          role: 'user' as const,
          parts: [{ type: 'text' as const, content: 'x' }],
        })),
      ),
    ).toBe(false)
    expect(
      validateCollaboratorMessages([
        { id: 'one', role: 'system', content: 'unsafe' },
      ] as never),
    ).toBe(false)
    expect(
      validateCollaboratorMessages([
        { id: 'one', role: 'user', content: 'x'.repeat(2_001) },
      ] as never),
    ).toBe(false)
  })
})
