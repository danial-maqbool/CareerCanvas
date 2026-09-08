import { chromium, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// Only run against the explicit fictional demo workspace, never personal data.
const baseURL = process.env.CAREERCANVAS_SCREENSHOT_URL || 'http://127.0.0.1:8000'
const profile = await (await fetch(`${baseURL}/api/profile`)).json()
const resumes = await (await fetch(`${baseURL}/api/resumes`)).json()
const jobs = await (await fetch(`${baseURL}/api/applications`)).json()
if (
  profile.personal.full_name !== 'Alex Morgan' ||
  resumes.length !== 4 ||
  jobs.length !== 12 ||
  jobs.some((j) => !j.company.includes('(fictional)'))
) {
  throw new Error('Screenshot capture requires the untouched fictional demo workspace.')
}
const directory = fileURLToPath(new URL('../../docs/screenshots/', import.meta.url))
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({
  baseURL,
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
})
page.setDefaultTimeout(15000)
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
const button = (name) => page.getByRole('button', { name, exact: true })
const capture = async (name) => {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(450) // Let chart and drawer entrance animations finish.
  await page.screenshot({ path: `${directory}/${name}.png`, animations: 'disabled' })
  console.log(`Captured ${name}`)
}
try {
  await page.goto('/')
  await button('Resumes').click()
  await button('Open AI Engineer — Focused').click()
  await expect(page.locator('[data-pagination-ready=true]')).toBeVisible()
  await capture('resume_editor')
  await button('ATS Check').click()
  await button('Run ATS analysis').click()
  await expect(page.locator('.score-ring strong')).not.toHaveText('—')
  await capture('ats_analysis')
  await button('Close drawer').click()
  await button('Job Match').click()
  await button('Use fictional AI Engineer example').click()
  await button('Analyze job match').click()
  await expect(page.locator('.missing-skill').filter({ hasText: 'Kubernetes' })).toBeVisible()
  await capture('job_match')
  await button('Close drawer').click()
  await button('Versions').click()
  await button('Compare versions').click()
  await expect(page.locator('.diff-card').first()).toBeVisible()
  await capture('version_comparison')
  await button('Close drawer').click()
  await button('Back to resumes').click()
  await capture('resume_library')
  await button('Dashboard').click()
  await expect(page.locator('.metric-card').first()).toBeVisible()
  await capture('dashboard')
  await button('Templates').click()
  await capture('template_gallery')
  await button('Career Profile').click()
  await page.getByRole('tab', { name: /^Experience/ }).click()
  await capture('career_profile')
  await button('Applications').click()
  await expect(page.locator('.job-card')).toHaveCount(12)
  await capture('application_kanban')
  await page
    .locator('.job-card')
    .filter({ hasText: 'Cedar' })
    .getByRole('button')
    .filter({ hasText: 'Cedar' })
    .click()
  await capture('job_detail')
  await button('Close drawer').click()
  await button('Interviews').click()
  await page
    .locator('.record-card')
    .filter({ hasText: 'Cedar' })
    .getByRole('button', { name: 'Prepare for interview' })
    .click()
  await page.locator('.prep-layout').scrollIntoViewIfNeeded()
  await capture('interview_prep')
  await button('Close drawer').click()
  await button('Analytics').click()
  await capture('career_analytics')
  if (errors.length) throw new Error(errors.join('\n'))
  console.log('All 12 screenshots captured; no browser console errors.')
} finally {
  await browser.close()
}
