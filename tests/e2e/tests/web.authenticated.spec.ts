import { expect, test } from '@playwright/test'

test('member creates, collaborates, persists, publishes, and revokes', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Content library' }),
  ).toBeVisible()
  await expect(page.getByText('No content yet')).toBeVisible()
  await page.getByRole('link', { name: 'New item' }).click()
  await expect(page.getByText('Loading collaborator…')).toBeVisible()
  await page.getByLabel('Title').fill('E2E content guide')
  await page
    .getByLabel('Body')
    .fill('An initial draft that remains local until save.')
  await page.getByLabel('Tags').fill('e2e, guide')
  await page.getByRole('button', { name: 'Improve title' }).click()
  await expect(page.getByText('Suggested edit')).toBeVisible()
  await expect(page.locator('body')).not.toContainText('{"reply"')
  await page.getByRole('button', { name: 'Apply', exact: true }).first().click()
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.getByText('draft', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Body')).toHaveValue(
    'An initial draft that remains local until save.',
  )
  await page
    .getByLabel('Body')
    .fill('Edited content visible after a hard refresh.')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Changes saved.')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Body')).toHaveValue(
    'Edited content visible after a hard refresh.',
  )
  await page.getByRole('button', { name: 'Publish share link' }).click()
  await expect(
    page.getByRole('link', { name: 'Open public page' }),
  ).toBeVisible()
  const publicUrl = await page
    .getByRole('link', { name: 'Open public page' })
    .getAttribute('href')
  expect(publicUrl).toBeTruthy()
  if (!publicUrl) throw new Error('Public share URL was not rendered')
  const publicPage = await page.context().newPage()
  await publicPage.goto(publicUrl)
  await expect(
    publicPage.getByText('Edited content visible after a hard refresh.'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Revoke link' }).click()
  await publicPage.reload()
  await expect(publicPage.getByText('This share is unavailable')).toBeVisible()
})

test('loading and error states are visible without losing the workspace', async ({
  page,
}) => {
  await page.route('**/v1/items', async (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Synthetic failure' }),
    }),
  )
  await page.goto('/')
  await expect(
    page.getByText('The content workspace is unavailable'),
  ).toBeVisible()
})

test('archived content is terminal and read-only', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Edited content visible after a hard refresh.').click()
  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Archive' }).click()
  await page.getByLabel('Filter content by status').selectOption('archived')
  await page.getByText('Edited content visible after a hard refresh.').click()
  await expect(page.getByText('Archived items are read-only')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Save changes' }),
  ).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Publish share link' }),
  ).toBeDisabled()
})
