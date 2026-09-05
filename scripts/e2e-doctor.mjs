import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'dotenv'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const file = path.join(root, 'tests/e2e/.env.e2e.local')
const values = fs.existsSync(file) ? parse(fs.readFileSync(file)) : {}
const required = [
  'CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'VITE_CLERK_PUBLISHABLE_KEY',
  'EXPECTED_CLERK_ORG_ID',
  'E2E_EXPECTED_CLERK_USER_EMAIL',
  'E2E_WRONG_CLERK_USER_EMAIL',
  'E2E_WRONG_CLERK_ORG_ID',
  'E2E_DATABASE_URL',
]
let failed = false
for (const key of required) {
  const ok = Boolean(values[key] ?? process.env[key])
  console.log(`${ok ? 'PASS' : 'FAIL'} ${key}`)
  failed ||= !ok
}
const resetAllowed =
  (values.E2E_ALLOW_RESET ?? process.env.E2E_ALLOW_RESET) === '1'
console.log(`${resetAllowed ? 'PASS' : 'FAIL'} E2E_ALLOW_RESET=1`)
failed ||= !resetAllowed
console.log(
  'INFO Values are present or absent only; credentials are never printed.',
)
if (failed) process.exitCode = 1
