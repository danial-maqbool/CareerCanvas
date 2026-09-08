import { test, expect } from './fixtures'
test('first run loads a populated fictional career workspace', async ({ page, request }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Load Demo Career', exact: true }).click()
  await expect(page.locator('.notice[role=status]')).toContainText(
    'Fictional demo workspace loaded'
  )
  await expect(
    page.locator('.metric-card').filter({ hasText: 'Active resumes' }).locator('strong')
  ).toHaveText('4')
  await expect(
    page.locator('.metric-card').filter({ hasText: 'Applications' }).first().locator('strong')
  ).toHaveText('12')
  await page.getByRole('button', { name: 'Resumes', exact: true }).click()
  await expect(page.locator('.resume-card')).toHaveCount(4)
  await page.getByRole('button', { name: 'Open AI Engineer — Focused', exact: true }).click()
  await expect(page.getByLabel('Edit full name', { exact: true })).toHaveText('Alex Morgan')
  await expect(page.locator('.paginated-document')).toContainText('Northstar Labs')
  await page.getByRole('button', { name: 'Back to resumes', exact: true }).click()
  await page.getByRole('button', { name: 'Applications', exact: true }).click()
  await expect(page.locator('.job-card')).toHaveCount(12)
  expect((await request.post('/api/demo/workspace')).status()).toBe(409)
})
