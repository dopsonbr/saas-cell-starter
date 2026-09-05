import type { ContentDraft } from '@starter/contracts'
import { Button } from '@starter/ui/components/button'
import { Card, CardContent } from '@starter/ui/components/card'
import { Input } from '@starter/ui/components/input'
import { Textarea } from '@starter/ui/components/textarea'
import { Save } from 'lucide-react'
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'

export function ContentForm({
  value,
  onChange,
  collaborator,
  submitLabel,
  pending,
  disabled,
  error,
  success,
  onSubmit,
}: {
  value: ContentDraft
  onChange: (value: ContentDraft) => void
  collaborator: ReactNode
  submitLabel: string
  pending: boolean
  disabled?: boolean | undefined
  error?: string | undefined
  success?: string | undefined
  onSubmit: (input: ContentDraft) => void
}) {
  const serializedTags = value.tags.join(', ')
  const [tagsText, setTagsText] = useState(serializedTags)
  const lastTagsValue = useRef(serializedTags)

  useEffect(() => {
    if (serializedTags === lastTagsValue.current) return
    lastTagsValue.current = serializedTags
    setTagsText(serializedTags)
  }, [serializedTags])

  const setField = <K extends keyof ContentDraft>(
    field: K,
    fieldValue: ContentDraft[K],
  ) => onChange({ ...value, [field]: fieldValue })

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr] lg:items-start">
      <Card className="order-2 rounded-2xl border-0 shadow-sm ring-1 ring-slate-200 lg:order-1">
        <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault()
            onSubmit(value)
          }}
        >
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div>
              <label htmlFor="title" className="text-sm font-semibold">
                Title
              </label>
              <p className="mb-2 mt-1 text-sm text-slate-500">
                A clear name your team can find later.
              </p>
              <Input
                id="title"
                required
                maxLength={120}
                disabled={disabled}
                value={value.title}
                onChange={(event) => setField('title', event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="body" className="text-sm font-semibold">
                Body
              </label>
              <p className="mb-2 mt-1 text-sm text-slate-500">
                Write up to 5,000 characters.
              </p>
              <Textarea
                id="body"
                required
                maxLength={5000}
                disabled={disabled}
                className="min-h-64"
                value={value.body}
                onChange={(event) => setField('body', event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="tags" className="text-sm font-semibold">
                Tags
              </label>
              <p className="mb-2 mt-1 text-sm text-slate-500">
                Up to eight unique comma-separated tags.
              </p>
              <Input
                id="tags"
                disabled={disabled}
                value={tagsText}
                onChange={(event) => {
                  const next = event.target.value
                  const tags = next
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                  setTagsText(next)
                  lastTagsValue.current = tags.join(', ')
                  setField('tags', tags)
                }}
              />
            </div>
            {error ? (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            ) : null}
            {success ? (
              <p
                role="status"
                className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
              >
                {success}
              </p>
            ) : null}
            <Button size="lg" disabled={pending || disabled}>
              <Save className="mr-2 h-4 w-4" />{' '}
              {pending ? 'Saving…' : submitLabel}
            </Button>
          </CardContent>
        </form>
      </Card>
      <aside className="order-1 lg:sticky lg:top-24 lg:order-2">
        {collaborator}
      </aside>
    </div>
  )
}
