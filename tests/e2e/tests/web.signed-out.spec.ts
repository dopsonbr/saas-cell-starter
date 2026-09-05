import { expect, test } from '@playwright/test'

test('signed-out visitor sees the authentication boundary', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Sign in to access your workspace.' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
})
