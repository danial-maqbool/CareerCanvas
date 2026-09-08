import { test, expect } from './fixtures'

test('all templates preview real content and switching preserves the document', async ({
  page,
  request,
}) => {
  const profile = await (await request.get('/api/profile')).json()
  const resume = await (
    await request.post('/api/resumes', {
      data: {
        name: `Templates ${Date.now()}`,
        selected_ids: profile.items.map((i: { id: string }) => i.id),
      },
    })
  ).json()
  await page.goto('/')
  await page.getByRole('button', { name: 'Resumes', exact: true }).click()
  await page.getByRole('button', { name: `Open ${resume.name}`, exact: true }).click()
  for (const template of ['Classic', 'Technical', 'Modern']) {
    await page.getByRole('button', { name: 'Template', exact: true }).click()
    await page
      .getByRole('button', {
        name: `Preview ${template} with my data`,
        exact: true,
      })
      .click()
    await expect(page.locator('dialog').last().locator('.resume-paper')).toContainText(
      'Alex Morgan'
    )
    await page.getByRole('button', { name: `Apply ${template}`, exact: true }).click()
    await expect
      .poll(async () => {
        const r = await (await request.get(`/api/resumes/${resume.id}`)).json()
        return r.document.template
      })
      .toBe(template)
  }
  const saved = await (await request.get(`/api/resumes/${resume.id}`)).json()
  expect(saved.document.sections).toEqual(resume.document.sections)
  expect(saved.document.personal).toEqual(resume.document.personal)
  await page.getByRole('button', { name: 'Back to resumes', exact: true }).click()
  await page.getByRole('button', { name: 'Templates', exact: true }).click()
  await expect(page.locator('.template-card')).toHaveCount(12)
  await page.getByRole('button', { name: 'Academic', exact: true }).click()
  await expect(page.locator('.template-card')).toHaveCount(2)
  await page.getByRole('button', { name: 'All templates', exact: true }).click()
  await page.screenshot({
    path: 'test-results/template-gallery.png',
    fullPage: true,
  })
})
