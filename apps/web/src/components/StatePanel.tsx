import { AlertTriangle, FilePlus2, LoaderCircle } from 'lucide-react'

export function StatePanel({
  kind,
  title,
  detail,
}: {
  kind: 'loading' | 'empty' | 'error'
  title: string
  detail?: string | undefined
}) {
  const Icon =
    kind === 'loading'
      ? LoaderCircle
      : kind === 'empty'
        ? FilePlus2
        : AlertTriangle
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className="grid min-h-56 place-items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
    >
      <div>
        <Icon
          className={`mx-auto h-7 w-7 text-violet-500 ${kind === 'loading' ? 'animate-spin' : ''}`}
        />
        <h2 className="mt-4 font-semibold text-slate-900">{title}</h2>
        {detail ? (
          <p className="mt-2 max-w-md text-sm text-slate-500">{detail}</p>
        ) : null}
      </div>
    </div>
  )
}
