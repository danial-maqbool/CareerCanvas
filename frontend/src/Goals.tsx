import { useEffect, useState } from 'react'
import { Plus, Target, ArrowUpRight } from 'lucide-react'
import { api } from './api'
import { CareerRecord, RecordEditor } from './Interviews'
export const goalProgress = (goal: CareerRecord) =>
  goal.data.milestones?.length
    ? Math.round(
        (100 * goal.data.milestones.filter((m: any) => m.done).length) / goal.data.milestones.length
      )
    : goal.data.progress || 0
export default function Goals() {
  const [rows, setRows] = useState<CareerRecord[]>([]),
    [editing, setEditing] = useState<CareerRecord | 'new' | null>(null),
    [error, setError] = useState('')
  const reload = () =>
    api<CareerRecord[]>('/career/goals')
      .then(setRows)
      .catch((e) => setError(e.message))
  useEffect(() => {
    void reload()
  }, [])
  return (
    <>
      <div className="library-toolbar">
        <p>Turn a direction into small, deliberate steps.</p>
        <button className="button primary" onClick={() => setEditing('new')}>
          <Plus size={14} />
          Create career goal
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="goals-grid">
        {rows.map((g, i) => (
          <article className="goal-card" key={g.id}>
            <div className="goal-card-top">
              <span className="record-icon">
                <Target />
              </span>
              <span className="pill">{g.data.status}</span>
            </div>
            <span className="eyebrow">GOAL {String(i + 1).padStart(2, '0')}</span>
            <h2>{g.title}</h2>
            <p>{g.data.notes || 'Every small step counts.'}</p>
            <div className="tag-list">
              {(g.data.tags || []).map((tag: string) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="goal-percent">
              <strong>
                {goalProgress(g)}
                <span>%</span>
              </strong>
              <small>
                {g.data.target_date ? 'Target · ' + g.data.target_date : 'Your own pace'}
              </small>
            </div>
            <div className="prep-progress">
              <div style={{ width: goalProgress(g) + '%' }} />
            </div>
            <div className="milestone-preview">
              {(g.data.milestones || []).slice(0, 3).map((m: any) => (
                <p key={m.id}>
                  <span className={m.done ? 'completed' : ''}>{m.done ? '✓' : '○'}</span>
                  {m.text}
                </p>
              ))}
            </div>
            <button className="text-action" onClick={() => setEditing(g)}>
              Update progress <ArrowUpRight size={14} />
            </button>
          </article>
        ))}
      </div>
      {!rows.length && (
        <div className="empty-state">
          <Target />
          <h2>What would you like your next chapter to look like?</h2>
        </div>
      )}
      {editing && (
        <RecordEditor
          kind="goals"
          initial={editing === 'new' ? undefined : editing}
          onClose={() => {
            setEditing(null)
            void reload()
          }}
        />
      )}
    </>
  )
}
