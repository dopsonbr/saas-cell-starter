import { expect, test } from '@playwright/test'

test('signed-out visitor sees the authentication boundary', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', {
      name: 'Collaborative content, in your customer cell.',
    }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
})

test('malformed public token renders a revoked-safe state', async ({
  page,
}) => {
  await page.goto('/share/not-a-token')
  await expect(page.getByText('This share is unavailable')).toBeVisible()
})
