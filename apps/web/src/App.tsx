import { type FormEvent, type ReactNode, useState } from 'react'
import { OrganizationSwitcher, Show, SignInButton, SignUpButton, UserButton, useAuth } from '@starter/auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, CheckCircle2, Database, Plus, RefreshCw } from 'lucide-react'
import { createApiClient } from '@starter/api-client'
import { Button } from '@starter/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@starter/ui/components/card'
import { Input } from '@starter/ui/components/input'

const apiUrl = import.meta.env.VITE_API_URL
if (!apiUrl) throw new Error('Missing VITE_API_URL')

function Dashboard() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  const api = createApiClient(apiUrl, getToken)
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')

  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: api.dashboard })
  const createRecord = useMutation({
    mutationFn: api.createRecord,
    onSuccess: async () => {
      setTitle(''); setValue('')
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    createRecord.mutate({ title, value: Number(value || 0) })
  }

  if (dashboard.isLoading) return <State icon={<RefreshCw className="animate-spin" />} title="Loading customer data…" />
  if (dashboard.isError) return <State icon={<Activity />} title="API unavailable" detail={dashboard.error.message} />
  const data = dashboard.data
  const metrics: Array<[string, string | number, typeof Activity]> = [
    ['Total records', data.total, Database],
    ['Active', data.active, Activity],
    ['Completed', data.completed, CheckCircle2],
    ['Total value', data.totalValue.toLocaleString(), Database],
  ]

  return <>
    <section className="grid gap-4 md:grid-cols-4">
      {metrics.map(([label, metric, Icon]) => <Card key={String(label)}><CardHeader><CardDescription>{String(label)}</CardDescription><CardTitle className="flex items-center justify-between text-3xl"><span>{String(metric)}</span><Icon className="h-5 w-5 text-slate-400"/></CardTitle></CardHeader></Card>)}
    </section>

    <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader><CardTitle>Recent records</CardTitle><CardDescription>Example data-driven view loaded only from the dedicated API.</CardDescription></CardHeader>
        <CardContent>
          {data.recent.length === 0 ? <p className="text-sm text-slate-500">No records yet.</p> : <div className="divide-y divide-slate-100">
            {data.recent.map((record) => <div key={record.id} className="flex items-center justify-between py-4"><div><div className="font-medium">{record.title}</div><div className="text-xs text-slate-500">{record.status} · {new Date(record.createdAt).toLocaleDateString()}</div></div><div className="font-mono text-sm">{record.value}</div></div>)}
          </div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Add a record</CardTitle><CardDescription>Proves authenticated write → API → Neon.</CardDescription></CardHeader>
        <CardContent><form onSubmit={submit} className="space-y-3"><Input required placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}/><Input type="number" min="0" placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)}/><Button className="w-full" disabled={createRecord.isPending}><Plus className="mr-2 h-4 w-4"/>Create</Button>{createRecord.isError && <p className="text-sm text-red-600">{createRecord.error.message}</p>}</form></CardContent>
      </Card>
    </section>
  </>
}

function State({ icon, title, detail }: { icon: ReactNode; title: string; detail?: string }) {
  return <div className="grid min-h-[50vh] place-items-center text-center"><div><div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-slate-100">{icon}</div><div className="font-medium">{title}</div>{detail && <div className="mt-1 max-w-md text-sm text-slate-500">{detail}</div>}</div></div>
}

export default function App() {
  return <div className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><div><div className="font-semibold">Customer Workspace</div><div className="text-xs text-slate-500">Isolated SaaS cell</div></div><div className="flex items-center gap-3"><Show when="signed-in"><OrganizationSwitcher/><UserButton/></Show><Show when="signed-out"><SignInButton><Button variant="outline">Sign in</Button></SignInButton><SignUpButton><Button>Get started</Button></SignUpButton></Show></div></div></header>
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Show when="signed-in"><Dashboard /></Show>
      <Show when="signed-out"><div className="mx-auto max-w-2xl py-24 text-center"><div className="mb-4 text-sm font-medium text-slate-500">Dedicated customer application</div><h1 className="text-4xl font-semibold tracking-tight">Sign in to access your workspace.</h1><p className="mt-4 text-slate-600">Authentication is shared through Clerk; all business data remains behind this customer's dedicated API and Neon database.</p></div></Show>
    </main>
  </div>
}
