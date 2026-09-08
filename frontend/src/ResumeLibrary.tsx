import { useEffect, useState } from 'react'
import { ArrowRight, Copy, FileText, MoreHorizontal, Plus, Search, Star } from 'lucide-react'
import { api, json } from './api'
import { Drawer } from './Profile'
import { itemTitle, labels, Profile } from './profile-types'
import { Resume, savePayload } from './resume-types'
import { downloadFile } from './CoverLetters'
import PaginatedPaper from './PaginatedPaper'
import { paginateDocument } from './pagination'
import ResumePaper from './ResumePaper'
import TemplateGallery from './TemplateGallery'
import { profileDocument } from './templates'

export function ResumeWizard({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (resume: Resume) => void
}) {
  const [step, setStep] = useState(1),
    [profile, setProfile] = useState<Profile | null>(null)
  const [template, setTemplate] = useState('Modern')
  const [name, setName] = useState(''),
    [role, setRole] = useState(''),
    [purpose, setPurpose] = useState('General Resume'),
    [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  useEffect(() => {
    api<Profile>('/profile')
      .then((p) => {
        setProfile(p)
        setSelected(
          p.items.filter((i) => i.kind !== 'references' && i.kind !== 'portfolio').map((i) => i.id)
        )
      })
      .catch((e) => setError(e.message))
  }, [])
  return (
    <Drawer title="A new chapter, on paper." wide={step === 2} onClose={onClose}>
      <div className="drawer-form">
        <div className="wizard-steps">
          {['Name & purpose', 'Choose template', 'Choose content', 'Ready to create'].map(
            (label, i) => (
              <span className={step >= i + 1 ? 'current' : ''} key={label}>
                <b>{i + 1}</b>
                {label}
              </span>
            )
          )}
        </div>
        {step === 1 && (
          <>
            <p className="form-note">
              Give this resume a name that helps you find it later. Every resume is an independent
              document.
            </p>
            <label className="field">
              <span>Resume name *</span>
              <input
                autoFocus
                value={name}
                maxLength={150}
                onChange={(e) => setName(e.target.value)}
                placeholder="AI Engineer — September 2026"
              />
            </label>
            <label className="field">
              <span>Target role</span>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="AI Engineer"
              />
            </label>
            <label className="field">
              <span>Purpose</span>
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                {[
                  'General Resume',
                  'Specific Job',
                  'Academic CV',
                  'Internship',
                  'Freelance',
                  'Research',
                  'Graduate Application',
                  'Custom',
                ].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          </>
        )}
        {step === 2 && profile && (
          <TemplateGallery
            document={{ ...profileDocument(profile), template }}
            onChoose={(name) => {
              setTemplate(name)
              setStep(3)
            }}
          />
        )}
        {step === 3 && (
          <>
            <p className="form-note">
              Choose from your profile. You can customize each item in the resume later. References
              are excluded unless you select them.
            </p>
            {profile?.items.length === 0 && (
              <p>
                No profile content yet. You can still create a blank resume and add content later.
              </p>
            )}
            {Object.entries(labels).map(([kind, label]) => {
              const items = profile?.items.filter((i) => i.kind === kind) || []
              return items.length ? (
                <div key={kind} className="selection-group">
                  <h3>{label}</h3>
                  {items.map((item) => (
                    <label className="selection-row" key={item.id}>
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, item.id]
                              : selected.filter((id) => id !== item.id)
                          )
                        }
                      />
                      <span>{itemTitle(item)}</span>
                    </label>
                  ))}
                </div>
              ) : null
            })}
          </>
        )}
        {step === 4 && (
          <>
            <div className="creation-summary">
              <FileText size={36} />
              <h3>{name}</h3>
              <p>{role || purpose}</p>
              <span>
                {selected.length} career items · {template} · A4
              </span>
            </div>
            <p className="form-note">
              Start with a clean, professional layout. Template and typography controls will be
              available in the editor.
            </p>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="drawer-actions">
          {step > 1 && (
            <button className="button secondary" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              className="button primary"
              disabled={!name.trim() || !profile}
              onClick={() => setStep(step + 1)}
            >
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button
              className="button primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  const resume = await api<Resume>(
                    '/resumes',
                    json('POST', {
                      name,
                      target_role: role,
                      purpose,
                      template,
                      selected_ids: selected,
                    })
                  )
                  onCreated(resume)
                } catch (e) {
                  setError((e as Error).message)
                } finally {
                  setBusy(false)
                }
              }}
            >
              {busy ? 'Creating…' : 'Create resume'}
            </button>
          )}
        </div>
      </div>
    </Drawer>
  )
}

export default function ResumeLibrary({ onOpen }: { onOpen: (resume: Resume) => void }) {
  const [resumes, setResumes] = useState<Resume[]>([]),
    [creating, setCreating] = useState(false),
    [query, setQuery] = useState(''),
    [archived, setArchived] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('')
  const [preview, setPreview] = useState<Resume | null>(null),
    [pages, setPages] = useState<Record<string, number>>({})
  const [action, setAction] = useState<{
      resume: Resume
      type: 'rename' | 'delete'
    } | null>(null),
    [newName, setNewName] = useState('')
  const refresh = () => {
    api<Resume[]>('/resumes')
      .then(setResumes)
      .catch((e) => setError(e.message))
  }
  useEffect(refresh, [])
  useEffect(() => {
    let stopped = false
    let index = 0
    const next = () => {
      if (stopped || index >= resumes.length) return
      const r = resumes[index++]
      setPages((p) => ({
        ...p,
        [r.id]: paginateDocument(r.document).pages.length,
      }))
      setTimeout(next, 20)
    }
    const timer = setTimeout(next, 100)
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [resumes])
  async function mutate(fn: () => Promise<unknown>, message: string) {
    try {
      await fn()
      refresh()
      setNotice(message)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const visible = resumes.filter(
    (r) =>
      r.archived === archived &&
      `${r.name} ${r.target_role}`.toLowerCase().includes(query.toLowerCase())
  )
  return (
    <>
      <div className="library-banner">
        <div>
          <span className="eyebrow">DIFFERENT OPPORTUNITIES. ONE AUTHENTIC YOU.</span>
          <h2>A resume for your next move.</h2>
          <p>Thoughtfully tailored documents, built from the experience you already have.</p>
        </div>
        <button className="button primary" onClick={() => setCreating(true)}>
          <Plus size={15} /> Create resume
        </button>
      </div>
      <div className="library-toolbar">
        <div className="segmented">
          <button className={!archived ? 'selected' : ''} onClick={() => setArchived(false)}>
            My resumes <span>{resumes.filter((r) => !r.archived).length}</span>
          </button>
          <button className={archived ? 'selected' : ''} onClick={() => setArchived(true)}>
            Archived
          </button>
        </div>
        <label className="search-input">
          <Search size={15} />
          <input
            aria-label="Search resumes"
            placeholder="Find a resume…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="resume-grid">
        {visible.map((resume) => (
          <article className="resume-card" key={resume.id}>
            <button
              className="resume-thumbnail"
              aria-label={`Open ${resume.name}`}
              onClick={() => onOpen(resume)}
            >
              <div className="thumbnail-paper">
                <ResumePaper document={resume.document} />
              </div>
              <span className="open-overlay">
                Open resume <ArrowRight size={14} />
              </span>
              {resume.primary && (
                <span className="primary-ribbon">
                  <Star size={11} /> Primary
                </span>
              )}
            </button>
            <div className="resume-card-info">
              <div className="resume-card-title">
                <h3>
                  <button onClick={() => onOpen(resume)}>{resume.name}</button>
                </h3>
                <details className="action-menu">
                  <summary aria-label={`Actions for ${resume.name}`}>
                    <MoreHorizontal size={19} />
                  </summary>
                  <div>
                    {[
                      ['Open', () => onOpen(resume)],
                      ['Preview', () => setPreview(resume)],
                      [
                        'Export PDF',
                        () =>
                          downloadFile(`/api/resumes/${resume.id}/export/pdf`, resume.name + '.pdf')
                            .then(() => setNotice('PDF generated'))
                            .catch((e) => setError(e.message)),
                      ],
                      [
                        'Export DOCX',
                        () =>
                          downloadFile(
                            `/api/resumes/${resume.id}/export/docx`,
                            resume.name + '.docx'
                          )
                            .then(() => setNotice('DOCX generated'))
                            .catch((e) => setError(e.message)),
                      ],
                      [
                        'Create Version / Compare Versions',
                        () => onOpen({ ...resume, open_panel: 'versions' }),
                      ],
                      [
                        'Rename',
                        () => {
                          setAction({ resume, type: 'rename' })
                          setNewName(resume.name)
                        },
                      ],
                      [
                        'Duplicate',
                        () =>
                          mutate(
                            () => api(`/resumes/${resume.id}/duplicate`, json('POST')),
                            'Resume duplicated'
                          ),
                      ],
                      [
                        'Set as primary',
                        () =>
                          mutate(
                            () => api(`/resumes/${resume.id}/primary`, json('POST')),
                            'Primary resume updated'
                          ),
                      ],
                      [
                        archived ? 'Unarchive' : 'Archive',
                        () =>
                          mutate(
                            () =>
                              api(
                                `/resumes/${resume.id}`,
                                json('PUT', {
                                  ...savePayload(resume),
                                  archived: !archived,
                                })
                              ),
                            archived ? 'Resume unarchived' : 'Resume archived'
                          ),
                      ],
                      ['Delete', () => setAction({ resume, type: 'delete' })],
                    ].map(([label, fn]) => (
                      <button
                        key={String(label)}
                        onClick={(e) => {
                          e.currentTarget.closest('details')?.removeAttribute('open')
                          ;(fn as () => void)()
                        }}
                      >
                        {String(label)}
                      </button>
                    ))}
                  </div>
                </details>
              </div>
              <p>
                {resume.document.template} <span>·</span>{' '}
                {pages[resume.id]
                  ? `${pages[resume.id]} pages`
                  : resume.page_count
                    ? `${resume.page_count} pages`
                    : 'Measuring…'}
              </p>
              <div className="resume-card-tags">
                <span>{resume.target_role || resume.purpose}</span>
                <span className="draft-tag">Draft</span>
              </div>
              <footer>
                <span>
                  Edited{' '}
                  {new Date(
                    resume.updated_at +
                      'Z'.repeat(
                        !resume.updated_at.endsWith('Z') && !resume.updated_at.includes('+') ? 1 : 0
                      )
                  ).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <span>ATS · {resume.ats_score ?? 'Not checked'}</span>
              </footer>
            </div>
          </article>
        ))}
        {!archived && (
          <button className="new-resume-card" onClick={() => setCreating(true)}>
            <span>
              <Plus size={25} />
            </span>
            <h3>Room for your next opportunity.</h3>
            <p>
              Create an independent resume
              <br />
              from your career profile.
            </p>
            <b>
              Create resume <ArrowRight size={13} />
            </b>
          </button>
        )}
      </div>
      {preview && (
        <Drawer title={preview.name} wide onClose={() => setPreview(null)}>
          <div className="library-preview">
            <PaginatedPaper document={preview.document} />
          </div>
        </Drawer>
      )}
      {creating && (
        <ResumeWizard
          onClose={() => setCreating(false)}
          onCreated={(resume) => {
            setCreating(false)
            refresh()
            onOpen(resume)
          }}
        />
      )}
      {action && (
        <Drawer
          title={action.type === 'rename' ? 'Rename resume' : 'Delete resume?'}
          onClose={() => setAction(null)}
        >
          <div className="drawer-form">
            {action.type === 'rename' ? (
              <label className="field">
                <span>Resume name</span>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={150}
                />
              </label>
            ) : (
              <p>
                Delete “{action.resume.name}”? This permanently removes this document. Your Career
                Profile remains available.
              </p>
            )}
            <div className="drawer-actions">
              <button className="button secondary" onClick={() => setAction(null)}>
                Cancel
              </button>
              <button
                className={`button ${action.type === 'delete' ? 'danger' : 'primary'}`}
                disabled={action.type === 'rename' && !newName.trim()}
                onClick={async () => {
                  const current = action
                  await mutate(
                    () =>
                      api(
                        `/resumes/${current.resume.id}`,
                        current.type === 'delete'
                          ? json('DELETE')
                          : json('PUT', {
                              ...savePayload(current.resume),
                              name: newName,
                            })
                      ),
                    current.type === 'delete' ? 'Resume deleted' : 'Resume renamed'
                  )
                  setAction(null)
                }}
              >
                {action.type === 'rename' ? 'Save name' : 'Delete resume'}
              </button>
            </div>
          </div>
        </Drawer>
      )}
    </>
  )
}
