import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const failures = []
const starterConfig = JSON.parse(fs.readFileSync('starter.config.json', 'utf8'))
const mustExist = [
  'pnpm-lock.yaml',
  'apps/web/vercel.json',
  'apps/api/src/index.ts',
  'apps/marketing/vercel.json',
  'packages/db/drizzle',
  'docs/plans/seamless-collaborative-ai-baseline.md',
]
for (const file of mustExist)
  if (!fs.existsSync(file)) failures.push(`missing ${file}`)
const manifests = []
function manifestsUnder(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist'].includes(entry.name)) continue
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) manifestsUnder(target)
    else if (entry.name === 'package.json') manifests.push(target)
  }
}
manifestsUnder(process.cwd())
for (const manifest of manifests) {
  const contents = fs.readFileSync(manifest, 'utf8')
  if (/:\s*"(?:latest|\^|~)/.test(contents))
    failures.push(`non-exact dependency in ${manifest}`)
}
for (const file of fs.readdirSync('apps/web/src', { recursive: true })) {
  if (typeof file !== 'string' || !/\.(ts|tsx)$/.test(file)) continue
  const contents = fs.readFileSync(path.join('apps/web/src', file), 'utf8')
  if (
    contents.includes(`${starterConfig.packageScope}/db`) ||
    contents.includes('apps/api')
  ) {
    failures.push(`browser boundary violation in apps/web/src/${file}`)
  }
  if (
    /VITE_(?:DATABASE_URL|CLERK_SECRET_KEY|CLERK_JWT_KEY|OPENAI_API_KEY|AI_GATEWAY_API_KEY|VERCEL_OIDC_TOKEN)/.test(
      contents,
    )
  ) {
    failures.push(`server-only configuration exposed in apps/web/src/${file}`)
  }
}
const uiManifest = fs.readFileSync('packages/ui/package.json', 'utf8')
if (
  uiManifest.includes('@starter/contracts') ||
  uiManifest.includes('@starter/api-client')
) {
  failures.push('packages/ui depends on a product or API package')
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'saas-cell-template-'))
try {
  fs.cpSync(process.cwd(), temp, {
    recursive: true,
    filter: (source) =>
      !['node_modules', '.git', 'dist', '.vercel'].some((part) =>
        source.split(path.sep).includes(part),
      ),
  })
  const envFile = path.join(temp, 'apps/web/.env.local')
  fs.writeFileSync(envFile, 'UNCHANGED=1\n')
  const command = [
    'scripts/init-template.mjs',
    '--name',
    'Disposable Product',
    '--slug',
    'disposable-product',
    '--ai-provider',
    'mock',
  ]
  const first = spawnSync(process.execPath, command, {
    cwd: temp,
    encoding: 'utf8',
  })
  if (first.status !== 0)
    failures.push(`initializer failed: ${first.stderr.trim()}`)
  if (fs.readFileSync(envFile, 'utf8') !== 'UNCHANGED=1\n')
    failures.push('initializer overwrote an existing environment file')
  const second = spawnSync(process.execPath, command, {
    cwd: temp,
    encoding: 'utf8',
  })
  if (second.status === 0)
    failures.push('initializer allowed a second run without --force')
  const forced = spawnSync(process.execPath, [...command, '--force'], {
    cwd: temp,
    encoding: 'utf8',
  })
  if (forced.status !== 0)
    failures.push(`forced reinitialization failed: ${forced.stderr.trim()}`)
  const initialized = JSON.parse(
    fs.readFileSync(path.join(temp, 'starter.config.json'), 'utf8'),
  )
  if (
    !initialized.initialized ||
    initialized.packageScope !== '@disposable-product'
  ) {
    failures.push('initializer did not persist its replacement sources')
  }
  const install = spawnSync(
    'corepack',
    ['pnpm', 'install', '--frozen-lockfile', '--ignore-scripts'],
    {
      cwd: temp,
      encoding: 'utf8',
      env: { ...process.env, CI: 'true' },
    },
  )
  if (install.status !== 0)
    failures.push(`disposable install failed: ${install.stderr.trim()}`)
  const check = spawnSync('corepack', ['pnpm', 'check'], {
    cwd: temp,
    encoding: 'utf8',
    env: { ...process.env, CI: 'true' },
  })
  if (check.status !== 0)
    failures.push(`disposable check failed: ${check.stderr.trim()}`)
} finally {
  fs.rmSync(temp, { recursive: true, force: true })
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`)
  process.exitCode = 1
} else
  console.log(
    'PASS disposable initialization, exact dependencies, environment non-overwrite, and required packaging files',
  )
