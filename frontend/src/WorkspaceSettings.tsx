import { useEffect, useState } from 'react'
import { api, json } from './api'
import { downloadFile } from './CoverLetters'
export type Preferences = {
  theme: 'Light' | 'Dark' | 'System'
  widgets: { id: string; visible: boolean; width: number }[]
}
export function applyTheme(theme: Preferences['theme']) {
  document.documentElement.dataset.theme =
    theme === 'System'
      ? matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme.toLowerCase()
}
export default function WorkspaceSettings() {
  const [prefs, setPrefs] = useState<Preferences | null>(null),
    [tags, setTags] = useState<{ id: string; name: string; color: string; archived: boolean }[]>(
      []
    ),
    [name, setName] = useState(''),
    [color, setColor] = useState('#6b8b59'),
    [notice, setNotice] = useState(''),
    [backup, setBackup] = useState<any>(null),
    [counts, setCounts] = useState<Record<string, number> | null>(null),
    [approved, setApproved] = useState(false),
    [busy, setBusy] = useState(false),
    [ai, setAi] = useState<any>(null)
  const loadTags = () => api<typeof tags>('/tags').then(setTags)
  useEffect(() => {
    Promise.all([
      api<Preferences>('/preferences').then(setPrefs),
      loadTags(),
      api('/ai/status').then(setAi),
    ]).catch((e) => setNotice(e.message))
  }, [])
  async function readFile(file: File) {
    setBusy(true)
    setApproved(false)
    try {
      if (file.size > 50 * 1024 * 1024) throw new Error('Choose a JSON file smaller than 50 MB')
      const content = JSON.parse(await file.text())
      if (content.format === 'CareerCanvas Resume') {
        await api('/workspace/import-resume', json('POST', content))
        setNotice('Resume imported as a new independent document')
      } else {
        const result = await api<{ counts: Record<string, number> }>(
          '/workspace/restore/preview',
          json('POST', content)
        )
        setBackup(content)
        setCounts(result.counts)
        setNotice('Backup validated. Review the records before restoring.')
      }
    } catch (e) {
      setNotice((e as Error).message)
      setBackup(null)
      setCounts(null)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="settings-layout">
      <section className="dashboard-panel">
        <div className="panel-heading">
          <h2>Make it your workspace</h2>
          <span>APPEARANCE</span>
        </div>
        <p className="form-note">Your resume paper always stays print-appropriate.</p>
        <div className="theme-options">
          {(['Light', 'Dark', 'System'] as const).map((t) => (
            <button
              className={prefs?.theme === t ? 'selected' : ''}
              key={t}
              onClick={async () => {
                if (!prefs) return
                const next = { ...prefs, theme: t }
                try {
                  await api('/preferences', json('PUT', next))
                  setPrefs(next)
                  applyTheme(t)
                  window.dispatchEvent(new CustomEvent('career-theme', { detail: t }))
                  setNotice('Appearance saved')
                } catch (e) {
                  setNotice((e as Error).message)
                }
              }}
            >
              <span className={'theme-preview theme-' + t.toLowerCase()}>
                <i />
                <b />
              </span>
              {t}
            </button>
          ))}
        </div>
      </section>
      <section className="dashboard-panel">
        <div className="panel-heading">
          <h2>Your data, in your hands</h2>
          <span>BACKUP & MIGRATION</span>
        </div>
        <p className="form-note">
          Back up your profile, resumes, versions, applications, preparation, goals, tags, and
          preferences. API keys are excluded. Keep this private file somewhere you trust.
        </p>
        <button
          className="button primary"
          onClick={() =>
            downloadFile('/api/workspace/backup', 'CareerCanvas-backup.json', 'GET')
              .then(() => setNotice('Workspace backup downloaded'))
              .catch((e) => setNotice(e.message))
          }
        >
          Download complete workspace backup
        </button>
        <label className="file-import">
          <span>Import CareerCanvas resume or workspace JSON</span>
          <input
            type="file"
            accept=".json,application/json"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void readFile(f)
              e.target.value = ''
            }}
          />
        </label>
        {counts && (
          <div className="restore-preview">
            <h3>Restore preview</h3>
            <dl>
              {Object.entries(counts)
                .filter(([, n]) => n > 0)
                .map(([table, n]) => (
                  <div key={table}>
                    <dt>{table.replaceAll('_', ' ')}</dt>
                    <dd>{n}</dd>
                  </div>
                ))}
            </dl>
            <label className="selection-row">
              <input
                type="checkbox"
                checked={approved}
                onChange={(e) => setApproved(e.target.checked)}
              />
              Replace this workspace with the reviewed backup. A local safety backup will be created
              first.
            </label>
            <button
              className="button primary"
              disabled={!approved || busy}
              onClick={async () => {
                setBusy(true)
                try {
                  const r = await api<{ safety_backup: string }>(
                    '/workspace/restore',
                    json('POST', { backup, approved })
                  )
                  setNotice('Workspace restored. Safety backup: ' + r.safety_backup)
                  setBackup(null)
                  setCounts(null)
                  setApproved(false)
                  const p = await api<Preferences>('/preferences')
                  setPrefs(p)
                  applyTheme(p.theme)
                  void loadTags()
                } catch (e) {
                  setNotice((e as Error).message)
                } finally {
                  setBusy(false)
                }
              }}
            >
              Restore reviewed workspace
            </button>
          </div>
        )}
      </section>
      <section className="dashboard-panel">
        <div className="panel-heading">
          <h2>Organize with tags</h2>
          <span>WORKSPACE LABELS</span>
        </div>
        <p className="form-note">
          Rename a tag across career records. Deleting a tag removes the label and keeps the related
          records.
        </p>
        <div className="inline-form">
          <input
            aria-label="New tag name"
            placeholder="High Priority"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="color"
            aria-label="New tag color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <button
            disabled={!name.trim()}
            onClick={() =>
              api('/tags', json('POST', { name, color }))
                .then(() => {
                  setName('')
                  return loadTags()
                })
                .catch((e) => setNotice(e.message))
            }
          >
            Create tag
          </button>
        </div>
        {tags.map((t) => (
          <TagRow key={t.id} tag={t} onSaved={() => void loadTags()} onError={setNotice} />
        ))}
      </section>
      <section className="dashboard-panel">
        <div className="panel-heading">
          <h2>Private by default</h2>
          <span>LOCAL STORAGE</span>
        </div>
        <p className="form-note">
          CareerCanvas runs on your device with a local SQLite database. Resume file import is
          processed by the local CareerCanvas server and the original upload is not retained by the
          import workflow. Public GitHub metadata is fetched only when requested.
        </p>
        <div className="privacy-status">
          <span className="status-dot" />
          AI assistance: {ai?.enabled ? 'Enabled · ' + ai.provider : 'Disabled'}
        </div>
        <p className="form-note">
          Optional AI is configured in your local .env file. Gemini requests require consent and
          send only the selected source text. Ollama uses localhost. Suggestions always require
          review.
        </p>
        <p className="form-note">
          PDF, DOCX, and TXT resumes can be reviewed and mapped into the Career Profile. Scanned or
          image-only PDFs are detected, but automatic OCR is not bundled. DOCX export remains an
          editable single-column reconstruction and does not reproduce every visual template exactly.
        </p>
      </section>
      {notice && (
        <p role="status" className="notice settings-notice">
          {notice}
        </p>
      )}
    </div>
  )
}
function TagRow({
  tag,
  onSaved,
  onError,
}: {
  tag: { id: string; name: string; color: string; archived: boolean }
  onSaved: () => void
  onError: (s: string) => void
}) {
  const [draft, setDraft] = useState(tag),
    [confirm, setConfirm] = useState(false)
  return (
    <div className="tag-editor-row">
      <input
        aria-label={'Tag name ' + tag.name}
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
      />
      <input
        type="color"
        aria-label={'Tag color ' + tag.name}
        value={draft.color}
        onChange={(e) => setDraft({ ...draft, color: e.target.value })}
      />
      <label>
        <input
          type="checkbox"
          checked={draft.archived}
          onChange={(e) => setDraft({ ...draft, archived: e.target.checked })}
        />
        Archived
      </label>
      <button
        className="text-action"
        onClick={() => {
          const { id, ...payload } = draft
          void api('/tags/' + id, json('PUT', payload))
            .then(onSaved)
            .catch((e) => onError(e.message))
        }}
      >
        Save
      </button>
      <button className="text-action danger" onClick={() => setConfirm(true)}>
        Delete
      </button>
      {confirm && (
        <button
          className="button danger"
          onClick={() =>
            api('/tags/' + tag.id, { method: 'DELETE' })
              .then(onSaved)
              .catch((e) => onError(e.message))
          }
        >
          Confirm remove tag
        </button>
      )}
    </div>
  )
}
