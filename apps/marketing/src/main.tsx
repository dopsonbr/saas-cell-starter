import { Card, CardContent } from '@starter/ui/components/card'
import {
  ArrowRight,
  Database,
  Gauge,
  LockKeyhole,
  type LucideIcon,
  Network,
  ShieldCheck,
} from 'lucide-react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const appUrl = import.meta.env.VITE_APP_URL || '#'
const features: Array<[LucideIcon, string, string]> = [
  [
    ShieldCheck,
    'Isolated by design',
    'Each customer runs on a dedicated application and database boundary.',
  ],
  [
    Gauge,
    'Built for real workflows',
    'Data-driven views surface the operational signals users actually need.',
  ],
  [
    Network,
    'Simple integrations',
    'A stable HTTP API keeps product integrations explicit and portable.',
  ],
]

function App() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-white">
            S
          </div>
          <span>Your Product</span>
        </div>
        <a
          href={appUrl}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Sign in
        </a>
      </nav>
      <main>
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-24">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
              <LockKeyhole className="h-4 w-4" /> Secure B2B SaaS, without
              tenancy gymnastics
            </div>
            <h1 className="text-5xl font-semibold tracking-[-0.04em] sm:text-7xl">
              Turn operational data into decisions your team can act on.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              Replace this with your product's sharpest jobs-to-be-done
              statement. The starter gives you the secure application
              foundation; this page should explain the customer outcome.
            </p>
            <div className="mt-9 flex gap-3">
              <a
                href={appUrl}
                className="inline-flex items-center rounded-md bg-slate-950 px-5 py-3 text-sm font-medium text-white"
              >
                Open app <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a
                href="#how"
                className="rounded-md border border-slate-200 px-5 py-3 text-sm font-medium"
              >
                See how it works
              </a>
            </div>
          </div>
        </section>
        <section id="how" className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-6xl gap-5 px-6 py-20 md:grid-cols-3">
            {features.map(([Icon, title, text]) => (
              <Card key={String(title)} className="rounded-2xl">
                <CardContent className="p-7">
                  <Icon className="mb-5 h-6 w-6" />
                  <h2 className="text-lg font-semibold">{String(title)}</h2>
                  <p className="mt-2 leading-7 text-slate-600">
                    {String(text)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="text-sm font-semibold text-slate-500">
                Architecture that earns trust
              </div>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                One customer. One application cell.
              </h2>
              <p className="mt-5 leading-8 text-slate-600">
                Your product story should lead. But when buyers care about
                security, the architecture is easy to explain: dedicated
                frontend, dedicated API, dedicated Neon database, with Clerk
                identity and shared operational telemetry.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-sm text-slate-300 shadow-xl">
              <div className="space-y-3 font-mono">
                <div className="rounded-lg bg-white/10 p-4">React SPA</div>
                <div className="pl-8">↓ HTTPS + Clerk JWT</div>
                <div className="rounded-lg bg-white/10 p-4">
                  Dedicated Hono API
                </div>
                <div className="pl-8">↓ private database credential</div>
                <div className="flex items-center gap-3 rounded-lg bg-white/10 p-4">
                  <Database className="h-4 w-4" /> Dedicated Neon Postgres
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-slate-500">
          <span>© Your Product</span>
          <span>Built from the SaaS Cell Starter</span>
        </div>
      </footer>
    </div>
  )
}
const root = document.getElementById('root')
if (!root) throw new Error('Missing application root')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
