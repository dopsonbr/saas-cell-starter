import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const value = (flag) => {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : undefined
}
const root = process.cwd()
const configPath = path.join(root, 'starter.config.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const name = value('--name')
const slug = value('--slug')
const provider = value('--ai-provider')
const force = args.includes('--force')

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (!name || !slug || !provider) {
  fail(
    'Usage: pnpm init:project -- --name "Product Name" --slug product-slug --ai-provider mock|openai|vercel-gateway [--force]',
  )
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
  fail('--slug must be lowercase kebab-case')
if (!['mock', 'openai', 'vercel-gateway'].includes(provider))
  fail('--ai-provider must be mock, openai, or vercel-gateway')
if (config.initialized && !force)
  fail(
    'This starter is already initialized. Re-run with --force to intentionally reinitialize it.',
  )

const source = {
  name: config.productName ?? 'SaaS Cell Starter',
  slug: config.slug ?? 'saas-cell-starter',
  scope: config.packageScope ?? '@starter',
  provider: config.aiProvider ?? 'mock',
}
const targetScope = `@${slug}`
const replacements = [
  [source.name, name],
  [source.slug, slug],
  [`${source.scope}/`, `${targetScope}/`],
  [`AI_PROVIDER=${source.provider}`, `AI_PROVIDER=${provider}`],
]
const ignoredDirectories = new Set([
  'node_modules',
  '.git',
  'dist',
  '.vercel',
  'coverage',
  'playwright-report',
  'test-results',
])
const candidates = []

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      if (file === path.join(root, 'docs', 'plans')) continue
      walk(file)
    } else if (
      /\.(md|json|ya?ml|toml|[cm]?[jt]sx?|css|html|example)$/.test(
        entry.name,
      ) ||
      entry.name === 'AGENTS.md'
    ) {
      candidates.push(file)
    }
  }
}

walk(root)
const changes = new Map()
for (const file of candidates) {
  const original = fs.readFileSync(file, 'utf8')
  let next = original
  for (const [from, to] of replacements) next = next.split(from).join(to)
  if (next !== original) changes.set(file, next)
}

const nextConfig = {
  ...config,
  initialized: true,
  productName: name,
  slug,
  packageScope: targetScope,
  aiProvider: provider,
}
const nextConfigText = JSON.stringify(nextConfig, null, 2).replace(
  /\[\n((?:\s+"[^"]+",?\n)+)\s+\]/g,
  (_match, body) =>
    `[${body
      .trim()
      .split('\n')
      .map((line) => line.trim().replace(/,$/, ''))
      .join(', ')}]`,
)
changes.set(configPath, `${nextConfigText}\n`)

// Preflight and stage every replacement before committing the transaction.
const staged = []
for (const [file, next] of changes) {
  const temporary = `${file}.starter-init-${process.pid}.new`
  const backup = `${file}.starter-init-${process.pid}.backup`
  fs.writeFileSync(temporary, next, { flag: 'wx' })
  staged.push({ file, temporary, backup })
}
const committed = []
try {
  for (const entry of staged) {
    fs.renameSync(entry.file, entry.backup)
    fs.renameSync(entry.temporary, entry.file)
    committed.push(entry)
  }
  for (const entry of committed) fs.unlinkSync(entry.backup)
} catch (error) {
  for (const entry of staged.reverse()) {
    if (fs.existsSync(entry.backup)) {
      if (fs.existsSync(entry.file)) fs.unlinkSync(entry.file)
      fs.renameSync(entry.backup, entry.file)
    }
  }
  for (const entry of staged) {
    if (fs.existsSync(entry.temporary)) fs.unlinkSync(entry.temporary)
  }
  throw error
}

for (const directory of ['apps/api', 'apps/web', 'apps/marketing']) {
  const example = path.join(root, directory, '.env.example')
  const local = path.join(root, directory, '.env.local')
  if (!fs.existsSync(local))
    fs.copyFileSync(example, local, fs.constants.COPYFILE_EXCL)
}

console.log(`Initialized ${name} (${slug}) with ${provider} AI.`)
console.log(`
Next steps:
1. Clerk: fill apps/api/.env.local and apps/web/.env.local; set EXPECTED_CLERK_ORG_ID.
2. Neon: set DATABASE_URL in apps/api/.env.local, then run pnpm --filter ${targetScope}/db db:migrate.
3. Development: run pnpm run doctor, then pnpm dev.
4. E2E: copy tests/e2e/.env.e2e.example to tests/e2e/.env.e2e.local, configure two Clerk users and a dedicated Neon database, set E2E_ALLOW_RESET=1, then run pnpm e2e:doctor && pnpm e2e.
5. Vercel: create separate projects rooted at apps/marketing, apps/web, and apps/api; configure the environment matrix in docs/deployment.md.
6. Pre-release: run pnpm check && pnpm verify:template, then pnpm verify:deployment with explicit preview URLs.
`)
