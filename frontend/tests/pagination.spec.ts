import { test, expect } from './fixtures'

test('real page boundaries retain long experience bullets without blank pages', async ({
  page,
  request,
}) => {
  const p = await (await request.get('/api/profile')).json()
  const r = await (
    await request.post('/api/resumes', {
      data: {
        name: `Long pagination ${Date.now()}`,
        template: 'Academic',
        selected_ids: p.items
          .filter((i: { kind: string }) => i.kind === 'experience')
          .map((i: { id: string }) => i.id),
      },
    })
  ).json()
  const experience = r.document.sections.find((s: { kind: string }) => s.kind === 'experience')
  experience.items[0].data.bullets = Array.from({ length: 35 }, (_, i) => ({
    id: `long-${i}`,
    text: `Achievement ${i + 1}: Developed reliable services and reviewed production metrics to improve response times for three engineering teams.`,
  }))
  await request.put(`/api/resumes/${r.id}`, {
    data: {
      name: r.name,
      revision: r.revision,
      target_role: r.target_role,
      archived: false,
      document: r.document,
    },
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Resumes', exact: true }).click()
  await page.getByRole('button', { name: `Open ${r.name}`, exact: true }).click()
  await expect(page.locator('.paginated-document')).toHaveAttribute('data-pagination-ready', 'true')
  expect(await page.locator('.paper-page').count()).toBeGreaterThan(1)
  for (const heading of await page.locator('.paginated-document .section-experience h2').all())
    await expect(heading).toHaveText('II. Experience')
  for (let i = 1; i <= 35; i++)
    await expect(page.locator('.paginated-document')).toContainText(`Achievement ${i}:`)
  const heights = await page
    .locator('.paper-page>.resume-paper')
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).offsetHeight))
  expect(heights.every((h) => h <= 1124)).toBe(true)
  for (const paper of await page.locator('.paper-page>.resume-paper').all())
    expect((await paper.innerText()).trim().length).toBeGreaterThan(30)
  await page.getByRole('button', { name: 'Design', exact: true }).click()
  await page.getByRole('combobox', { name: 'Paper size', exact: true }).selectOption('Letter')
  await expect(page.locator('.paginated-document')).toHaveAttribute('data-pagination-ready', 'true')
  const letter = await page
    .locator('.paper-page>.resume-paper')
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).offsetHeight))
  expect(letter.every((h) => h <= 1057)).toBe(true)
  await page.getByRole('button', { name: 'Fit to one page · adjust spacing', exact: true }).click()
  await expect(page.locator('.pagination-status')).toContainText('nothing was removed')
  await expect
    .poll(async () => {
      const saved = await (await request.get('/api/resumes/' + r.id)).json()
      return saved.document.style.font_size
    })
    .toBe(10)
  const saved = await (await request.get('/api/resumes/' + r.id)).json()
  expect(saved.document.sections).toEqual(r.document.sections)
})
