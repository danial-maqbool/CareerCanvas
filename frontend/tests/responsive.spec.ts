import { test, expect } from './fixtures'
for (const [width, height] of [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [1024, 768],
  [768, 1024],
  [390, 844],
])
  test(`all workspace pages fit ${width}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.setViewportSize({ width, height })
    await page.goto('/')
    for (const name of [
      'Dashboard',
      'Applications',
      'Cover Letters',
      'Skills',
      'Portfolio',
      'Interviews',
      'Career Goals',
      'Analytics',
      'Templates',
      'Settings',
    ]) {
      await page.getByRole('button', { name, exact: true }).first().click()
      await expect(
        page.getByRole('heading', {
          name: name === 'Dashboard' ? 'Your next chapter starts here.' : name,
          exact: true,
        })
      ).toBeVisible()
      await page.waitForTimeout(150)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        name
      ).toBe(true)
    }
    expect(errors).toEqual([])
  })
