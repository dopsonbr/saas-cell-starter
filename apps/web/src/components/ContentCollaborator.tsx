import { useAuth } from '@starter/auth/react'
import {
  type CollaboratorIntent,
  type ContentDraft,
  type ContentSuggestion,
  collaboratorResponseSchema,
} from '@starter/contracts'
import { Badge } from '@starter/ui/components/badge'
import { Button } from '@starter/ui/components/button'
import { Card, CardContent } from '@starter/ui/components/card'
import { Textarea } from '@starter/ui/components/textarea'
import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import {
  Lightbulb,
  MessageCircleMore,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Trash2,
  WandSparkles,
} from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'

const apiUrl = import.meta.env.VITE_API_URL
const actions: Array<{
  intent: Exclude<CollaboratorIntent, 'freeform'>
  label: string
  prompt: string
}> = [
  {
    intent: 'brainstorm',
    label: 'Brainstorm',
    prompt: 'Give me a useful starting point.',
  },
  {
    intent: 'improve-title',
    label: 'Improve title',
    prompt: 'Make this title specific and outcome-oriented.',
  },
  {
    intent: 'tighten-body',
    label: 'Tighten body',
    prompt: 'Make this body clearer and more concise.',
  },
  {
    intent: 'alternate-angle',
    label: 'Another angle',
    prompt: 'Explore a different framing.',
  },
  {
    intent: 'suggest-tags',
    label: 'Suggest tags',
    prompt: 'Suggest useful tags.',
  },
  {
    intent: 'critique',
    label: 'Critique',
    prompt: 'Give concise editorial feedback.',
  },
]

function SuggestionCard({
  suggestion,
  onApply,
}: {
  suggestion: ContentSuggestion
  onApply: (suggestion: ContentSuggestion) => void
}) {
  const fields = Object.entries(suggestion) as Array<
    [keyof ContentSuggestion, string | string[]]
  >
  return (
    <div className="mt-3 rounded-xl border border-violet-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
          Suggested edit
        </p>
        <Button type="button" size="sm" onClick={() => onApply(suggestion)}>
          Apply all
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map(([field, fieldValue]) => (
          <div key={field} className="rounded-lg bg-violet-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold capitalize text-violet-700">
                  {field}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                  {Array.isArray(fieldValue)
                    ? fieldValue.map((tag) => `#${tag}`).join(' ')
                    : fieldValue}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onApply({ [field]: fieldValue })}
              >
                Apply
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ContentCollaborator({
  draft,
  onApply,
}: {
  draft: ContentDraft
  onApply: (suggestion: ContentSuggestion) => void
}) {
  const { getToken } = useAuth()
  const [input, setInput] = useState('')
  const [intent, setIntent] = useState<CollaboratorIntent>('freeform')
  const connection = useMemo(
    () =>
      fetchServerSentEvents(`${apiUrl}/v1/ai/collaborator`, async () => {
        const token = await getToken()
        if (!token) throw new Error('Authentication required')
        return { headers: { Authorization: `Bearer ${token}` } }
      }),
    [getToken],
  )
  const forwardedProps = useMemo(
    () => ({ intent, currentDraft: draft }),
    [intent, draft],
  )
  const { messages, sendMessage, isLoading, error, stop, reload, clear } =
    useChat({
      connection,
      forwardedProps,
      outputSchema: collaboratorResponseSchema,
    })

  const send = async (message: string, nextIntent: CollaboratorIntent) => {
    const content = message.trim()
    if (!content || isLoading) return
    setInput('')
    setIntent(nextIntent)
    await sendMessage(content, {
      whenBusy: 'drop',
      body: { intent: nextIntent, currentDraft: draft },
    })
  }

  return (
    <Card className="overflow-hidden rounded-3xl border-violet-200 bg-gradient-to-b from-violet-50 to-white shadow-xl shadow-violet-100">
      <div className="border-b border-violet-100 bg-white/80 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white">
              <WandSparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold">Content collaborator</h2>
              <p className="text-xs text-slate-500">
                Review suggestions before saving
              </p>
            </div>
          </div>
          <Badge className="border-violet-200 bg-violet-50 text-violet-700">
            AI
          </Badge>
        </div>
      </div>
      <CardContent className="p-5">
        <fieldset className="mb-4 flex flex-wrap gap-2">
          <legend className="sr-only">Collaborator actions</legend>
          {actions.map((action) => (
            <Button
              key={action.intent}
              type="button"
              size="sm"
              variant="outline"
              disabled={isLoading}
              onClick={() => void send(action.prompt, action.intent)}
            >
              {action.intent === 'brainstorm' ? (
                <Lightbulb className="mr-1 h-3.5 w-3.5" />
              ) : (
                <Sparkles className="mr-1 h-3.5 w-3.5" />
              )}
              {action.label}
            </Button>
          ))}
        </fieldset>
        <div
          className="max-h-[28rem] min-h-48 space-y-4 overflow-y-auto rounded-2xl border border-violet-100 bg-white/80 p-4"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="grid min-h-40 place-items-center text-center">
              <div>
                <MessageCircleMore className="mx-auto h-7 w-7 text-violet-400" />
                <p className="mt-3 font-semibold">
                  Bring me an idea or rough draft.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Suggestions never save automatically.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const hasStructured = message.parts.some(
                (part) => part.type === 'structured-output',
              )
              return (
                <div
                  key={message.id}
                  className={
                    message.role === 'user'
                      ? 'ml-8 rounded-2xl rounded-br-md bg-slate-900 px-4 py-3 text-sm text-white'
                      : 'mr-3 rounded-2xl rounded-bl-md bg-violet-50 px-4 py-3 text-sm text-slate-700'
                  }
                >
                  {message.parts.map((part) => {
                    if (part.type === 'text')
                      return message.role === 'assistant' &&
                        hasStructured ? null : (
                        <p key={`text-${part.content}`}>{part.content}</p>
                      )
                    if (part.type === 'structured-output') {
                      const response = part.data ?? part.partial
                      return (
                        <div key="structured-output">
                          {response?.reply ? (
                            <p className="leading-6">{response.reply}</p>
                          ) : null}
                          {part.status === 'complete' &&
                          part.data?.suggestion ? (
                            <SuggestionCard
                              suggestion={part.data.suggestion}
                              onApply={onApply}
                            />
                          ) : null}
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              )
            })
          )}
          {isLoading ? (
            <p className="flex items-center gap-2 text-sm text-violet-700">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Collaborating…
            </p>
          ) : null}
        </div>
        {error ? (
          <div
            role="alert"
            className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            <p>The collaborator is unavailable. Your draft is unchanged.</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void reload()}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        ) : null}
        <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault()
            void send(input, 'freeform')
          }}
          className="mt-4 space-y-3"
        >
          <Textarea
            aria-label="Message the content collaborator"
            maxLength={2000}
            placeholder="Ask for a clearer opening…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void send(input, 'freeform')
              }
            }}
          />
          <div className="flex justify-between gap-3">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={messages.length === 0 || isLoading}
              onClick={clear}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Clear
            </Button>
            {isLoading ? (
              <Button type="button" size="sm" variant="outline" onClick={stop}>
                <Square className="mr-2 h-3.5 w-3.5" />
                Stop
              </Button>
            ) : (
              <Button type="submit" size="sm" disabled={!input.trim()}>
                <Send className="mr-2 h-3.5 w-3.5" />
                Send
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
