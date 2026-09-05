import {
  AuthProvider,
  OrganizationSwitcher,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from '@starter/auth/react'
import { Button } from '@starter/ui/components/button'
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { Layers3, LoaderCircle } from 'lucide-react'
import { DashboardPage } from './pages/DashboardPage'
import { EditItemPage, NewItemPage } from './pages/ItemEditorPage'
import { SharedItemPage } from './pages/SharedItemPage'

function SignedOutWelcome() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f5ff] px-6 py-16">
      <div className="max-w-xl text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-600 text-white shadow-xl shadow-violet-200">
          <Layers3 className="h-8 w-8" />
        </span>
        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.24em] text-violet-600">
          Content Cell
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Collaborative content, in your customer cell.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Sign in to draft, review, publish, and revoke content with a
          mock-first AI collaborator.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <SignInButton mode="modal">
            <Button size="lg">Sign in</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="lg" variant="outline">
              Create account
            </Button>
          </SignUpButton>
        </div>
      </div>
    </main>
  )
}

function WorkspaceContent() {
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded)
    return (
      <div className="grid min-h-screen place-items-center">
        <LoaderCircle
          aria-label="Loading"
          className="h-8 w-8 animate-spin text-violet-600"
        />
      </div>
    )
  if (!isSignedIn) return <SignedOutWelcome />
  return (
    <div className="min-h-screen bg-[#f8f7fb] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-3"
            aria-label="Content Cell dashboard"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white">
              <Layers3 className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-bold">Content Cell</span>
              <span className="block text-xs text-slate-500">
                Collaborative workspace
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <OrganizationSwitcher
              hidePersonal
              appearance={{ elements: { rootBox: 'hidden sm:block' } }}
            />
            <UserButton />
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  )
}

function WorkspaceLayout() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  if (!publishableKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
  return (
    <AuthProvider publishableKey={publishableKey}>
      <WorkspaceContent />
    </AuthProvider>
  )
}

const rootRoute = createRootRoute({ component: Outlet })
const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'workspace',
  component: WorkspaceLayout,
})
const dashboardRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/',
  component: DashboardPage,
})
const newItemRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/items/new',
  component: NewItemPage,
})
const editItemRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/items/$itemId',
  component: EditItemPage,
})
const sharedItemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/share/$shareToken',
  component: SharedItemPage,
})
const routeTree = rootRoute.addChildren([
  workspaceRoute.addChildren([dashboardRoute, newItemRoute, editItemRoute]),
  sharedItemRoute,
])
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default function App() {
  return <RouterProvider router={router} />
}
