import { test, expect } from './fixtures'

const resume = `Alex Morgan
AI Engineer
alex.morgan@example.com
+1 555 123 4567
https://github.com/alexmorgan
Seattle, USA

Professional Summary
AI engineer focused on reliable production systems.

Experience
AI Engineer | Acme Systems
Jan 2024 - Present
Built FastAPI services used by three internal products.

Education
Example University
MS Artificial Intelligence
2022 - 2024

Technical Skills
Python, FastAPI, SQL, Docker

Projects
CareerCanvas
Built a local-first resume and career workspace.
`

test('first run resume import fills profile and direct ATS can create an editable resume', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Import Resume', exact: true }).click()
  await page.getByLabel('Choose resume file').setInputFiles({
    name: 'standard_resume.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(resume),
  })
  await expect(page.getByRole('heading', { name: 'Review before import' })).toBeVisible()
  await expect(page.locator('input[value="Alex Morgan"]')).toBeVisible()
  await expect(page.getByText('Python', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Apply to Career Profile' }).click()
  await expect(page.getByText(/Applied to Career Profile/)).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).click()

  await page.getByRole('button', { name: 'Career Profile' }).click()
  await expect(page.getByRole('heading', { name: 'Alex Morgan' })).toBeVisible()

  await page.getByRole('button', { name: 'Resumes' }).click()
  await page.getByRole('button', { name: 'Upload Resume for ATS Review' }).click()
  await page.getByLabel('Choose resume file').setInputFiles({
    name: 'standard_resume.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(resume),
  })
  await expect(page.getByText('Contact email present')).toBeVisible()
  await expect(page.getByText('Contact phone present')).toBeVisible()
  await page.getByRole('button', { name: 'Extracted Text' }).click()
  await expect(page.getByText(/AI engineer focused on reliable production systems/)).toBeVisible()
  await page.getByRole('button', { name: 'ATS Review' }).click()
  await page.getByRole('button', { name: 'Create CareerCanvas Resume' }).click()
  await expect(page.getByLabel('Resume name')).toHaveValue('standard_resume')
})
