import { useEffect, useState } from 'react'
import { Clock3, GitCompareArrows, Plus, RotateCcw } from 'lucide-react'
import { api, json } from './api'
import { Drawer } from './Profile'
import { flushSave, useEditor } from './editor-store'
import { Resume } from './resume-types'

type Version = { id: string; number: number; note: string; created_at: string }
type Diff = {
  before: number
  after: number
  counts: Record<string, number>
  changes: { kind: string; path: string; before: unknown; after: unknown }[]
}
export default function VersionHistory({ onClose }: { onClose: () => void }) {
  const resume = useEditor((s) => s.resume)!,
    [versions, setVersions] = useState<Version[]>([]),
    [note, setNote] = useState(''),
    [left, setLeft] = useState(''),
    [right, setRight] = useState(''),
    [diff, setDiff] = useState<Diff | null>(null),
    [restore, setRestore] = useState<Version | null>(null),
    [error, setError] = useState('')
  const path = `/resumes/${resume.id}/versions`
  const refresh = () =>
    api<Version[]>(path)
      .then((v) => {
        setVersions(v)
        if (v.length > 1) {
          setLeft(v[1].id)
          setRight(v[0].id)
        }
      })
      .catch((e) => setError(e.message))
  useEffect(() => {
    void refresh()
  }, [])
  return (
    <Drawer title="Every version of your story." wide onClose={onClose}>
      <div className="version-workspace">
        <section className="version-list">
          <p className="form-note">
            Create a checkpoint before a big change. Restoring keeps every saved version.
          </p>
          <label className="field">
            <span>Version note</span>
            <textarea
              aria-label="Version note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Added a project and shortened the summary"
            />
          </label>
          <button
            className="button primary"
            onClick={async () => {
              try {
                await flushSave()
                await api(
                  path,
                  json('POST', {
                    note,
                    revision: useEditor.getState().resume!.revision,
                  })
                )
                setNote('')
                await refresh()
              } catch (e) {
                setError((e as Error).message)
              }
            }}
          >
            <Plus size={13} />
            Create version
          </button>
          {versions.map((v) => (
            <article className="version-entry" key={v.id}>
              <span className="version-dot">
                <Clock3 size={14} />
              </span>
              <div>
                <h3>v{v.number}</h3>
                <p>{v.note || 'Saved checkpoint'}</p>
                <small>{new Date(v.created_at).toLocaleString()}</small>
                <button className="text-action" onClick={() => setRestore(v)}>
                  <RotateCcw size={11} />
                  Restore this version
                </button>
              </div>
            </article>
          ))}
        </section>
        <section className="version-comparison">
          <div className="comparison-heading">
            <GitCompareArrows size={20} />
            <div>
              <h3>See what changed</h3>
              <p>Compare content, sections, skills, and styling.</p>
            </div>
          </div>
          {versions.length < 2 ? (
            <div className="empty-state">
              <h3>Your story is still unfolding.</h3>
              <p>Create two versions to compare your changes.</p>
            </div>
          ) : (
            <>
              <div className="compare-controls">
                <label className="field">
                  <span>Before</span>
                  <select value={left} onChange={(e) => setLeft(e.target.value)}>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.number} · {v.note}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>After</span>
                  <select value={right} onChange={(e) => setRight(e.target.value)}>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.number} · {v.note}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="button secondary"
                  onClick={() =>
                    api<Diff>(`${path}/compare?before=${left}&after=${right}`)
                      .then(setDiff)
                      .catch((e) => setError(e.message))
                  }
                >
                  Compare versions
                </button>
              </div>
              {diff && (
                <>
                  <div className="diff-counts">
                    {Object.entries(diff.counts).map(([kind, count]) => (
                      <span className={`diff-${kind.toLowerCase()}`} key={kind}>
                        {count} {kind}
                      </span>
                    ))}
                  </div>
                  {!diff.changes.length && (
                    <p className="notice">These versions have identical content.</p>
                  )}
                  {diff.changes.map((change, i) => (
                    <article className="diff-card" key={i}>
                      <header>
                        <span>{change.kind}</span>
                        <strong>{change.path.replace('document / ', '')}</strong>
                      </header>
                      <div>
                        <p className="diff-before">
                          {typeof change.before === 'string'
                            ? change.before
                            : JSON.stringify(change.before, null, 2)}
                        </p>
                        <p className="diff-after">
                          {typeof change.after === 'string'
                            ? change.after
                            : JSON.stringify(change.after, null, 2)}
                        </p>
                      </div>
                    </article>
                  ))}
                </>
              )}
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>
      </div>
      {restore && (
        <Drawer title={`Restore v${restore.number}?`} onClose={() => setRestore(null)}>
          <div className="drawer-form">
            <p>
              The current document will be saved as an automatic safety version first. Newer
              versions will remain in history.
            </p>
            <button
              className="button primary"
              onClick={async () => {
                try {
                  await flushSave()
                  const restored = await api<Resume>(
                    `${path}/${restore.id}/restore`,
                    json('POST', {
                      revision: useEditor.getState().resume!.revision,
                    })
                  )
                  useEditor.getState().open(restored)
                  setRestore(null)
                  await refresh()
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              Restore version
            </button>
          </div>
        </Drawer>
      )}
    </Drawer>
  )
}
