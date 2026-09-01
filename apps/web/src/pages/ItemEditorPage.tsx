// biome-ignore format: The package scope length changes during initialization.
import type { ContentDraft, ContentSuggestion } from '@starter/contracts'
import { Button } from '@starter/ui/components/button'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import {
  Archive,
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Share2,
  Unlink,
} from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ContentForm } from '../components/ContentForm'
import { StatePanel } from '../components/StatePanel'
import { StatusBadge } from '../components/StatusBadge'
import { useApi } from '../lib/api'

const ContentCollaborator = lazy(() =>
  import('../components/ContentCollaborator').then((module) => ({
    default: module.ContentCollaborator,
  })),
)
const emptyDraft: ContentDraft = { title: '', body: '', tags: [] }

function applySuggestion(
  current: ContentDraft,
  suggestion: ContentSuggestion,
): ContentDraft {
  return {
    title: suggestion.title ?? current.title,
    body: suggestion.body ?? current.body,
    tags: suggestion.tags ?? current.tags,
  }
}

function CollaboratorFallback() {
  return (
    <div className="grid min-h-72 place-items-center rounded-3xl border border-violet-200 bg-violet-50 text-sm font-medium text-violet-700">
      Loading collaborator…
    </div>
  )
}

function Header({
  title,
  status,
}: {
  title: string
  status?: 'draft' | 'published' | 'archived'
}) {
  return (
    <div className="mb-8">
      <Link
        to="/"
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-violet-600"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to library
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {status ? <StatusBadge status={status} /> : null}
      </div>
    </div>
  )
}

export function NewItemPage() {
  const api = useApi()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<ContentDraft>(emptyDraft)
  const create = useMutation({
    mutationFn: api.createItem,
    onSuccess: async (item) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['items'] }),
      ])
      await navigate({ to: '/items/$itemId', params: { itemId: item.id } })
    },
  })
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <Header title="Create a content item" />
      <ContentForm
        value={draft}
        onChange={setDraft}
        collaborator={
          <Suspense fallback={<CollaboratorFallback />}>
            <ContentCollaborator
              draft={draft}
              onApply={(suggestion) =>
                setDraft((current) => applySuggestion(current, suggestion))
              }
            />
          </Suspense>
        }
        submitLabel="Save draft"
        pending={create.isPending}
        error={create.error?.message}
        onSubmit={(input) => create.mutate(input)}
      />
    </main>
  )
}

export function EditItemPage() {
  const { itemId } = useParams({ from: '/workspace/items/$itemId' })
  const api = useApi()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<ContentDraft>(emptyDraft)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const initialized = useRef<string | null>(null)
  const itemQuery = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => api.item(itemId),
  })
  const refresh = async () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['item', itemId] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['items'] }),
    ])
  const update = useMutation({
    mutationFn: (input: ContentDraft) => api.updateItem(itemId, input),
    onSuccess: async () => {
      await refresh()
      setSaved(true)
    },
  })
  const share = useMutation({
    mutationFn: () => api.shareItem(itemId),
    onSuccess: refresh,
  })
  const revoke = useMutation({
    mutationFn: () => api.revokeItem(itemId),
    onSuccess: refresh,
  })
  const archive = useMutation({
    mutationFn: () => api.archiveItem(itemId),
    onSuccess: async () => {
      await refresh()
      await navigate({ to: '/' })
    },
  })

  useEffect(() => {
    const item = itemQuery.data
    if (!item || initialized.current === item.id) return
    initialized.current = item.id
    setDraft({ title: item.title, body: item.body, tags: item.tags })
  }, [itemQuery.data])
  if (itemQuery.isLoading)
    return (
      <main className="mx-auto max-w-7xl px-5 py-10">
        <StatePanel kind="loading" title="Loading content…" />
      </main>
    )
  if (itemQuery.isError || !itemQuery.data)
    return (
      <main className="mx-auto max-w-7xl px-5 py-10">
        <StatePanel
          kind="error"
          title="Content unavailable"
          detail={itemQuery.error?.message}
        />
      </main>
    )
  const item = itemQuery.data
  const actionError =
    update.error ?? share.error ?? revoke.error ?? archive.error
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <Header title={item.title} status={item.status} />
      <div className="mb-7 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {item.status === 'published' && item.shareUrl ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(item.shareUrl ?? '')
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1800)
              }}
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <a
              href={item.shareUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-md px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open public page
            </a>
            <Button
              type="button"
              variant="ghost"
              disabled={revoke.isPending}
              onClick={() => revoke.mutate()}
            >
              <Unlink className="mr-2 h-4 w-4" />
              Revoke link
            </Button>
          </>
        ) : (
          <Button
            type="button"
            disabled={share.isPending || item.status === 'archived'}
            onClick={() => share.mutate()}
          >
            <Share2 className="mr-2 h-4 w-4" />
            {share.isPending ? 'Publishing…' : 'Publish share link'}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          className="sm:ml-auto"
          disabled={archive.isPending || item.status === 'archived'}
          onClick={() => {
            if (
              window.confirm(
                'Archive this item? Public access will end permanently.',
              )
            )
              archive.mutate()
          }}
        >
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </Button>
      </div>
      {item.status === 'archived' ? (
        <p className="mb-6 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
          Archived items are read-only and cannot be republished.
        </p>
      ) : null}
      {actionError ? (
        <p
          role="alert"
          className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {actionError.message}
        </p>
      ) : null}
      <ContentForm
        value={draft}
        onChange={(nextDraft) => {
          setDraft(nextDraft)
          setSaved(false)
        }}
        disabled={item.status === 'archived'}
        collaborator={
          <Suspense fallback={<CollaboratorFallback />}>
            <ContentCollaborator
              draft={draft}
              onApply={(suggestion) => {
                setSaved(false)
                setDraft((current) => applySuggestion(current, suggestion))
              }}
            />
          </Suspense>
        }
        submitLabel="Save changes"
        pending={update.isPending}
        error={update.error?.message}
        success={saved ? 'Changes saved.' : undefined}
        onSubmit={(input) => {
          setSaved(false)
          update.mutate(input)
        }}
      />
    </main>
  )
}
