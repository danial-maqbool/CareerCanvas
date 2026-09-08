import { test, expect } from './fixtures'

test('career profile CRUD survives a reload and demo refuses overwrite', async ({
  page,
  request,
}) => {
  const health = await request.get('/api/health')
  expect(health.ok()).toBeTruthy()
  await page.goto('/')
  await page.getByRole('button', { name: 'Career Profile', exact: true }).click()
  await page.getByLabel('full name', { exact: true }).fill('Fictional Test Engineer')
  await page.getByRole('button', { name: 'Save personal details' }).click()
  await expect(page.getByRole('status')).toContainText('Profile saved')
  await page.getByRole('tab', { name: 'Experience' }).click()
  await page.getByRole('button', { name: 'Add Experience', exact: true }).click()
  await page.getByLabel('Position').fill('Platform Engineer')
  await page.getByLabel('Company *', { exact: true }).fill('Fictional Test Company')
  await page
    .getByLabel('Achievement bullets')
    .fill('Developed 14 APIs used by three teams.\nReduced query latency by 25%.')
  await page.getByRole('button', { name: 'Save to profile' }).click()
  await expect(page.getByRole('heading', { name: 'Platform Engineer' })).toBeVisible()
  await page.getByRole('button', { name: 'Edit Platform Engineer' }).click()
  await page.getByLabel('Position').fill('Senior Platform Engineer')
  await page.getByRole('button', { name: 'Save to profile' }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Career Profile', exact: true }).click()
  await page.getByRole('tab', { name: 'Experience' }).click()
  await expect(page.getByRole('heading', { name: 'Senior Platform Engineer' })).toBeVisible()
  expect((await request.post('/api/demo/profile')).status()).toBe(409)
  await page.getByRole('button', { name: 'Delete Senior Platform Engineer' }).click()
  await page.getByRole('button', { name: 'Delete item', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Senior Platform Engineer' })).toHaveCount(0)
})
