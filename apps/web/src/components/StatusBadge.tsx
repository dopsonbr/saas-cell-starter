import type { ContentStatus } from '@starter/contracts'
import { Badge } from '@starter/ui/components/badge'

const classes: Record<ContentStatus, string> = {
  draft: 'border-amber-200 bg-amber-50 text-amber-700',
  published: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  archived: 'border-slate-200 bg-slate-100 text-slate-600',
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  return <Badge className={classes[status]}>{status}</Badge>
}
