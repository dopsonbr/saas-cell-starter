import type { ContentStatus } from '@starter/contracts'
import { Badge } from '@starter/ui/components/badge'
import { Card, CardContent } from '@starter/ui/components/card'
import { Input } from '@starter/ui/components/input'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Archive,
  ArrowUpRight,
  FileText,
  Plus,
  Search,
  Share2,
  Sparkles,
} from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { StatePanel } from '../components/StatePanel'
import { StatusBadge } from '../components/StatusBadge'
import { useApi } from '../lib/api'

const filters: Array<'all' | ContentStatus> = [
  'all',
  'draft',
  'published',
  'archived',
]

export function DashboardPage() {
  const api = useApi()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<(typeof filters)[number]>('all')
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard,
  })
  const items = useQuery({ queryKey: ['items'], queryFn: api.items })
  if (dashboard.isLoading || items.isLoading)
    return (
      <main className="mx-auto max-w-7xl px-5 py-10">
        <StatePanel kind="loading" title="Loading the content library…" />
      </main>
    )
  if (dashboard.isError || items.isError || !dashboard.data || !items.data)
    return (
      <main className="mx-auto max-w-7xl px-5 py-10">
        <StatePanel
          kind="error"
          title="The content workspace is unavailable"
          detail={(dashboard.error ?? items.error)?.message}
        />
      </main>
    )

  const visible = items.data.filter(
    (item) =>
      (filter === 'all' || item.status === filter) &&
      `${item.title} ${item.body} ${item.tags.join(' ')}`
        .toLowerCase()
        .includes(deferredSearch),
  )
  const metrics = [
    { label: 'Total items', value: dashboard.data.total, icon: FileText },
    { label: 'Drafts', value: dashboard.data.draft, icon: FileText },
    { label: 'Published', value: dashboard.data.published, icon: Share2 },
    { label: 'Archived', value: dashboard.data.archived, icon: Archive },
  ]
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge className="border-violet-200 bg-violet-50 text-violet-700">
            Organization workspace
          </Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Content library
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Draft together, publish deliberately, and revoke unlisted links at
            any time.
          </p>
        </div>
        <Link
          to="/items/new"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New item
        </Link>
      </div>
      <section className="relative mt-9 overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-violet-200">
              Mock-first collaboration
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Create with a reviewable AI partner.
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Apply field-level suggestions, then explicitly save the changes
              you want.
            </p>
          </div>
          <Link
            to="/items/new"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-slate-950"
          >
            <Sparkles className="mr-2 h-4 w-4 text-violet-600" />
            Create with AI
          </Link>
        </div>
      </section>
      <section
        className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Content metrics"
      >
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card
            key={label}
            className="rounded-2xl border-0 shadow-sm ring-1 ring-slate-200"
          >
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold">{value}</p>
              </div>
              <Icon className="h-5 w-5 text-violet-600" />
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="mt-10">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">Library</h2>
            <p className="mt-1 text-sm text-slate-500">
              {visible.length} items match this view
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                aria-label="Search content"
                placeholder="Search content"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9 sm:w-64"
              />
            </div>
            <select
              aria-label="Filter content by status"
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as (typeof filters)[number])
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              {filters.map((value) => (
                <option key={value} value={value}>
                  {value === 'all' ? 'All statuses' : value}
                </option>
              ))}
            </select>
          </div>
        </div>
        {visible.length === 0 ? (
          <div className="mt-6">
            <StatePanel
              kind="empty"
              title={
                items.data.length === 0
                  ? 'No content yet'
                  : 'No content matches this view'
              }
              detail="Create a new draft or adjust the filters."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((item) => (
              <Link
                key={item.id}
                to="/items/$itemId"
                params={{ itemId: item.id }}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <StatusBadge status={item.status} />
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {item.body}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag}>#{tag}</Badge>
                  ))}
                </div>
                <p className="mt-5 text-xs text-slate-400">
                  Updated {new Date(item.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
