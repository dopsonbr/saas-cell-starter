import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

const here = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(here, '.env.e2e.local') })

const webUrl = process.env.E2E_WEB_URL ?? 'http://localhost:5173'
const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3001'
const authFile = path.join(here, 'playwright/.auth/user.json')

export default defineConfig({
  testDir: here,
  outputDir: path.join(here, 'playwright/test-results'),
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: webUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'pnpm --filter @starter/api dev:e2e',
      cwd: path.resolve(here, '../..'),
      url: `${apiUrl}/health`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter @starter/web dev',
      cwd: path.resolve(here, '../..'),
      url: webUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'api',
      testMatch: /tests\/api\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome']!,
        storageState: authFile,
      },
    },
    {
      name: 'web-authenticated',
      testMatch: /tests\/web\.authenticated\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome']!,
        storageState: authFile,
      },
    },
    {
      name: 'web-signed-out',
      testMatch: /tests\/web\.signed-out\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome']!,
        storageState: { cookies: [], origins: [] },
      },
    },
  ],
})
