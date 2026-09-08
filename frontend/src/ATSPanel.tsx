import { useState } from 'react'
import { Check, CircleAlert, ScanText, ShieldCheck } from 'lucide-react'
import { api, json } from './api'
import { Drawer } from './Profile'
import { flushSave, useEditor } from './editor-store'
import { paginateDocument } from './pagination'

type Result = {
  score: number
  page_count: number
  columns: number
  disclaimer: string
  checks: {
    key: string
    label: string
    weight: number
    passed: boolean
    severity: string
    message: string
  }[]
}
export default function ATSPanel({ onClose }: { onClose: () => void }) {
  const [result, setResult] = useState<Result | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  async function run() {
    setBusy(true)
    try {
      await flushSave()
      const r = useEditor.getState().resume!
      const pages = paginateDocument(r.document).pages.length
      setResult(await api<Result>(`/resumes/${r.id}/ats`, json('POST', { page_count: pages })))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Drawer title="Ready for the next step?" wide onClose={onClose}>
      <div className="ats-workspace">
        <section className="ats-overview">
          <span className="pill">
            <ShieldCheck size={13} />
            TRANSPARENT BY DESIGN
          </span>
          <h2>ATS readiness</h2>
          <p>A practical check of the structure and readability of your document.</p>
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
          <h3>
            {result
              ? result.score >= 85
                ? 'A strong foundation.'
                : 'A little room to improve.'
              : 'Let’s check your resume.'}
          </h3>
          <p className="ats-disclaimer">
            CareerCanvas-specific heuristic. This is not a score from an employer’s ATS and does not
            predict hiring outcomes.
          </p>
          <button className="button primary" disabled={busy} onClick={run}>
            <ScanText size={15} />
            {busy ? 'Analyzing…' : result ? 'Run again' : 'Run ATS analysis'}
          </button>
          {result && (
            <div className="ats-stats">
              <span>{result.page_count} pages</span>
              <span>
                {result.columns} column{result.columns > 1 ? 's' : ''}
              </span>
              <span>{result.checks.filter((c) => c.passed).length}/11 checks</span>
            </div>
          )}
        </section>
        <section className="ats-checks">
          <div className="comparison-heading">
            <div>
              <h3>Clarity makes a difference.</h3>
              <p>Every check is deterministic, with a visible scoring weight.</p>
            </div>
          </div>
          {result ? (
            result.checks.map((check) => (
              <article
                className={`ats-check ${check.passed ? 'check-passed' : ''}`}
                key={check.key}
              >
                <span className="check-icon">
                  {check.passed ? <Check size={17} /> : <CircleAlert size={17} />}
                </span>
                <div>
                  <h4>
                    {check.label}
                    <span>{check.passed ? 'PASS' : check.severity}</span>
                  </h4>
                  {!check.passed && <p>{check.message}</p>}
                  <small>
                    {check.passed ? check.weight : 0} / {check.weight} points
                  </small>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <ScanText size={35} />
              <p>
                Check contact information, headings, reading order, typography, and page count. Your
                data stays on this device.
              </p>
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
