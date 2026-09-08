import { useEffect, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import { GripVertical, Plus, Search, MapPin, ArrowUpRight } from 'lucide-react'
import { api, json } from './api'
import { Drawer } from './Profile'
import { Resume } from './resume-types'
import { RecordLibrary } from './Interviews'
import { Letter } from './CoverLetters'
export const stages = [
  'Interested',
  'Applied',
  'Screening',
  'Interview',
  'Technical Interview',
  'Final Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
  'Accepted',
]
export type Job = {
  id: string
  company: string
  role: string
  status: string
  data: {
    location: string
    url: string
    salary_range: string
    work_type: string
    application_date: string
    source: string
    contact: string
    notes: string
    tags: string[]
    next_action: string
    deadline: string
    job_description: string
    tasks: { id: string; text: string; done: boolean }[]
  }
  resume_id: string | null
  resume_version_id: string | null
  cover_letter_id: string | null
  revision: number
  created_at: string
  updated_at: string
}
export default function Applications() {
  const [tagColors, setTagColors] = useState<Record<string, string>>({})
  useEffect(() => {
    api<{ name: string; color: string }[]>('/tags')
      .then((tags) => setTagColors(Object.fromEntries(tags.map((t) => [t.name, t.color]))))
      .catch(() => {})
  }, [])
  const [rows, setRows] = useState<Job[]>([]),
    [selected, setSelected] = useState<Job | 'new' | null>(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [search, setSearch] = useState(''),
    [view, setView] = useState('board')
  const reload = () =>
    api<Job[]>('/applications')
      .then(setRows)
      .catch((e) => setError(e.message))
  useEffect(() => {
    void reload()
  }, [])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  async function move(event: DragEndEvent) {
    const job = rows.find((r) => r.id === event.active.id),
      stage = String(event.over?.id)
    if (!job || !stages.includes(stage) || stage === job.status) return
    try {
      const saved = await api<Job>(
        `/applications/${job.id}/stage`,
        json('PATCH', { status: stage, revision: job.revision })
      )
      setRows((rows) => rows.map((row) => (row.id === saved.id ? saved : row)))
      setNotice(`${job.company} moved to ${stage}`)
    } catch (e) {
      setError((e as Error).message)
      void reload()
    }
  }
  const filtered = rows.filter((j) =>
    `${j.company} ${j.role} ${j.data.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <>
      <div className="library-toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            aria-label="Search applications"
            placeholder="Search company, role or tag"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="segmented">
          <button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>
            Board
          </button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
            List
          </button>
        </div>
        <button className="button primary" onClick={() => setSelected('new')}>
          <Plus size={15} />
          Add job application
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <div className="pipeline-summary">
        <strong>{rows.length}</strong> opportunities <span>·</span>
        <strong>{rows.filter((j) => j.status.includes('Interview')).length}</strong> in interviews{' '}
        <span>·</span>
        <strong>{rows.filter((j) => ['Offer', 'Accepted'].includes(j.status)).length}</strong>{' '}
        offers
      </div>
      {view === 'board' ? (
        <DndContext sensors={sensors} onDragEnd={move}>
          <div className="kanban-board">
            {stages.map((stage, i) => (
              <Column key={stage} stage={stage} index={i}>
                {filtered
                  .filter((j) => j.status === stage)
                  .map((j) => (
                    <JobCard key={j.id} job={j} colors={tagColors} onOpen={() => setSelected(j)} />
                  ))}
              </Column>
            ))}
          </div>
        </DndContext>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company / role</th>
                <th>Stage</th>
                <th>Location</th>
                <th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <tr key={j.id}>
                  <td>
                    <button className="text-action" onClick={() => setSelected(j)}>
                      {j.company} · {j.role}
                    </button>
                  </td>
                  <td>{j.status}</td>
                  <td>{j.data.location}</td>
                  <td>{j.data.next_action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <JobEditor
          initial={selected === 'new' ? undefined : selected}
          onSaved={(saved) => {
            setRows((rows) =>
              rows.some((row) => row.id === saved.id)
                ? rows.map((row) => (row.id === saved.id ? saved : row))
                : [...rows, saved]
            )
            setSelected(null)
          }}
          onClose={() => {
            setSelected(null)
            void reload()
          }}
        />
      )}
    </>
  )
}
function Column({
  stage,
  index,
  children,
}: {
  stage: string
  index: number
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  return (
    <section
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'drop-active' : ''}`}
      data-stage={stage}
    >
      <h3>
        <span
          style={{
            background: ['#96a68c', '#5a8d7b', '#8b9caf', '#be9d62'][index % 4],
          }}
        />
        {stage}
      </h3>
      <div>{children}</div>
      <p className="drop-hint">Drop an opportunity here</p>
    </section>
  )
}
function JobCard({
  job,
  onOpen,
  colors,
}: {
  job: Job
  onOpen: () => void
  colors: Record<string, string>
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: job.id })
  return (
    <article
      ref={setNodeRef}
      className={`job-card ${isDragging ? 'dragging' : ''}`}
      style={
        transform
          ? {
              transform: `translate3d(${transform.x}px,${transform.y}px,0)`,
              zIndex: 20,
            }
          : undefined
      }
    >
      <div className="job-card-top">
        <span className="company-monogram">{job.company.slice(0, 2).toUpperCase()}</span>
        <button
          className="drag-handle"
          aria-label={`Drag ${job.company}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={15} />
        </button>
      </div>
      <button className="job-open" onClick={onOpen}>
        <strong>{job.company}</strong>
        <h4>{job.role}</h4>
      </button>
      <p>
        <MapPin size={11} />
        {job.data.location || job.data.work_type}
      </p>
      <div className="tag-list">
        {job.data.tags.map((t) => (
          <span key={t} style={colors[t] ? { borderLeft: `3px solid ${colors[t]}` } : undefined}>
            {t}
          </span>
        ))}
      </div>
      {job.data.deadline && <div className="job-deadline">Next action · {job.data.deadline}</div>}
      <button className="job-detail-link" onClick={onOpen}>
        View opportunity <ArrowUpRight size={12} />
      </button>
    </article>
  )
}
export function JobEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Job
  onClose: () => void
  onSaved?: (saved: Job) => void
}) {
  const [draft, setDraft] = useState<Partial<Job>>(
      initial || {
        company: '',
        role: '',
        status: 'Interested',
        revision: 1,
        resume_id: null,
        resume_version_id: null,
        cover_letter_id: null,
        data: {
          location: '',
          url: '',
          salary_range: '',
          work_type: 'Unspecified',
          application_date: '',
          source: '',
          contact: '',
          notes: '',
          tags: [],
          next_action: '',
          deadline: '',
          job_description: '',
          tasks: [],
        },
      }
    ),
    [tab, setTab] = useState('Overview'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [history, setHistory] = useState<{ id: string; action: string; created_at: string }[]>([]),
    [resumes, setResumes] = useState<Resume[]>([]),
    [letters, setLetters] = useState<Letter[]>([]),
    [versions, setVersions] = useState<{ id: string; number: number }[]>([]),
    [task, setTask] = useState(''),
    [confirm, setConfirm] = useState(false)
  useEffect(() => {
    api<Resume[]>('/resumes').then(setResumes)
    api<Letter[]>('/cover-letters').then(setLetters)
    if (initial) api<typeof history>(`/applications/${initial.id}/history`).then(setHistory)
  }, [])
  useEffect(() => {
    if (draft.resume_id)
      api<typeof versions>(`/resumes/${draft.resume_id}/versions`).then(setVersions)
    else setVersions([])
  }, [draft.resume_id])
  const data = draft.data!
  function change(key: string, value: unknown) {
    setDraft((d) => ({ ...d, data: { ...d.data!, [key]: value } }))
  }
  async function save() {
    setBusy(true)
    try {
      const { id, created_at, updated_at, ...payload } = draft
      const saved = await api<Job>(
        id ? `/applications/${id}` : '/applications',
        json(id ? 'PUT' : 'POST', payload)
      )
      if (onSaved) onSaved(saved)
      else onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Drawer
      title={initial ? `${initial.company} · ${initial.role}` : 'Save an opportunity'}
      wide
      onClose={onClose}
    >
      <div className="detail-tabs">
        {[
          'Overview',
          'Job Description',
          'Documents',
          'Timeline',
          'Interviews',
          'Contacts',
          'Notes & Tasks',
        ].map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="drawer-form">
        <div className="job-detail-banner">
          <span className="company-monogram">
            {draft.company?.slice(0, 2).toUpperCase() || '+'}
          </span>
          <div>
            <h2>{draft.company || 'Your next opportunity'}</h2>
            <p>{draft.role || 'Keep the details that matter, together.'}</p>
          </div>
          <label className="field">
            <span>Application stage</span>
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            >
              {stages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        {tab === 'Overview' && (
          <div className="form-grid">
            <label className="field">
              <span>Company</span>
              <input
                required
                value={draft.company}
                onChange={(e) => setDraft({ ...draft, company: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Role</span>
              <input
                required
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              />
            </label>
            {[
              'location',
              'url',
              'salary_range',
              'application_date',
              'source',
              'contact',
              'next_action',
              'deadline',
            ].map((k) => (
              <label className="field" key={k}>
                <span>{k.replaceAll('_', ' ')}</span>
                <input
                  type={['application_date', 'deadline'].includes(k) ? 'date' : 'text'}
                  value={String(data[k as keyof typeof data])}
                  onChange={(e) => change(k, e.target.value)}
                />
              </label>
            ))}
            <label className="field">
              <span>Work type</span>
              <select value={data.work_type} onChange={(e) => change('work_type', e.target.value)}>
                {['Unspecified', 'Remote', 'Hybrid', 'On-site'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Tags, comma separated</span>
              <input
                value={data.tags.join(', ')}
                onChange={(e) =>
                  change(
                    'tags',
                    e.target.value.split(',').map((t) => t.trim())
                  )
                }
              />
            </label>
            <button
              className="button secondary"
              onClick={() => {
                const date = new Date()
                date.setDate(date.getDate() + 3)
                change('deadline', date.toLocaleDateString('en-CA'))
                change('next_action', 'Follow up on application')
              }}
            >
              Follow up in 3 days
            </button>
          </div>
        )}
        {tab === 'Job Description' && (
          <label className="field">
            <span>Job description</span>
            <textarea
              aria-label="Job description"
              rows={16}
              value={data.job_description}
              onChange={(e) => change('job_description', e.target.value)}
            />
            <button
              className="text-action"
              onClick={() =>
                api<{ description: string }>('/demo/job').then((j) =>
                  change('job_description', j.description)
                )
              }
            >
              Load fictional AI Engineer description
            </button>
          </label>
        )}
        {tab === 'Documents' && (
          <div className="form-grid">
            <label className="field">
              <span>Resume used</span>
              <select
                value={draft.resume_id || ''}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    resume_id: e.target.value || null,
                    resume_version_id: null,
                  })
                }
              >
                <option value="">None</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Resume version used</span>
              <select
                value={draft.resume_version_id || ''}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    resume_version_id: e.target.value || null,
                  })
                }
              >
                <option value="">Current document (no snapshot)</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    Version {v.number}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Cover letter used</span>
              <select
                value={draft.cover_letter_id || ''}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    cover_letter_id: e.target.value || null,
                  })
                }
              >
                <option value="">None</option>
                {letters.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {initial && tab === 'Interviews' && (
          <RecordLibrary kind="interviews" applicationId={initial.id} />
        )}
        {initial && tab === 'Contacts' && (
          <RecordLibrary kind="contacts" applicationId={initial.id} />
        )}
        {tab === 'Timeline' && (
          <ol className="timeline">
            {history.map((h) => (
              <li key={h.id}>
                <span>{new Date(h.created_at).toLocaleString()}</span>
                <strong>{h.action}</strong>
              </li>
            ))}
          </ol>
        )}
        {tab === 'Notes & Tasks' && (
          <>
            <label className="field">
              <span>Notes</span>
              <textarea
                rows={8}
                value={data.notes}
                onChange={(e) => change('notes', e.target.value)}
              />
            </label>
            {data.tasks.map((t) => (
              <label className="selection-row" key={t.id}>
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={(e) =>
                    change(
                      'tasks',
                      data.tasks.map((x) => (x.id === t.id ? { ...x, done: e.target.checked } : x))
                    )
                  }
                />
                {t.text}
                <button
                  onClick={() =>
                    change(
                      'tasks',
                      data.tasks.filter((x) => x.id !== t.id)
                    )
                  }
                >
                  Remove
                </button>
              </label>
            ))}
            <div className="inline-form">
              <input
                aria-label="New task"
                placeholder="Next small step…"
                value={task}
                onChange={(e) => setTask(e.target.value)}
              />
              <button
                disabled={!task.trim()}
                onClick={() => {
                  change('tasks', [
                    ...data.tasks,
                    { id: crypto.randomUUID(), text: task, done: false },
                  ])
                  setTask('')
                }}
              >
                Add task
              </button>
            </div>
          </>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="drawer-actions">
          <button
            className="button primary"
            disabled={busy || !draft.company?.trim() || !draft.role?.trim()}
            onClick={save}
          >
            Save application
          </button>
          {initial && (
            <button className="text-action danger" onClick={() => setConfirm(true)}>
              Delete application
            </button>
          )}
        </div>
        {confirm && (
          <div className="notice">
            <p>Delete this application and its timeline?</p>
            <button
              className="button danger"
              onClick={() =>
                api(`/applications/${initial!.id}`, { method: 'DELETE' })
                  .then(onClose)
                  .catch((e) => setError(e.message))
              }
            >
              Confirm delete
            </button>
            <button onClick={() => setConfirm(false)}>Keep application</button>
          </div>
        )}
      </div>
    </Drawer>
  )
}
