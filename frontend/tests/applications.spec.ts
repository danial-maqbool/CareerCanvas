import { test, expect } from './fixtures'
test('kanban drag and keyboard stage selection persist timeline', async ({ page, request }) => {
  const row = await (
    await request.post('/api/applications', {
      data: { company: 'Kanban Cedar', role: 'AI Engineer' },
    })
  ).json()
  await page.goto('/')
  await page.getByRole('button', { name: 'Applications', exact: true }).click()
  const handle = page.getByRole('button', { name: 'Drag Kanban Cedar' })
  const from = await handle.boundingBox(),
    to = await page.locator('[data-stage="Applied"]').boundingBox()
  await page.mouse.move(from!.x + 5, from!.y + 5)
  await page.mouse.down()
  await page.mouse.move(from!.x + 15, from!.y + 15, { steps: 4 })
  await page.mouse.move(to!.x + 100, to!.y + 100, { steps: 15 })
  await page.mouse.up()
  await expect(page.locator('[data-stage="Applied"]')).toContainText('Kanban Cedar')
  await page
    .locator('[data-stage="Applied"]')
    .getByRole('button', { name: 'Kanban Cedar AI Engineer' })
    .click()
  await page.getByRole('combobox', { name: 'Application stage' }).selectOption('Interview')
  await page.getByRole('button', { name: 'Save application', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Applications', exact: true }).click()
  await expect(page.locator('[data-stage="Interview"]')).toContainText('Kanban Cedar')
  const history = await (await request.get(`/api/applications/${row.id}/history`)).json()
  expect(history.map((h: { stage: string }) => h.stage)).toEqual([
    'Interested',
    'Applied',
    'Interview',
  ])
  await request.delete(`/api/applications/${row.id}`)
})
