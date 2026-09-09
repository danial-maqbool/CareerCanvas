import { test, expect } from './fixtures'

test('missing email triggers a strict ATS cap and fixing it improves the score', async ({
  page,
  request,
}) => {
  const profile = await (await request.get('/api/profile')).json()
  const resume = await (
    await request.post('/api/resumes', {
      data: {
        name: `ATS ${Date.now()}`,
        selected_ids: profile.items.map((item: { id: string }) => item.id),
      },
    })
  ).json()
  resume.document.personal.email = ''
  await request.put(`/api/resumes/${resume.id}`, {
    data: {
      name: resume.name,
      revision: resume.revision,
      target_role: '',
      archived: false,
      document: resume.document,
    },
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Resumes', exact: true }).click()
  await page.getByRole('button', { name: `Open ${resume.name}`, exact: true }).click()
  await page.getByRole('button', { name: 'ATS Check', exact: true }).click()
  await page.getByRole('button', { name: 'Run ATS analysis', exact: true }).click()
  await expect(page.locator('.score-ring strong')).not.toHaveText('—')
  const before = Number(await page.locator('.score-ring strong').innerText())
  expect(before).toBeLessThanOrEqual(79)
  await expect(page.locator('.ats-cap-list')).toContainText('valid visible email address is missing')
  await expect(page.locator('.ats-check').filter({ hasText: 'Visible contact email' })).toContainText(
    'HIGH'
  )

  await page.getByRole('button', { name: 'Close drawer', exact: true }).click()
  await page.getByRole('textbox', { name: /^email/i }).fill('alex.morgan@example.com')
  await page.getByRole('button', { name: 'ATS Check', exact: true }).click()
  await page.getByRole('button', { name: 'Run ATS analysis', exact: true }).click()
  await expect(page.locator('.score-ring strong')).not.toHaveText(String(before))
  const after = Number(await page.locator('.score-ring strong').innerText())
  expect(after).toBeGreaterThan(before)
  expect(after - before).toBeGreaterThanOrEqual(15)
  await expect(page.locator('.ats-category-grid')).toContainText('Parsing & contact')
  await expect(page.locator('.ats-disclaimer')).toContainText('not a score returned by a real employer ATS')
})

test('ATS-safe layout is explicit and does not change career content', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Resumes', exact: true }).click()
  const firstResume = page.locator('.resume-card').first()
  await firstResume.locator('.resume-thumbnail').click()
  const beforeName = await page.getByRole('textbox', { name: 'Resume name' }).inputValue()
  await page.getByRole('button', { name: 'ATS Check', exact: true }).click()
  await page.getByRole('button', { name: 'Apply ATS-safe layout', exact: true }).click()
  await expect(page.getByText('Content was not changed.')).toBeVisible()
  await page.getByRole('button', { name: 'Close drawer', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Resume name' })).toHaveValue(beforeName)
})
