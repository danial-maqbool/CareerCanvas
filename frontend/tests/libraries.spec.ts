import { test, expect } from './fixtures'
test('skills filters and visual portfolio', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Skills', exact: true }).click()
  await page.getByRole('textbox', { name: 'Search career content' }).fill('Python')
  await expect(page.locator('.kind-skills')).toHaveCount(1)
  await expect(page.locator('.kind-skills')).toContainText('Python')
  await page.getByRole('button', { name: 'Portfolio', exact: true }).click()
  await expect(page.locator('.portfolio-art').first()).toBeVisible()
  await page.getByRole('combobox', { name: 'Filter category' }).selectOption('Project')
  await expect(page.locator('.kind-portfolio').first()).toBeVisible()
})
