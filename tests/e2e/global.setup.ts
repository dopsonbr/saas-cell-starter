import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { clerk, clerkSetup } from '@clerk/testing/playwright'
import { expect, test as setup } from '@playwright/test'

const here = path.dirname(fileURLToPath(import.meta.url))
const authDirectory = path.join(here, 'playwright/.auth')
setup.describe.configure({ mode: 'serial' })

setup('configure Clerk testing', async () => {
  if (!process.env.CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY)
    throw new Error('E2E requires Clerk test credentials')
  await clerkSetup()
  await fs.mkdir(authDirectory, { recursive: true })
})

for (const identity of [
  {
    label: 'expected',
    emailKey: 'E2E_EXPECTED_CLERK_USER_EMAIL',
    orgKey: 'EXPECTED_CLERK_ORG_ID',
  },
  {
    label: 'wrong',
    emailKey: 'E2E_WRONG_CLERK_USER_EMAIL',
    orgKey: 'E2E_WRONG_CLERK_ORG_ID',
  },
]) {
  setup(
    `authenticate ${identity.label} organization user`,
    async ({ page }) => {
      const email = process.env[identity.emailKey]
      const orgId = process.env[identity.orgKey]
      if (!email || !orgId)
        throw new Error(
          `E2E requires ${identity.emailKey} and ${identity.orgKey}`,
        )
      await page.goto('/')
      await clerk.loaded({ page })
      await clerk.signIn({ page, emailAddress: email })
      await page.evaluate(async (organization) => {
        const client = (
          window as unknown as {
            Clerk?: {
              setActive: (input: { organization: string }) => Promise<void>
            }
          }
        ).Clerk
        if (!client) throw new Error('Clerk did not load')
        await client.setActive({ organization })
      }, orgId)
      await page.reload()
      if (identity.label === 'expected') {
        await expect(page.getByText('Content library')).toBeVisible()
      } else {
        await expect(
          page.getByText('The content workspace is unavailable'),
        ).toBeVisible()
      }
      await page.context().storageState({
        path: path.join(authDirectory, `${identity.label}.json`),
      })
    },
  )
}
