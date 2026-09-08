import { test, expect } from './fixtures'

test('create, name, duplicate, rename, archive and delete independent resumes', async ({
  page,
  request,
}) => {
  await request.post('/api/demo/profile')
  const name = `AI Engineer ${Date.now()}`
  await page.goto('/')
  await page.getByRole('button', { name: 'Resumes', exact: true }).click()
  await page.getByRole('button', { name: 'Create resume', exact: true }).first().click()
  await page.getByLabel('Resume name').fill(name)
  await page.getByLabel('Target role').fill('AI Engineer')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Create resume', exact: true }).last().click()
  await page.getByRole('button', { name: 'Back to resumes', exact: true }).click()
  const card = page
    .locator('.resume-card')
    .filter({ has: page.getByRole('heading', { name, exact: true }) })
  await card.locator('summary').click()
  await card.getByRole('button', { name: 'Duplicate', exact: true }).click()
  const copy = page.locator('.resume-card').filter({
    has: page.getByRole('heading', { name: `${name} (copy)`, exact: true }),
  })
  await copy.locator('summary').click()
  await copy.getByRole('button', { name: 'Rename', exact: true }).click()
  await page.getByLabel('Resume name', { exact: true }).fill(`${name} Research`)
  await page.getByRole('button', { name: 'Save name', exact: true }).click()
  const renamed = page.locator('.resume-card').filter({
    has: page.getByRole('heading', { name: `${name} Research`, exact: true }),
  })
  await renamed.locator('summary').click()
  await renamed.getByRole('button', { name: 'Archive', exact: true }).click()
  await expect(renamed).toHaveCount(0)
  await expect(card).toBeVisible()
  await page.getByRole('button', { name: 'Archived', exact: true }).click()
  await renamed.locator('summary').click()
  await renamed.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('button', { name: 'Delete resume', exact: true }).click()
  await expect(renamed).toHaveCount(0)
  await page.reload()
  await page.getByRole('button', { name: 'Resumes', exact: true }).click()
  await expect(card).toBeVisible()
})
