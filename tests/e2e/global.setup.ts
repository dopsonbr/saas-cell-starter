import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { clerk, clerkSetup } from '@clerk/testing/playwright'
import { expect, test as setup } from '@playwright/test'

const here = path.dirname(fileURLToPath(import.meta.url))
const authFile = path.join(here, 'playwright/.auth/user.json')
const expectedOrgId = process.env.EXPECTED_CLERK_ORG_ID
const emailAddress = process.env.E2E_CLERK_USER_EMAIL

setup.describe.configure({ mode: 'serial' })

setup('configure Clerk testing', async () => {
  if (!process.env.CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    throw new Error('E2E requires CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY')
  }
  await clerkSetup()
})

setup('authenticate the synthetic customer user', async ({ page }) => {
  if (!expectedOrgId) throw new Error('E2E requires EXPECTED_CLERK_ORG_ID')
  if (!emailAddress) throw new Error('E2E requires E2E_CLERK_USER_EMAIL')

  await page.goto('/')
  await clerk.loaded({ page })
  await clerk.signIn({ page, emailAddress })
  await page.evaluate(async (orgId) => {
    const clerkClient = (window as unknown as {
      Clerk?: { setActive: (input: { organization: string }) => Promise<void> }
    }).Clerk
    if (!clerkClient) throw new Error('Clerk did not load in the browser')
    await clerkClient.setActive({ organization: orgId })
  }, expectedOrgId)

  await page.reload()
  await expect(page.getByText('Recent records')).toBeVisible()
  await fs.mkdir(path.dirname(authFile), { recursive: true })
  await page.context().storageState({ path: authFile })
})
