import { useState } from 'react'
import {
  AlertTriangle,
  Check,
  CircleAlert,
  ScanText,
  ShieldCheck,
  WandSparkles,
} from 'lucide-react'
import { api, json } from './api'
import { Drawer } from './Profile'
import { flushSave, useEditor } from './editor-store'
import { paginateDocument } from './pagination'

type CheckResult = {
  key: string
  label: string
  weight: number
  earned: number
  passed: boolean
  status: 'PASS' | 'WARN' | 'FAIL'
  severity: string
  message: string
  detail?: string
  category: string
}

type Result = {
  score: number
  raw_score: number
  page_count: number
  columns: number
  check_count: number
  disclaimer: string
  score_caps: { cap: number; reason: string }[]
  categories: Record<
    string,
    { label: string; earned: number; possible: number; score: number }
  >
  checks: CheckResult[]
}

const headings: Record<string, string> = {
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  publications: 'Publications',
  achievements: 'Achievements',
  languages: 'Languages',
  references: 'References',
  portfolio: 'Portfolio',
}

function verdict(score: number) {
  if (score >= 90) return ['Excellent ATS foundation', 'Only small refinements remain.']
  if (score >= 80) return ['Strong, but review the warnings', 'Fix the remaining medium-risk issues before sending.']
  if (score >= 70) return ['Usable, but not ready yet', 'Several issues can reduce parser reliability or recruiter scanability.']
  return ['Needs revision before sending', 'Resolve critical structure, contact, or content issues first.']
}

function readCachedResult(): Result | null {
  if (typeof window === 'undefined') return null
  try {
    const resumeId = useEditor.getState().resume?.id
    if (!resumeId) return null
    const raw = window.sessionStorage.getItem(`careercanvas:ats:${resumeId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Result
    return typeof parsed?.score === 'number' && Array.isArray(parsed?.checks) ? parsed : null
  } catch {
    return null
  }
}

function cacheResult(resumeId: string, result: Result) {
  try {
    window.sessionStorage.setItem(`careercanvas:ats:${resumeId}`, JSON.stringify(result))
  } catch {
    /* Session cache is a UI convenience only. */
  }
}

export default function ATSPanel({ onClose }: { onClose: () => void }) {
  const [initialCache] = useState(() => {
    const result = readCachedResult()
    return { result, stale: Boolean(result) }
  })
  const [result, setResult] = useState<Result | null>(initialCache.result)
  const [stale, setStale] = useState(initialCache.stale)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const change = useEditor((state) => state.change)

  async function run() {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await flushSave()
      const resume = useEditor.getState().resume!
      const pages = paginateDocument(resume.document).pages.length
      const next = await api<Result>(
        `/resumes/${resume.id}/ats`,
        json('POST', { page_count: pages })
      )
      setResult(next)
      setStale(false)
      cacheResult(resume.id, next)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function applySafeLayout() {
    change((resume) => {
      const doc = resume.document
      if (['Two Column', 'Creative', 'Executive'].includes(doc.template)) doc.template = 'Professional'
      doc.style.font_size = Math.max(10.5, doc.style.font_size)
      doc.style.line_height = Math.max(1.25, doc.style.line_height)
      doc.style.margin = Math.max(12, Math.min(20, doc.style.margin))
      for (const section of doc.sections) {
        section.columns = 1
        if (headings[section.kind]) section.heading = headings[section.kind]
      }
    })
    setStale(Boolean(result))
    setNotice(
      'Applied ATS-safe layout settings: single-column sections, standard headings, readable type, and conservative spacing. Content was not changed. Run the analysis again to refresh the score.'
    )
  }

  const verdictText = result ? verdict(result.score) : ['Checking resume…', '']

  return (
    <Drawer title="ATS review" wide onClose={onClose}>
      <div className="ats-workspace ats-workspace-v2">
        <section className="ats-overview">
          <span className="pill">
            <ShieldCheck size={13} />
            STRICTER, EXPLAINABLE SCORING
          </span>
          <h2>ATS readiness</h2>
          <p>
            CareerCanvas checks parser safety, contact data, content evidence, achievement quality,
            dates, typography, page count, and text density.
          </p>
          <div
            className="score-ring"
            style={
              {
                '--score-angle': `${(result?.score || 0) * 3.6}deg`,
              } as React.CSSProperties
            }
          >
            <div>
              <strong>{result ? result.score : '—'}</strong>
              <span>OUT OF 100</span>
            </div>
          </div>
          {stale && result && (
            <p className="ats-stale-note" role="status">
              Previous result shown. Run ATS analysis to refresh it after your latest edits.
            </p>
          )}
          <h3>{verdictText[0]}</h3>
          <p>{verdictText[1]}</p>
          {result && result.raw_score !== result.score && (
            <p className="ats-score-cap-note">
              Raw weighted score: {result.raw_score}. A critical-readiness cap reduced the final score.
            </p>
          )}
          <p className="ats-disclaimer">{result?.disclaimer || 'CareerCanvas-specific heuristic.'}</p>
          <div className="ats-primary-actions">
            <button className="button primary" disabled={busy} onClick={run}>
              <ScanText size={15} />
              {busy ? 'Analyzing…' : stale || !result ? 'Run ATS analysis' : 'Run again'}
            </button>
            <button className="button secondary" onClick={applySafeLayout}>
              <WandSparkles size={15} /> Apply ATS-safe layout
            </button>
          </div>
          <small className="ats-action-explainer">
            ATS-safe layout changes formatting only. It does not rewrite, add, or remove career facts.
          </small>
          {notice && <p className="notice">{notice}</p>}
          {result && (
            <div className="ats-stats">
              <span>{result.page_count} pages</span>
              <span>
                {result.columns} column{result.columns > 1 ? 's' : ''}
              </span>
              <span>
                {result.checks.filter((check) => check.status === 'PASS').length}/{result.check_count}{' '}
                full passes
              </span>
            </div>
          )}
        </section>

        <section className="ats-checks">
          {result && (
            <>
              <div className="comparison-heading">
                <div>
                  <h3>Score breakdown</h3>
                  <p>Partial credit is visible. Critical failures can cap the final score.</p>
                </div>
              </div>
              <div className="ats-category-grid">
                {Object.entries(result.categories).map(([key, category]) => (
                  <article className="ats-category-card" key={key}>
                    <div>
                      <strong>{category.label}</strong>
                      <span>{category.score}%</span>
                    </div>
                    <div className="ats-progress-track">
                      <i style={{ width: `${category.score}%` }} />
                    </div>
                    <small>
                      {category.earned} / {category.possible} points
                    </small>
                  </article>
                ))}
              </div>
              {result.score_caps.length > 0 && (
                <div className="ats-cap-list">
                  <strong>
                    <AlertTriangle size={15} /> Critical score caps
                  </strong>
                  {result.score_caps.map((cap) => (
                    <p key={`${cap.cap}-${cap.reason}`}>
                      Maximum {cap.cap}: {cap.reason}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="comparison-heading">
            <div>
              <h3>Detailed checks</h3>
              <p>Each item shows the score contribution and the reason for the result.</p>
            </div>
          </div>
          {result ? (
            result.checks.map((check) => (
              <article
                className={`ats-check ${check.status === 'PASS' ? 'check-passed' : check.status === 'WARN' ? 'check-warning' : ''}`}
                key={check.key}
              >
                <span className="check-icon">
                  {check.status === 'PASS' ? <Check size={17} /> : <CircleAlert size={17} />}
                </span>
                <div>
                  <h4>
                    {check.label}
                    <span>{check.status === 'PASS' ? 'PASS' : check.status === 'WARN' ? 'PARTIAL' : check.severity}</span>
                  </h4>
                  {check.detail && <p className="ats-check-detail">{check.detail}</p>}
                  {check.status !== 'PASS' && <p>{check.message}</p>}
                  <small>
                    {check.earned} / {check.weight} points
                  </small>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <ScanText size={35} />
              <p>Run the analysis to see parser safety, content quality, and readability checks. No external AI is used for this score.</p>
            </div>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>
      </div>
    </Drawer>
  )
}
