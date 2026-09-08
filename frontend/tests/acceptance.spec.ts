import { test, expect } from './fixtures'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
test('complete career journey survives a server restart', async ({ page, request, server }) => {
  test.setTimeout(180000)
  await page.goto('/')
  await page.getByRole('button', { name: 'Load Demo Career', exact: true }).click()
  await expect(page.locator('.notice[role=status]')).toContainText(
    'Fictional demo workspace loaded'
  )
  await page.getByRole('button', { name: 'Career Profile', exact: true }).click()
  await page.getByRole('tab', { name: 'Experience' }).click()
  await page.getByRole('button', { name: 'Edit AI Software Engineer', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Description', exact: true })
    .fill('Building dependable AI systems with a cross-functional product team.')
  await page.getByRole('button', { name: 'Save to profile', exact: true }).click()
  async function quick(name: string) {
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.locator('.quick-add summary').click()
    await page.locator('.quick-add').getByRole('button', { name, exact: true }).click()
  }
  await quick('Skill')
  await page.getByRole('textbox', { name: 'Skill name *' }).fill('Observability')
  await page.getByRole('button', { name: 'Save to profile', exact: true }).click()
  await quick('Project')
  await page
    .getByRole('textbox', { name: 'Project name *' })
    .fill('Acceptance Evaluation Workbench')
  await page
    .getByRole('textbox', { name: 'Description', exact: true })
    .fill('A fictional evaluation project for this acceptance workflow.')
  await page.getByRole('button', { name: 'Save to profile', exact: true }).click()
  await quick('Achievement')
  await page
    .getByRole('textbox', { name: 'Achievement statement *' })
    .fill('Developed 14 REST endpoints used by three internal services.')
  await page.getByRole('button', { name: 'Save to profile', exact: true }).click()
  await quick('Resume')
  await page.getByRole('textbox', { name: 'Resume name *' }).fill('Acceptance AI Engineer')
  await page.getByRole('textbox', { name: 'Target role', exact: true }).fill('AI Engineer')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Preview Classic with my data', exact: true }).click()
  await page.getByRole('button', { name: 'Apply Classic', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Create resume', exact: true }).last().click()
  await page.getByLabel('Edit full name', { exact: true }).fill('Alex Acceptance Morgan')
  await page.getByRole('button', { name: '02 Summary', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Professional summary', exact: true })
    .fill('AI software engineer building reliable Python and retrieval evaluation systems.')
  await page.locator('.section-select').filter({ hasText: 'Experience' }).click()
  await page.getByRole('button', { name: 'Edit bullets', exact: true }).first().click()
  await page.getByRole('button', { name: 'Add bullet', exact: true }).click()
  const bullets = page.getByRole('textbox', { name: /^Bullet [0-9]+$/ })
  const count = await bullets.count()
  await bullets.last().fill('Improved service reliability by adding repeatable evaluation checks.')
  await page.getByRole('button', { name: `Move bullet ${count} up`, exact: true }).click()
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.getByRole('button', { name: 'Move Projects up', exact: true }).click()
  await page.getByRole('button', { name: 'Move Projects up', exact: true }).click()
  await page.getByRole('button', { name: 'Hide Certifications', exact: true }).click()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  const getResume = async () => {
    const rows = await (await request.get('/api/resumes')).json()
    return rows.find((r: any) => r.name === 'Acceptance AI Engineer')
  }
  await expect.poll(async () => (await getResume()).document.sections[0].kind).toBe('projects')
  let resume = await getResume()
  const content = resume.document.sections
  await page.getByRole('button', { name: 'Template', exact: true }).click()
  await page
    .getByRole('button', {
      name: 'Preview Technical with my data',
      exact: true,
    })
    .click()
  await page.getByRole('button', { name: 'Apply Technical', exact: true }).click()
  await expect.poll(async () => (await getResume()).document.template).toBe('Technical')
  expect((await getResume()).document.sections).toEqual(content)
  await page.getByRole('button', { name: 'Design', exact: true }).click()
  await page.getByRole('combobox', { name: 'Font family', exact: true }).selectOption('Georgia')
  await page.getByLabel('Section spacing', { exact: true }).fill('10')
  await page.getByLabel('Primary color', { exact: true }).fill('#234567')
  await page.getByRole('combobox', { name: 'Preview zoom' }).selectOption('50')
  await expect(page.locator('.page-number').first()).toContainText('Page 1')
  await page.getByRole('button', { name: '01 Personal details', exact: true }).click()
  await page.getByRole('textbox', { name: /^email/i }).fill('')
  await page.getByRole('button', { name: 'ATS Check', exact: true }).click()
  await page.getByRole('button', { name: 'Run ATS analysis', exact: true }).click()
  await expect(page.locator('.score-ring strong')).not.toHaveText('—')
  const score = Number(await page.locator('.score-ring strong').innerText())
  await page.getByRole('button', { name: 'Close drawer', exact: true }).click()
  await page.getByRole('textbox', { name: /^email/i }).fill('alex.morgan@example.com')
  await page.getByRole('button', { name: 'ATS Check', exact: true }).click()
  await page.getByRole('button', { name: 'Run ATS analysis', exact: true }).click()
  await expect(page.locator('.score-ring strong')).toHaveText(String(score + 15))
  await page.getByRole('button', { name: 'Close drawer', exact: true }).click()
  const folder = mkdtempSync(join(tmpdir(), 'careercanvas-acceptance-'))
  for (const format of ['PDF', 'DOCX']) {
    await page.getByLabel('Export resume', { exact: true }).click()
    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download ' + format, exact: true }).click()
    const download = await pending
    await download.saveAs(join(folder, 'resume.' + format.toLowerCase()))
  }
  const python = resolve(
    '..',
    '.venv',
    process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'
  )
  const validation = execFileSync(
    python,
    [
      '-c',
      `import sys,json;from pypdf import PdfReader;from docx import Document;from pathlib import Path;p=Path(sys.argv[1]);pdf=PdfReader(p/'resume.pdf');text='\\n'.join(x.extract_text() for x in pdf.pages);doc=Document(p/'resume.docx');assert 'Alex Acceptance Morgan' in text;assert 'Acceptance Evaluation Workbench' in text;assert any('Experience' in x.text for x in doc.paragraphs);assert any('Alex Acceptance Morgan' in x.text for x in doc.paragraphs);uris=[str(a.get_object().get('/A',{}).get('/URI','')) for page in pdf.pages for a in page.get('/Annots',[])];assert 'mailto:alex.morgan@example.com' in uris;print(json.dumps({'pdf_pages':len(pdf.pages),'docx_paragraphs':len(doc.paragraphs)}))`,
      folder,
    ],
    { encoding: 'utf-8' }
  )
  expect(JSON.parse(validation).pdf_pages).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Versions', exact: true }).click()
  await page.getByRole('textbox', { name: 'Version note', exact: true }).fill('Acceptance v1')
  await page.getByRole('button', { name: 'Create version', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'v1', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close drawer', exact: true }).click()
  await page.getByRole('button', { name: '02 Summary', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Professional summary', exact: true })
    .fill('A deliberately modified second draft.')
  await page.getByRole('button', { name: 'Versions', exact: true }).click()
  await page.getByRole('button', { name: 'Create version', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'v2', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Compare versions', exact: true }).click()
  await expect(page.locator('.diff-card').first()).toBeVisible()
  await page
    .locator('.version-entry')
    .filter({ has: page.getByRole('heading', { name: 'v1', exact: true }) })
    .getByRole('button', { name: 'Restore this version', exact: true })
    .click()
  await page.getByRole('button', { name: 'Restore version', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'v3', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close drawer', exact: true }).click()
  resume = await getResume()
  await page.getByRole('button', { name: 'Job Match', exact: true }).click()
  await page
    .getByRole('button', {
      name: 'Use fictional AI Engineer example',
      exact: true,
    })
    .click()
  await page.getByRole('button', { name: 'Analyze job match', exact: true }).click()
  await expect(page.locator('.missing-skill').filter({ hasText: 'Kubernetes' })).toBeVisible()
  await page
    .getByRole('checkbox', {
      name: 'I reviewed this selection and want a new resume copy.',
      exact: true,
    })
    .check()
  await page.getByRole('button', { name: 'Create tailored resume copy', exact: true }).click()
  await expect(page.getByLabel('Resume name', { exact: true })).toHaveValue(
    'Acceptance AI Engineer — Tailored'
  )
  expect((await getResume()).document).toEqual(resume.document)
  await page.getByRole('button', { name: 'Back to resumes', exact: true }).click()
  await quick('Job Application')
  await page.getByRole('textbox', { name: 'Company', exact: true }).fill('Acceptance Cedar')
  await page.getByRole('textbox', { name: 'Role', exact: true }).fill('AI Engineer')
  await page.getByRole('button', { name: 'Job Description', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Job description', exact: true })
    .fill('AI Engineer with Python, FastAPI and Kubernetes experience.')
  await page.getByRole('button', { name: 'Save application', exact: true }).click()
  await page.getByRole('button', { name: 'Applications', exact: true }).click()
  for (const stage of ['Applied', 'Interview']) {
    await page
      .getByRole('button', {
        name: 'Acceptance Cedar AI Engineer',
        exact: true,
      })
      .click()
    await page.getByRole('combobox', { name: 'Application stage' }).selectOption(stage)
    await page.getByRole('button', { name: 'Save application', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
  await quick('Interview')
  await page
    .getByRole('textbox', { name: 'Interview title' })
    .fill('Acceptance technical interview')
  await page.getByRole('checkbox', { name: 'Research company', exact: true }).check()
  await page.getByRole('button', { name: 'Save interview', exact: true }).click()
  await quick('Goal')
  await page.getByRole('textbox', { name: 'Career goal title' }).fill('Acceptance career goal')
  await page.getByRole('spinbutton', { name: 'progress', exact: true }).fill('25')
  await page.getByRole('button', { name: 'Save career goal', exact: true }).click()
  await page.getByRole('button', { name: 'Cover Letters', exact: true }).click()
  await page.getByRole('button', { name: 'Create cover letter', exact: true }).click()
  await page.getByRole('textbox', { name: 'Letter name' }).fill('Acceptance introduction')
  await page
    .getByRole('textbox', { name: 'opening', exact: true })
    .fill('I build dependable AI systems.')
  await page.getByRole('button', { name: 'Save letter', exact: true }).click()
  await page.getByRole('button', { name: 'Close drawer', exact: true }).click()
  await page.getByRole('button', { name: 'Analytics', exact: true }).click()
  const analytics = await (await request.get('/api/analytics')).json()
  await expect(
    page.locator('.metric-card').filter({ hasText: 'Applications sent' }).locator('strong')
  ).toHaveText(String(analytics.sent))
  await page.keyboard.press('Control+k')
  await page
    .getByRole('textbox', { name: 'Search workspace and commands' })
    .fill('Acceptance AI Engineer')
  await expect(
    page.getByRole('dialog').getByRole('button', {
      name: 'Acceptance AI Engineer AI Engineer',
      exact: true,
    })
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await server.restart()
  await page.reload()
  await page.getByRole('button', { name: 'Resumes', exact: true }).click()
  await page.getByRole('button', { name: 'Open Acceptance AI Engineer', exact: true }).click()
  await expect(page.getByLabel('Edit full name', { exact: true })).toHaveText(
    'Alex Acceptance Morgan'
  )
  const final = await getResume()
  expect(final.document.sections[0].kind).toBe('projects')
  expect(final.document.sections.find((s: any) => s.kind === 'certifications').visible).toBe(false)
  expect(
    (await (await request.get('/api/career/goals')).json()).some(
      (g: any) => g.title === 'Acceptance career goal'
    )
  ).toBe(true)
})
