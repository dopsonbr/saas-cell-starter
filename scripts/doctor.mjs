import fs from 'node:fs'

const checks = [
  ['Node 24.x', process.versions.node.startsWith('24.')],
  [
    'pnpm 10.25.0 lockfile',
    fs.existsSync('pnpm-lock.yaml') &&
      fs.readFileSync('package.json', 'utf8').includes('pnpm@10.25.0'),
  ],
  ['starter configuration', fs.existsSync('starter.config.json')],
  ['API environment example', fs.existsSync('apps/api/.env.example')],
  ['web environment example', fs.existsSync('apps/web/.env.example')],
  ['source-controlled migrations', fs.existsSync('packages/db/drizzle')],
]
let failed = false
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
  failed ||= !ok
}
console.log(
  'INFO Secret values are never printed. Runtime credentials are checked by the app and pnpm e2e:doctor.',
)
if (failed) process.exitCode = 1
