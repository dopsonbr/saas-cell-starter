const args = process.argv.slice(2)
const value = (flag) => {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : undefined
}
const marketingUrl = value('--marketing-url')?.replace(/\/$/, '')
const webUrl = value('--web-url')?.replace(/\/$/, '')
const apiUrl = value('--api-url')?.replace(/\/$/, '')
const expectedRevision = value('--expected-revision')
if (!marketingUrl || !webUrl || !apiUrl) {
  console.error(
    'Usage: pnpm verify:deployment -- --marketing-url URL --web-url URL --api-url URL [--expected-revision SHA]',
  )
  process.exit(1)
}

for (const [label, url] of [
  ['marketing', marketingUrl],
  ['web', webUrl],
  ['API', apiUrl],
]) {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
  } catch {
    console.error(`${label} URL must be an absolute HTTP(S) URL`)
    process.exit(1)
  }
}

const failures = []
async function expectResponse(label, url, expectedStatus, init) {
  try {
    const response = await fetch(url, init)
    if (response.status !== expectedStatus)
      failures.push(
        `${label}: expected ${expectedStatus}, received ${response.status}`,
      )
    return response
  } catch (error) {
    failures.push(
      `${label}: ${error instanceof Error ? error.message : 'request failed'}`,
    )
    return null
  }
}

const origin = new URL(webUrl).origin
await expectResponse('marketing root', marketingUrl, 200)
const health = await expectResponse('API health', `${apiUrl}/health`, 200)
if (health) {
  const body = await health.json().catch(() => null)
  if (expectedRevision && body?.revision !== expectedRevision)
    failures.push('API revision does not match expected revision')
}
await expectResponse('protected API', `${apiUrl}/v1/items`, 401)
await expectResponse(
  'unknown public token',
  `${apiUrl}/public/v1/items/00000000-0000-4000-8000-000000000000`,
  404,
)
await expectResponse('nested SPA refresh', `${webUrl}/items/new`, 200)
const cors = await expectResponse(
  'exact-origin CORS',
  `${apiUrl}/health`,
  200,
  { headers: { Origin: origin, 'X-Run-Id': 'deployment-verifier' } },
)
if (cors?.headers.get('access-control-allow-origin') !== origin)
  failures.push('exact-origin CORS header is missing or incorrect')
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`)
  process.exitCode = 1
} else
  console.log(
    'PASS marketing, web, API, auth boundary, public 404, SPA refresh, CORS, and revision checks',
  )
