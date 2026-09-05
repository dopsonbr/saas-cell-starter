import { randomUUID } from 'node:crypto'
import {
  type CollaboratorContext,
  type CollaboratorResponse,
  collaboratorResponseSchema,
} from '@starter/contracts'
import {
  chat,
  EventType,
  type ModelMessage,
  type StreamChunk,
  type UIMessage,
} from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'
import { createVercelGatewayText } from '@tanstack/ai-vercel-gateway'

type CollaboratorMessages = Array<UIMessage | ModelMessage>

function textFromMessage(message: UIMessage | ModelMessage): string {
  if ('parts' in message && Array.isArray(message.parts)) {
    return message.parts
      .filter((part) => part.type === 'text')
      .map((part) => ('content' in part ? part.content : ''))
      .join(' ')
  }
  return 'content' in message && typeof message.content === 'string'
    ? message.content
    : ''
}

function latestUserText(messages: CollaboratorMessages): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role === 'user') return textFromMessage(message).trim()
  }
  return ''
}

function topicFrom(input: string): string {
  const cleaned = input
    .replace(/[^a-zA-Z0-9 '-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.split(' ').slice(0, 10).join(' ') || 'customer onboarding'
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 120)
}

export function mockCollaboratorResponse(
  context: CollaboratorContext,
  messages: CollaboratorMessages,
): CollaboratorResponse {
  const draft = context.currentDraft
  const topic = topicFrom(latestUserText(messages) || draft.title || draft.body)

  switch (context.intent) {
    case 'brainstorm':
      return {
        reply:
          'Here is a focused first draft with a concrete outcome and a clear next step.',
        suggestion: {
          title: titleCase(`${topic} playbook`),
          body: `A practical guide to ${topic}, organized around the decisions a team needs to make and the evidence that shows the workflow is complete.`,
          tags: ['planning', 'collaboration'],
        },
      }
    case 'improve-title':
      return {
        reply: 'I made the title more specific and outcome-oriented.',
        suggestion: {
          title: titleCase(`${draft.title || topic}: a practical guide`),
        },
      }
    case 'tighten-body':
      return {
        reply: 'I shortened the body while preserving its main promise.',
        suggestion: {
          body: draft.body
            ? draft.body
                .split(/(?<=[.!?])\s+/)
                .slice(0, 2)
                .join(' ')
                .slice(0, 5_000)
            : `A concise guide to ${topic} with clear decisions and verification steps.`,
        },
      }
    case 'alternate-angle':
      return {
        reply:
          'This version frames the topic around the reader’s decision instead of the process.',
        suggestion: {
          title: titleCase(`Choosing the right approach to ${topic}`),
          body: `Start with the outcome, compare the meaningful tradeoffs, and finish with a verifiable recommendation for ${topic}.`,
        },
      }
    case 'suggest-tags':
      return {
        reply: 'These tags describe the subject without duplicating the title.',
        suggestion: {
          tags: Array.from(new Set([...draft.tags, 'guide', 'teamwork'])).slice(
            0,
            8,
          ),
        },
      }
    case 'critique':
      return {
        reply:
          draft.title && draft.body
            ? 'The direction is clear. Make the opening sentence name the audience and measurable outcome, then remove any repeated setup.'
            : 'Add a specific audience and outcome first; that will make later editing much more useful.',
        suggestion: null,
      }
    case 'freeform':
      return {
        reply:
          'I translated your note into a concrete edit you can review before saving.',
        suggestion: draft.body
          ? {
              body: `${draft.body.replace(/[.!?]+$/, '')}. Next, add one concrete example.`,
            }
          : {
              title: titleCase(topic),
              body: `A clear, reviewable starting point for ${topic}.`,
            },
      }
  }
}

async function* createMockStream({
  context,
  messages,
  threadId,
  runId,
}: {
  context: CollaboratorContext
  messages: CollaboratorMessages
  threadId: string
  runId: string
}): AsyncGenerator<StreamChunk> {
  const messageId = randomUUID()
  const response = collaboratorResponseSchema.parse(
    mockCollaboratorResponse(context, messages),
  )
  const raw = JSON.stringify(response)
  const chunkSize = Math.max(1, Math.ceil(raw.length / 4))
  const timestamp = Date.now()

  yield { type: EventType.RUN_STARTED, threadId, runId, timestamp }
  yield {
    type: 'CUSTOM',
    name: 'structured-output.start',
    value: { messageId },
    timestamp,
  }
  yield {
    type: EventType.TEXT_MESSAGE_START,
    messageId,
    role: 'assistant',
    timestamp,
  }
  for (let index = 0; index < raw.length; index += chunkSize) {
    yield {
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId,
      delta: raw.slice(index, index + chunkSize),
      timestamp: Date.now(),
    }
    await Promise.resolve()
  }
  yield { type: EventType.TEXT_MESSAGE_END, messageId, timestamp: Date.now() }
  yield {
    type: 'CUSTOM',
    name: 'structured-output.complete',
    value: { object: response, raw, messageId },
    timestamp: Date.now(),
  }
  yield {
    type: EventType.RUN_FINISHED,
    threadId,
    runId,
    timestamp: Date.now(),
    result: response,
  }
}

function systemPrompt(context: CollaboratorContext): string {
  return [
    'You are a concise collaborative editor for a B2B content workspace.',
    'Return one helpful reply and, only when useful, a partial structured suggestion.',
    'Never claim that you saved, published, or changed the item.',
    `Requested intent: ${context.intent}.`,
    `Current unsaved draft: ${JSON.stringify(context.currentDraft)}.`,
  ].join('\n')
}

export function createCollaboratorStream({
  provider,
  model,
  context,
  messages,
  threadId,
  runId,
  abortController,
  gatewayToken,
}: {
  provider: 'mock' | 'openai' | 'vercel-gateway'
  model?: string | undefined
  context: CollaboratorContext
  messages: CollaboratorMessages
  threadId: string
  runId: string
  abortController: AbortController
  gatewayToken?: string | undefined
}): AsyncIterable<StreamChunk> {
  if (provider === 'mock') {
    return createMockStream({ context, messages, threadId, runId })
  }
  if (!model) throw new Error('AI model is not configured')

  if (provider === 'vercel-gateway' && !gatewayToken) {
    throw new Error('AI Gateway credential is not configured')
  }

  return chat({
    adapter: (provider === 'vercel-gateway'
      ? createVercelGatewayText(
          model as Parameters<typeof createVercelGatewayText>[0],
          gatewayToken as string,
        )
      : openaiText(model as Parameters<typeof openaiText>[0])) as never,
    messages,
    systemPrompts: [systemPrompt(context)],
    outputSchema: collaboratorResponseSchema,
    stream: true,
    threadId,
    runId,
    abortController,
  })
}

export function validateCollaboratorMessages(
  messages: CollaboratorMessages,
): boolean {
  if (
    messages.length > 24 ||
    Buffer.byteLength(JSON.stringify(messages), 'utf8') > 20_000
  )
    return false
  return messages.every((message) => {
    if (message.role !== 'user' && message.role !== 'assistant') return false
    if (
      'parts' in message &&
      message.parts.some((part) => part.type !== 'text')
    )
      return false
    if ('content' in message && typeof message.content !== 'string')
      return false
    const text = textFromMessage(message)
    return text.length > 0 && text.length <= 2_000
  })
}
