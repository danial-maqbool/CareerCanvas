import { test, expect } from './fixtures'

test('pointer section drag and keyboard bullet drag persist after reload', async ({
  page,
  request,
}) => {
  const profile = await (await request.get('/api/profile')).json()
  const resume = await (
    await request.post('/api/resumes', {
      data: {
        name: `Drag test ${Date.now()}`,
        selected_ids: profile.items.map((i: { id: string }) => i.id),
      },
    })
  ).json()
  await page.goto('/')
  await page.getByRole('button', { name: 'Resumes', exact: true }).click()
  await page.getByRole('button', { name: `Open ${resume.name}`, exact: true }).click()
  const projects = await page
    .getByRole('button', { name: 'Drag Projects section', exact: true })
    .boundingBox()
  const experience = await page
    .getByRole('button', { name: 'Drag Experience section', exact: true })
    .boundingBox()
  await page.mouse.move(projects!.x + 7, projects!.y + 7)
  await page.mouse.down()
  await page.mouse.move(projects!.x + 7, projects!.y - 5, { steps: 3 })
  await page.mouse.move(experience!.x + 7, experience!.y + 3, { steps: 20 })
  await page.mouse.up()
  await expect
    .poll(async () => {
      const r = await (await request.get(`/api/resumes/${resume.id}`)).json()
      return r.document.sections[0].kind
    })
    .toBe('projects')
  await page.locator('.section-select').filter({ hasText: 'Experience' }).click()
  await page.getByRole('button', { name: 'Edit bullets', exact: true }).first().click()
  const first = await page.getByRole('textbox', { name: 'Bullet 1', exact: true }).inputValue()
  const second = await page.getByRole('textbox', { name: 'Bullet 2', exact: true }).inputValue()
  await page.getByRole('button', { name: 'Drag bullet 1', exact: true }).focus()
  await page.keyboard.press('Space')
  await expect(page.locator('.drawer .sortable-row.dragging')).toHaveCount(1)
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  )
  await page.keyboard.press('ArrowDown')
  const secondId = resume.document.sections.find((s: { kind: string }) => s.kind === 'experience')
    .items[0].data.bullets[1].id
  await expect(page.locator('.drawer [role="status"]').last()).toContainText(
    `over droppable area ${secondId}`
  )
  await page.keyboard.press('Space')
  await expect(page.getByRole('textbox', { name: 'Bullet 1', exact: true })).toHaveValue(second)
  await expect(page.getByRole('textbox', { name: 'Bullet 2', exact: true })).toHaveValue(first)
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.getByRole('button', { name: 'Back to resumes', exact: true }).click()
  // Navigation completes only after the editor flushes its pending save.
  await expect(page.getByRole('heading', { name: 'Resumes', exact: true })).toBeVisible()
  const saved = await (await request.get(`/api/resumes/${resume.id}`)).json()
  expect(
    saved.document.sections.find((s: { kind: string }) => s.kind === 'experience').items[0].data
      .bullets[0].text
  ).toBe(second)
  await page.reload()
  await page.getByRole('button', { name: 'Resumes', exact: true }).click()
  await page.getByRole('button', { name: `Open ${resume.name}`, exact: true }).click()
  await expect(page.locator('.section-select').first()).toContainText('Projects')
})
