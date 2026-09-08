import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  FileSearch,
  FileText,
  Link as LinkIcon,
  LoaderCircle,
  ScanSearch,
  Upload,
  X,
} from 'lucide-react'
import { api, json } from './api'
import { Resume } from './resume-types'
import './resume-import.css'

type FieldCandidate = {
  value: string
  confidence: number
  source: string
  existing?: string
  conflict?: boolean
}

type ImportCandidate = {
  temp_id: string
  kind: string
  data: Record<string, unknown>
  confidence: number
  source: string
  duplicate?: { id: string; title: string; score: number } | null
}

type AtsCheck = {
  key: string
  label: string
  weight: number
  passed: boolean
  severity: string
  message: string
  earned: number
}

type ImportPreview = {
  filename: string
  document: {
    format: string
    page_count: number
    text_characters: number
    image_count: number
    link_count: number
    links: string[]
    table_count: number
    table_text_ratio: number
    scanned: boolean
    likely_multi_column: boolean
  }
  personal: Record<string, FieldCandidate>
  items: ImportCandidate[]
  detected_sections: string[]
  warnings: string[]
  extracted_text: string
  ats: {
    score: number
    checks: AtsCheck[]
    page_count: number
    columns: number
    detected_sections: string[]
    not_detected: string[]
    warnings: string[]
    disclaimer: string
  }
}

type ItemState = ImportCandidate & {
  selected: boolean
  duplicate_action: 'keep' | 'replace' | 'merge' | 'new'
}

type ApplyResult = {
  personal_added: number
  personal_updated: number
  items_added: number
  items_updated: number
  items_skipped: number
  selected_ids: string[]
}

const kindLabels: Record<string, string> = {
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  achievements: 'Achievements',
  publications: 'Publications',
  languages: 'Languages',
  portfolio: 'Portfolio',
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function titleFor(item: ImportCandidate) {
  const keys = ['name', 'position', 'institution', 'statement', 'title', 'language']
  return String(keys.map((key) => item.data[key]).find(Boolean) || kindLabels[item.kind] || item.kind)
}

function editableValue(value: unknown) {
  if (Array.isArray(value)) {
    if (value.every((entry) => typeof entry === 'object' && entry && 'text' in entry))
      return value.map((entry: { text?: string }) => entry.text || '').join('\n')
    return value.join(', ')
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return value == null ? '' : String(value)
}

function parsedValue(original: unknown, value: string) {
  if (typeof original === 'boolean') return value === 'true'
  if (Array.isArray(original)) {
    if (original.every((entry) => typeof entry === 'object' && entry && 'text' in entry)) {
      return value
        .split('\n')
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text, index) => ({
          id:
            typeof original[index] === 'object' && original[index] && 'id' in original[index]
              ? String((original[index] as { id?: string }).id || crypto.randomUUID())
              : crypto.randomUUID(),
          text,
        }))
    }
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return value
}

export default function ResumeImport({
  mode,
  onClose,
  onChanged,
  onCreated,
}: {
  mode: 'profile' | 'ats'
  onClose: () => void
  onChanged: (message: string) => void
  onCreated: (resume: Resume) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [items, setItems] = useState<ItemState[]>([])
  const [personal, setPersonal] = useState<Record<string, FieldCandidate>>({})
  const [personalSelected, setPersonalSelected] = useState<Record<string, boolean>>({})
  const [tab, setTab] = useState<'profile' | 'ats' | 'text'>(mode)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ApplyResult | null>(null)

  useEffect(() => {
    dialog.current?.showModal()
    return () => dialog.current?.close()
  }, [])

  const grouped = useMemo(() => {
    const groups: Record<string, ItemState[]> = {}
    for (const item of items) (groups[item.kind] ||= []).push(item)
    return groups
  }, [items])

  async function loadFile(file: File) {
    setError('')
    setResult(null)
    if (!/\.(pdf|docx|txt)$/i.test(file.name)) {
      setError('Choose a PDF, DOCX, or TXT resume.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Resume files are limited to 8 MB.')
      return
    }
    setBusy(true)
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const data = await api<ImportPreview>(
        '/import/preview',
        json('POST', { filename: file.name, content_base64: bytesToBase64(bytes) })
      )
      setPreview(data)
      setPersonal(data.personal)
      setPersonalSelected(
        Object.fromEntries(Object.entries(data.personal).map(([key, field]) => [key, !field.conflict]))
      )
      setItems(
        data.items.map((item) => ({
          ...item,
          selected: true,
          duplicate_action: item.duplicate ? 'keep' : 'new',
        }))
      )
      setTab(mode)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function setItem(tempId: string, update: Partial<ItemState>) {
    setResult(null)
    setItems((current) => current.map((item) => (item.temp_id === tempId ? { ...item, ...update } : item)))
  }

  function updateItemField(tempId: string, key: string, value: string) {
    setResult(null)
    setItems((current) =>
      current.map((item) =>
        item.temp_id === tempId
          ? { ...item, data: { ...item.data, [key]: parsedValue(item.data[key], value) } }
          : item
      )
    )
  }

  function updatePersonalSelection(next: Record<string, boolean>) {
    setResult(null)
    setPersonalSelected(next)
  }

  function updatePersonal(key: string, field: FieldCandidate, value: string) {
    setResult(null)
    setPersonal((current) => ({ ...current, [key]: { ...field, value } }))
  }

  async function applyImport() {
    if (result) return result
    if (!preview) throw new Error('Upload a resume first.')
    const response = await api<ApplyResult>(
      '/import/apply',
      json('POST', {
        filename: preview.filename,
        personal: Object.fromEntries(Object.entries(personal).map(([key, field]) => [key, field.value])),
        personal_selected: personalSelected,
        items: items.map((item) => ({
          temp_id: item.temp_id,
          kind: item.kind,
          data: item.data,
          selected: item.selected,
          duplicate_id: item.duplicate?.id || null,
          duplicate_action: item.duplicate_action,
        })),
      })
    )
    setResult(response)
    onChanged(
      `Resume imported: ${response.items_added} added, ${response.items_updated} updated, ${response.items_skipped} skipped.`
    )
    return response
  }

  async function createResume() {
    setBusy(true)
    setError('')
    try {
      const applied = await applyImport()
      const base = (preview?.filename || 'Imported Resume').replace(/\.(pdf|docx|txt)$/i, '')
      const resume = await api<Resume>(
        '/resumes',
        json('POST', {
          name: base,
          purpose: 'Imported Resume',
          target_role: personal.professional_title?.value || '',
          template: 'Modern',
          selected_ids: applied.selected_ids,
        })
      )
      onCreated(resume)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function confirmProfile() {
    setBusy(true)
    setError('')
    try {
      await applyImport()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={dialog}
      className="resume-import-dialog"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose()
      }}
    >
      <div className="resume-import-shell">
        <header className="resume-import-header">
          <div>
            <span className="eyebrow">LOCAL RESUME INTELLIGENCE</span>
            <h2>{mode === 'ats' ? 'Review an existing resume' : 'Import your career history'}</h2>
            <p>
              PDF, DOCX, or TXT. CareerCanvas processes the file locally and asks before changing your profile.
            </p>
          </div>
          <button className="icon-button" aria-label="Close resume import" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        {!preview ? (
          <section className="resume-drop-panel">
            <div className="resume-drop-icon">
              {mode === 'ats' ? <ScanSearch size={34} /> : <Upload size={34} />}
            </div>
            <h3>{mode === 'ats' ? 'Upload a resume for ATS review' : 'Upload a resume to fill your Career Profile'}</h3>
            <p>Files stay on this device. External AI is not required for this workflow.</p>
            <label className="button primary resume-file-button">
              <Upload size={16} /> Choose resume
              <input
                aria-label="Choose resume file"
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                hidden
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void loadFile(file)
                  event.currentTarget.value = ''
                }}
              />
            </label>
            <div className="resume-format-row">
              <span>PDF</span><span>DOCX</span><span>TXT</span><small>Maximum 8 MB</small>
            </div>
            {busy && <p className="resume-processing"><LoaderCircle className="spin" size={18} /> Reading resume…</p>}
          </section>
        ) : (
          <>
            <section className="resume-file-summary">
              <div className="resume-file-name">
                <FileText size={20} />
                <div>
                  <strong>{preview.filename}</strong>
                  <span>
                    {preview.document.format} · {preview.document.page_count} page{preview.document.page_count === 1 ? '' : 's'} · {preview.document.text_characters.toLocaleString()} readable characters
                  </span>
                </div>
              </div>
              <div className="resume-file-metrics">
                <span>{preview.detected_sections.length} sections</span>
                <span>{items.length} profile items</span>
                <span className={preview.document.scanned ? 'warn' : ''}>
                  {preview.document.scanned ? 'Image-based warning' : 'Selectable text detected'}
                </span>
              </div>
              <label className="text-action resume-replace-file">
                Replace file
                <input
                  aria-label="Replace resume file"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void loadFile(file)
                    event.currentTarget.value = ''
                  }}
                />
              </label>
            </section>

            {[...new Set([...preview.warnings, ...preview.ats.warnings])].map((warning) => (
              <p className="resume-warning" key={warning}>
                <AlertTriangle size={16} /> {warning}
              </p>
            ))}

            <nav className="resume-import-tabs" aria-label="Resume import review sections">
              <button className={tab === 'ats' ? 'active' : ''} onClick={() => setTab('ats')}>
                <ScanSearch size={16} /> ATS Review
              </button>
              <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
                <Upload size={16} /> Career Profile
              </button>
              <button className={tab === 'text' ? 'active' : ''} onClick={() => setTab('text')}>
                <FileSearch size={16} /> Extracted Text
              </button>
            </nav>

            {tab === 'ats' && (
              <section className="resume-ats-grid">
                <aside className="resume-score-card">
                  <span>ATS READINESS</span>
                  <strong>{preview.ats.score}</strong>
                  <small>/ 100</small>
                  <p>{preview.ats.disclaimer}</p>
                  <div className="resume-detected-tags">
                    {preview.ats.detected_sections.map((section) => <span key={section}>{kindLabels[section] || section}</span>)}
                  </div>
                </aside>
                <div className="resume-ats-checks">
                  <h3>Document checks</h3>
                  {preview.ats.checks.map((check) => (
                    <article className={check.passed ? 'ats-pass' : 'ats-fail'} key={check.key}>
                      <span className="ats-check-icon">{check.passed ? <Check size={16} /> : <AlertTriangle size={16} />}</span>
                      <div>
                        <strong>{check.label}</strong>
                        <p>{check.passed ? `Passed · ${check.weight} points` : `${check.severity} · ${check.message}`}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="resume-document-inspector panel">
                  <h3>Document structure</h3>
                  <dl>
                    <div><dt>Pages</dt><dd>{preview.document.page_count}</dd></div>
                    <div><dt>Images</dt><dd>{preview.document.image_count}</dd></div>
                    <div><dt>Links</dt><dd>{preview.document.link_count}</dd></div>
                    <div><dt>Tables</dt><dd>{preview.document.table_count}</dd></div>
                    <div><dt>Reading order</dt><dd>{preview.document.likely_multi_column ? 'Potentially complex' : 'Simple'}</dd></div>
                  </dl>
                  {preview.document.links.length > 0 && (
                    <div className="resume-link-list">
                      <strong>Detected links</strong>
                      {preview.document.links.map((link) => (
                        <a href={link} target="_blank" rel="noreferrer" key={link}>
                          <LinkIcon size={13} /> {link}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {tab === 'profile' && (
              <section className="resume-profile-review">
                <div className="resume-review-toolbar">
                  <div>
                    <h3>Review before import</h3>
                    <p>Nothing changes until you approve it. Conflicts are not selected by default.</p>
                  </div>
                  <div>
                    <button
                      className="text-action"
                      onClick={() => {
                        setResult(null)
                        updatePersonalSelection(Object.fromEntries(Object.keys(personal).map((key) => [key, true])))
                        setItems((current) => current.map((item) => ({ ...item, selected: true })))
                      }}
                    >
                      Select all
                    </button>
                    <button
                      className="text-action"
                      onClick={() => {
                        setResult(null)
                        updatePersonalSelection(Object.fromEntries(Object.keys(personal).map((key) => [key, false])))
                        setItems((current) => current.map((item) => ({ ...item, selected: false })))
                      }}
                    >
                      Deselect all
                    </button>
                  </div>
                </div>

                {Object.keys(personal).length > 0 && (
                  <div className="resume-review-section">
                    <h4>Personal information</h4>
                    <div className="resume-personal-grid">
                      {Object.entries(personal).map(([key, field]) => (
                        <label className={`resume-personal-field ${field.conflict ? 'has-conflict' : ''}`} key={key}>
                          <span className="resume-import-check">
                            <input
                              type="checkbox"
                              checked={!!personalSelected[key]}
                              onChange={(event) =>
                                updatePersonalSelection({ ...personalSelected, [key]: event.target.checked })
                              }
                            />
                            {key.replaceAll('_', ' ')}
                          </span>
                          <input
                            value={field.value}
                            onChange={(event) => updatePersonal(key, field, event.target.value)}
                          />
                          <small>Confidence {Math.round(field.confidence * 100)}% · {field.source}</small>
                          {field.conflict && <em>Existing value: {field.existing}</em>}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {Object.entries(grouped).map(([kind, group]) => (
                  <div className="resume-review-section" key={kind}>
                    <h4>{kindLabels[kind] || kind} <span>{group.length}</span></h4>
                    <div className="resume-import-items">
                      {group.map((item) => (
                        <article className={`resume-import-item ${item.duplicate ? 'duplicate' : ''}`} key={item.temp_id}>
                          <div className="resume-import-item-top">
                            <label className="resume-import-check">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={(event) => setItem(item.temp_id, { selected: event.target.checked })}
                              />
                              <strong>{titleFor(item)}</strong>
                            </label>
                            <span className="confidence-pill">{Math.round(item.confidence * 100)}%</span>
                          </div>
                          <p>{item.source}</p>
                          {item.duplicate && (
                            <div className="duplicate-control">
                              <span>Possible existing record: <strong>{item.duplicate.title}</strong> · {Math.round(item.duplicate.score * 100)}% match</span>
                              <select
                                aria-label={`Duplicate action for ${titleFor(item)}`}
                                value={item.duplicate_action}
                                onChange={(event) =>
                                  setItem(item.temp_id, { duplicate_action: event.target.value as ItemState['duplicate_action'] })
                                }
                              >
                                <option value="keep">Keep existing</option>
                                <option value="merge">Merge missing/list data</option>
                                <option value="replace">Replace existing</option>
                                <option value="new">Import as new</option>
                              </select>
                            </div>
                          )}
                          <details className="resume-item-editor">
                            <summary>Edit extracted fields</summary>
                            <div className="resume-item-edit-grid">
                              {Object.entries(item.data).map(([key, value]) => (
                                <label key={key}>
                                  <span>{key.replaceAll('_', ' ')}</span>
                                  {typeof value === 'boolean' ? (
                                    <select value={String(value)} onChange={(event) => updateItemField(item.temp_id, key, event.target.value)}>
                                      <option value="true">Yes</option><option value="false">No</option>
                                    </select>
                                  ) : Array.isArray(value) || String(value || '').length > 100 ? (
                                    <textarea rows={3} value={editableValue(value)} onChange={(event) => updateItemField(item.temp_id, key, event.target.value)} />
                                  ) : (
                                    <input value={editableValue(value)} onChange={(event) => updateItemField(item.temp_id, key, event.target.value)} />
                                  )}
                                </label>
                              ))}
                            </div>
                          </details>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}

                {items.length === 0 && Object.keys(personal).length === 0 && (
                  <div className="resume-empty-review">
                    <AlertTriangle size={22} />
                    CareerCanvas could read the file, but it could not map career-profile fields. Review the extracted text or use a text-based resume.
                  </div>
                )}
              </section>
            )}

            {tab === 'text' && (
              <section className="resume-text-preview">
                <div>
                  <h3>What the parser can read</h3>
                  <p>If important visible content is missing here, a text-based ATS may also have difficulty reading it.</p>
                </div>
                <pre>{preview.extracted_text || 'No selectable text was extracted.'}</pre>
              </section>
            )}

            {result && (
              <p className="resume-import-success" role="status">
                <Check size={16} /> Applied to Career Profile · {result.items_added} added · {result.items_updated} updated · {result.items_skipped} skipped
              </p>
            )}

            {error && <p className="error" role="alert">{error}</p>}

            <footer className="resume-import-actions">
              <button className="button secondary" onClick={onClose}>Close</button>
              {tab === 'ats' && <button className="button secondary" onClick={() => setTab('profile')}>Import this resume to Career Profile</button>}
              <button className="button secondary" disabled={busy} onClick={() => void createResume()}>
                Create CareerCanvas Resume
              </button>
              <button className="button primary" disabled={busy} onClick={() => void confirmProfile()}>
                {busy ? 'Applying…' : 'Apply to Career Profile'}
              </button>
            </footer>
          </>
        )}
        {error && !preview && <p className="error resume-upload-error" role="alert">{error}</p>}
      </div>
    </dialog>
  )
}
