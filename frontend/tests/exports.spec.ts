import { test, expect } from './fixtures'

test('editor downloads PDF and JSON after saving pending edits', async ({ page, request }) => {
  const p = await (await request.get('/api/profile')).json()
  const r = await (
    await request.post('/api/resumes', {
      data: {
        name: `Export ${Date.now()}`,
        selected_ids: p.items
          .filter((i: { kind: string }) =>
            ['experience', 'education', 'skills', 'projects'].includes(i.kind)
          )
          .map((i: { id: string }) => i.id),
      },
    })
  ).json()
  await page.goto('/')
  await page.getByRole('button', { name: 'Resumes', exact: true }).click()
  await page.getByRole('button', { name: `Open ${r.name}`, exact: true }).click()
  await page.getByLabel('Resume name', { exact: true }).fill(`${r.name} Final`)
  await page.getByLabel('Export resume', { exact: true }).click()
  const pdfPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click()
  const pdf = await pdfPromise
  expect(pdf.suggestedFilename()).toBe(`${r.name} Final.pdf`)
  expect(await pdf.failure()).toBeNull()
  await page.getByLabel('Export resume', { exact: true }).click()
  const jsonPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON', exact: true }).click()
  const backup = await jsonPromise
  expect(backup.suggestedFilename()).toBe(`${r.name} Final.json`)
  const exported = await (await request.get(`/api/resumes/${r.id}/export/json`)).json()
  expect(exported.name).toBe(`${r.name} Final`)
  expect(exported.format).toBe('CareerCanvas Resume')
})
