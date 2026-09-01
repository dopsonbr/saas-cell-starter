import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const file = path.join(root, 'tests/e2e/.env.e2e.local')
const configured = fs.existsSync(file) ? parse(fs.readFileSync(file)) : {}
const env = { ...process.env, ...configured }
if (!env.E2E_DATABASE_URL) throw new Error('E2E_DATABASE_URL is required')
if (env.E2E_ALLOW_RESET !== '1')
  throw new Error('Refusing to reset E2E data without E2E_ALLOW_RESET=1')
const result = spawnSync(
  'corepack',
  ['pnpm', '--filter', '@starter/db', 'db:e2e:reset'],
  { cwd: root, env, stdio: 'inherit' },
)
if (result.status !== 0) process.exit(result.status ?? 1)
