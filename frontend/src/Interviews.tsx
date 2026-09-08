import { useEffect, useState } from 'react'
import { CalendarDays, Plus, Users, Sparkles, Check } from 'lucide-react'
import { api, json } from './api'
import { Drawer } from './Profile'
import { Job } from './Applications'
import { Profile, itemTitle } from './profile-types'
export type CareerRecord = {
  id: string
  title: string
  data: Record<string, any>
  application_id?: string | null
  revision: number
  updated_at: string
}
export type Collection = 'interviews' | 'contacts' | 'stories' | 'questions' | 'goals'
const names: Record<Collection, string> = {
  interviews: 'Interview',
  contacts: 'Contact',
  stories: 'STAR story',
  questions: 'Question',
  goals: 'Career goal',
}
const specs: Record<Collection, string[]> = {
  interviews: [
    'company',
    'role',
    'round',
    'date',
    'time',
    'format',
    'interviewers',
    'location',
    'status',
    'notes',
  ],
  contacts: ['company', 'role', 'email', 'linkedin', 'relationship', 'last_contact', 'notes'],
  stories: ['situation', 'task', 'action', 'result'],
  questions: ['category', 'answer', 'notes'],
  goals: ['target_date', 'progress', 'status', 'tags', 'notes'],
}
const options: Record<string, string[]> = {
  format: ['Video', 'Phone', 'On-site', 'Take-home'],
  status: ['Scheduled', 'Completed', 'Cancelled'],
  category: [
    'Behavioral',
    'Technical',
    'System Design',
    'AI / ML',
    'Coding',
    'Leadership',
    'Company',
  ],
}
export default function Interviews() {
  const [kind, setKind] = useState<Collection>('interviews')
  return (
    <>
      <div className="detail-tabs workspace-tabs">
        {(['interviews', 'stories', 'questions', 'contacts'] as Collection[]).map((k) => (
          <button key={k} className={kind === k ? 'active' : ''} onClick={() => setKind(k)}>
            {k === 'stories'
              ? 'STAR stories'
              : k === 'questions'
                ? 'Question bank'
                : k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>
      <RecordLibrary kind={kind} key={kind} />
    </>
  )
}
export function RecordLibrary({
  kind,
  applicationId,
}: {
  kind: Collection
  applicationId?: string
}) {
  const [rows, setRows] = useState<CareerRecord[]>([]),
    [editing, setEditing] = useState<CareerRecord | 'new' | null>(null),
    [error, setError] = useState('')
  const reload = () =>
    api<CareerRecord[]>(`/career/${kind}`)
      .then(setRows)
      .catch((e) => setError(e.message))
  useEffect(() => {
    void reload()
  }, [kind])
  return (
    <>
      <div className="library-toolbar">
        <p>
          {kind === 'stories'
            ? 'Situation. Task. Action. Result. Your real experience, ready to share.'
            : kind === 'interviews'
              ? 'Arrive prepared, with everything you need in one place.'
              : kind === 'contacts'
                ? 'Build thoughtful professional relationships.'
                : 'A growing library for your next conversation.'}
        </p>
        <button className="button primary" onClick={() => setEditing('new')}>
          <Plus size={14} />
          Add {names[kind].toLowerCase()}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="record-grid">
        {rows
          .filter((r) => !applicationId || r.application_id === applicationId)
          .map((row) => (
            <article className={`record-card record-${kind}`} key={row.id}>
              <div className="record-icon">
                {kind === 'interviews' ? (
                  <CalendarDays />
                ) : kind === 'contacts' ? (
                  <Users />
                ) : (
                  <Sparkles />
                )}
              </div>
              <span className="eyebrow">
                {row.data.company || row.data.category || names[kind]}
              </span>
              <h3>{row.title}</h3>
              {kind === 'interviews' ? (
                <>
                  <div className="interview-date">
                    {row.data.date
                      ? new Date(row.data.date + 'T12:00:00').toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short',
                        })
                      : 'Date to be confirmed'}{' '}
                    <span>{row.data.time}</span>
                  </div>
                  <p>
                    {row.data.round} · {row.data.format} · {row.data.status}
                  </p>
                  <div className="prep-progress">
                    <div
                      style={{
                        width: `${(100 * (row.data.checklist || []).filter((c: any) => c.done).length) / Math.max(1, row.data.checklist?.length || 0)}%`,
                      }}
                    />
                  </div>
                  <small>
                    {(row.data.checklist || []).filter((c: any) => c.done).length}/
                    {row.data.checklist?.length || 0} preparation steps
                  </small>
                </>
              ) : kind === 'stories' ? (
                <>
                  <p>{row.data.situation}</p>
                  <div className="story-result">
                    <Check size={13} />
                    {row.data.result || 'Add your outcome'}
                  </div>
                </>
              ) : (
                <p>{row.data.role || row.data.answer || row.data.notes || 'Ready to build on.'}</p>
              )}
              <button className="button secondary" onClick={() => setEditing(row)}>
                {kind === 'interviews'
                  ? 'Prepare for interview'
                  : 'Open ' + names[kind].toLowerCase()}
              </button>
            </article>
          ))}
      </div>
      {!rows.length && (
        <div className="empty-state">
          <h2>
            {kind === 'interviews'
              ? 'Your next conversation starts with preparation.'
              : 'Keep useful career knowledge close.'}
          </h2>
        </div>
      )}
      {editing && (
        <RecordEditor
          kind={kind}
          initial={editing === 'new' ? undefined : editing}
          applicationId={applicationId}
          onClose={() => {
            setEditing(null)
            void reload()
          }}
        />
      )}
    </>
  )
}
export function RecordEditor({
  kind,
  initial,
  applicationId,
  onClose,
}: {
  kind: Collection
  initial?: CareerRecord
  applicationId?: string
  onClose: () => void
}) {
  const [title, setTitle] = useState(initial?.title || ''),
    [data, setData] = useState<Record<string, any>>(initial?.data || {}),
    [app, setApp] = useState(initial?.application_id || applicationId || ''),
    [jobs, setJobs] = useState<Job[]>([]),
    [stories, setStories] = useState<CareerRecord[]>([]),
    [questions, setQuestions] = useState<CareerRecord[]>([]),
    [profile, setProfile] = useState<Profile | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false)
  useEffect(() => {
    Promise.all([
      api<Job[]>('/applications').then(setJobs),
      api<CareerRecord[]>('/career/stories').then(setStories),
      api<CareerRecord[]>('/career/questions').then(setQuestions),
      api<Profile>('/profile').then(setProfile),
    ]).catch((e) => setError(e.message))
  }, [])
  function change(key: string, value: unknown) {
    setData((d) => ({ ...d, [key]: value }))
  }
  async function save() {
    setBusy(true)
    try {
      await api(
        `/career/${kind}${initial ? '/' + initial.id : ''}`,
        json(initial ? 'PUT' : 'POST', {
          title,
          data,
          application_id: app || null,
          revision: initial?.revision || 1,
        })
      )
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const checklist =
    data.checklist ||
    [
      'Research company',
      'Review job description',
      'Review resume',
      'Prepare STAR examples',
      'Technical topics',
      'Questions to ask',
      'Logistics',
    ].map((text) => ({ id: text, text, done: false }))
  return (
    <Drawer title={initial?.title || 'Add ' + names[kind].toLowerCase()} wide onClose={onClose}>
      <div className="drawer-form">
        <label className="field">
          <span>{kind === 'contacts' ? 'Contact name' : names[kind] + ' title'}</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} />
        </label>
        {['interviews', 'contacts'].includes(kind) && (
          <label className="field">
            <span>Associated application</span>
            <select
              value={app}
              onChange={(e) => {
                setApp(e.target.value)
                const job = jobs.find((j) => j.id === e.target.value)
                if (job)
                  setData((d) => ({
                    ...d,
                    company: job.company,
                    role: job.role,
                  }))
              }}
            >
              <option value="">Independent record</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.company} · {j.role}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="form-grid">
          {specs[kind].map((key) => {
            const opts =
              key === 'status' && kind === 'goals'
                ? ['Active', 'Completed', 'Paused']
                : options[key]
            return (
              <label
                className={`field ${['notes', 'situation', 'task', 'action', 'result', 'answer'].includes(key) ? 'full-width' : ''}`}
                key={key}
              >
                <span>{key.replaceAll('_', ' ')}</span>
                {opts ? (
                  <select
                    value={data[key] || opts[0]}
                    onChange={(e) => change(key, e.target.value)}
                  >
                    {opts.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : ['notes', 'situation', 'task', 'action', 'result', 'answer'].includes(key) ? (
                  <textarea
                    rows={5}
                    value={data[key] || ''}
                    onChange={(e) => change(key, e.target.value)}
                  />
                ) : (
                  <input
                    type={
                      key.includes('date') || key === 'last_contact'
                        ? 'date'
                        : key === 'time'
                          ? 'time'
                          : key === 'progress'
                            ? 'number'
                            : 'text'
                    }
                    min={0}
                    max={100}
                    value={key === 'tags' ? (data[key] || []).join(', ') : data[key] || ''}
                    onChange={(e) =>
                      change(
                        key,
                        key === 'progress'
                          ? Number(e.target.value)
                          : key === 'tags'
                            ? e.target.value.split(',').map((t) => t.trim())
                            : e.target.value
                      )
                    }
                  />
                )}
              </label>
            )
          })}
        </div>
        {kind === 'interviews' && (
          <div className="prep-layout">
            <section>
              <h3>Preparation checklist</h3>
              {checklist.map((item: any) => (
                <label className="selection-row" key={item.id}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={(e) =>
                      change(
                        'checklist',
                        checklist.map((x: any) =>
                          x.id === item.id ? { ...x, done: e.target.checked } : x
                        )
                      )
                    }
                  />
                  {item.text}
                </label>
              ))}
            </section>
            <section>
              <h3>Stories to bring into the conversation</h3>
              {stories.map((s) => (
                <details className="prep-story" key={s.id}>
                  <summary>
                    <label>
                      <input
                        type="checkbox"
                        checked={(data.story_ids || []).includes(s.id)}
                        onChange={(e) =>
                          change(
                            'story_ids',
                            e.target.checked
                              ? [...(data.story_ids || []), s.id]
                              : (data.story_ids || []).filter((id: string) => id !== s.id)
                          )
                        }
                      />
                      {s.title}
                    </label>
                  </summary>
                  {['situation', 'task', 'action', 'result'].map((k) => (
                    <p key={k}>
                      <b>{k.toUpperCase()}</b>
                      <br />
                      {s.data[k]}
                    </p>
                  ))}
                </details>
              ))}
              <h3>Questions to practice</h3>
              {questions.map((q) => (
                <label className="selection-row" key={q.id}>
                  <input
                    type="checkbox"
                    checked={(data.question_ids || []).includes(q.id)}
                    onChange={(e) =>
                      change(
                        'question_ids',
                        e.target.checked
                          ? [...(data.question_ids || []), q.id]
                          : (data.question_ids || []).filter((id: string) => id !== q.id)
                      )
                    }
                  />
                  {q.title}
                </label>
              ))}
            </section>
          </div>
        )}
        {kind === 'stories' && (
          <div className="content-selection">
            <h3>Connect this story to your real experience</h3>
            {(['skills', 'experience', 'achievements'] as const).map((k) => (
              <details key={k}>
                <summary>{k}</summary>
                {profile?.items
                  .filter((i) => i.kind === k)
                  .map((item) => {
                    const field =
                      k === 'skills'
                        ? 'skill_ids'
                        : k === 'experience'
                          ? 'experience_ids'
                          : 'achievement_ids'
                    return (
                      <label className="selection-row" key={item.id}>
                        <input
                          type="checkbox"
                          checked={(data[field] || []).includes(item.id)}
                          onChange={(e) =>
                            change(
                              field,
                              e.target.checked
                                ? [...(data[field] || []), item.id]
                                : (data[field] || []).filter((id: string) => id !== item.id)
                            )
                          }
                        />
                        {itemTitle(item)}
                      </label>
                    )
                  })}
              </details>
            ))}
          </div>
        )}
        {kind === 'goals' && (
          <section>
            <h3>Milestones</h3>
            {(data.milestones || []).map((m: any) => (
              <label className="selection-row" key={m.id}>
                <input
                  type="checkbox"
                  checked={m.done}
                  onChange={(e) =>
                    change(
                      'milestones',
                      data.milestones.map((x: any) =>
                        x.id === m.id ? { ...x, done: e.target.checked } : x
                      )
                    )
                  }
                />
                <input
                  value={m.text}
                  onChange={(e) =>
                    change(
                      'milestones',
                      data.milestones.map((x: any) =>
                        x.id === m.id ? { ...x, text: e.target.value } : x
                      )
                    )
                  }
                />
                <button
                  onClick={() =>
                    change(
                      'milestones',
                      data.milestones.filter((x: any) => x.id !== m.id)
                    )
                  }
                >
                  Remove
                </button>
              </label>
            ))}
            <button
              className="button secondary"
              onClick={() =>
                change('milestones', [
                  ...(data.milestones || []),
                  {
                    id: crypto.randomUUID(),
                    text: 'New milestone',
                    done: false,
                  },
                ])
              }
            >
              Add milestone
            </button>
          </section>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="drawer-actions">
          <button className="button primary" disabled={busy || !title.trim()} onClick={save}>
            Save {names[kind].toLowerCase()}
          </button>
          {initial && (
            <button className="text-action danger" onClick={() => setConfirm(true)}>
              Delete {names[kind].toLowerCase()}
            </button>
          )}
        </div>
        {confirm && (
          <div className="notice">
            <p>Delete this record? Linked records remain.</p>
            <button
              className="button danger"
              onClick={() =>
                api(`/career/${kind}/${initial!.id}`, { method: 'DELETE' })
                  .then(onClose)
                  .catch((e) => setError(e.message))
              }
            >
              Confirm delete
            </button>
          </div>
        )}
      </div>
    </Drawer>
  )
}
