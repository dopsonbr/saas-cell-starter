import { Badge } from '@starter/ui/components/badge'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { Layers3, ShieldCheck } from 'lucide-react'
import { StatePanel } from '../components/StatePanel'
import { publicApi } from '../lib/api'

export function SharedItemPage() {
  const { shareToken } = useParams({ from: '/share/$shareToken' })
  const item = useQuery({
    queryKey: ['public-item', shareToken],
    queryFn: () => publicApi.item(shareToken),
  })
  if (item.isLoading)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6">
        <div className="w-full max-w-2xl">
          <StatePanel kind="loading" title="Loading shared content…" />
        </div>
      </main>
    )
  if (item.isError || !item.data)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6">
        <div className="w-full max-w-2xl">
          <StatePanel
            kind="error"
            title="This share is unavailable"
            detail="The link may be invalid, revoked, or archived."
          />
        </div>
      </main>
    )
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-5 py-16 text-white">
      <article className="relative w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 font-bold">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600">
              <Layers3 className="h-5 w-5" />
            </span>
            Content Cell
          </div>
          <span className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4" />
            Unlisted share
          </span>
        </div>
        <div className="rounded-[2rem] bg-gradient-to-br from-violet-600 to-fuchsia-500 p-1 shadow-2xl">
          <div className="rounded-[1.8rem] bg-white p-8 text-slate-950 sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-600">
              {item.data.title}
            </p>
            <p className="mt-8 whitespace-pre-wrap text-lg leading-8 sm:text-xl">
              {item.data.body}
            </p>
            <div className="mt-10 flex flex-wrap gap-2">
              {item.data.tags.map((tag) => (
                <Badge key={tag}>#{tag}</Badge>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Published {new Date(item.data.publishedAt).toLocaleDateString()} ·
          Managed with revocable sharing
        </p>
      </article>
    </main>
  )
}
