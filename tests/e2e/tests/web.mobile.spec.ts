import { expect, test } from '@playwright/test'

test('dashboard and editor remain usable on mobile', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Content library' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'New item' }).click()
  await expect(page.getByLabel('Title')).toBeVisible()
  await expect(page.getByText('Content collaborator')).toBeVisible()
  expect(
    await page
      .locator('body')
      .evaluate((body) => body.scrollWidth <= window.innerWidth),
  ).toBe(true)
})
