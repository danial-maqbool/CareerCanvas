import { test, expect } from './fixtures'

for (const [width, height] of [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [1024, 768],
  [768, 1024],
  [390, 844],
]) {
  test(`workspace shell ${width}x${height}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: 'Your next chapter starts here.' })
    ).toBeVisible()
    await page.getByRole('button', { name: 'Career Profile', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Career Profile', exact: true })).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true)
    expect(errors).toEqual([])
    await page.screenshot({
      path: `test-results/foundation-${width}.png`,
      fullPage: true,
    })
  })
}
