import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

const here = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(here, '.env.e2e.local') })
const deployed = Boolean(process.env.E2E_WEB_URL && process.env.E2E_API_URL)
const webUrl = process.env.E2E_WEB_URL ?? 'http://localhost:5177'
const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3101'
const root = path.resolve(here, '../..')
const expectedAuth = path.join(here, 'playwright/.auth/expected.json')
const wrongAuth = path.join(here, 'playwright/.auth/wrong.json')

if (!deployed) {
  process.env.DATABASE_URL = process.env.E2E_DATABASE_URL
  process.env.FRONTEND_URL = webUrl
  process.env.VITE_API_URL = apiUrl
}

export default defineConfig({
  testDir: here,
  outputDir: path.join(here, 'playwright/test-results'),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: webUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  ...(deployed
    ? {}
    : {
        webServer: [
          {
            command: 'pnpm --filter @starter/api dev:e2e',
            cwd: root,
            url: `${apiUrl}/health`,
            reuseExistingServer: process.env.E2E_REUSE_SERVERS === '1',
            timeout: 120_000,
          },
          {
            command: 'pnpm --filter @starter/web dev:e2e',
            cwd: root,
            url: webUrl,
            reuseExistingServer: process.env.E2E_REUSE_SERVERS === '1',
            timeout: 120_000,
          },
        ],
      }),
  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    {
      name: 'web-authenticated',
      testMatch: /tests\/web\.authenticated\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: expectedAuth },
    },
    {
      name: 'web-mobile',
      testMatch: /tests\/web\.mobile\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['iPhone 13'], storageState: expectedAuth },
    },
    {
      name: 'web-signed-out',
      testMatch: /tests\/web\.signed-out\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
    },
    {
      name: 'api',
      testMatch: /tests\/api\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: expectedAuth },
    },
  ],
})

export { apiUrl, expectedAuth, wrongAuth }
