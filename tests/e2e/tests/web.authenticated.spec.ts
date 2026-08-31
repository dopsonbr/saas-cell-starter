import { expect, test } from '@playwright/test'

test('signed-in customer can read and write through the dedicated API', async ({ page }) => {
  const title = `E2E record ${Date.now()}`

  await page.goto('/')
  await expect(page.getByText('Recent records')).toBeVisible()

  await page.getByPlaceholder('Title').fill(title)
  await page.getByPlaceholder('Value').fill('42')
  await page.getByRole('button', { name: 'Create' }).click()

  await expect(page.getByText(title)).toBeVisible()
})
