import { useState } from 'react'
import { api, json } from './api'
import { Drawer } from './Profile'
export default function GitHubImport({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [url, setUrl] = useState(''),
    [repo, setRepo] = useState<{
      name: string
      description: string
      languages: string[]
      stars: number
      topics: string[]
      url: string
    } | null>(null),
    [selected, setSelected] = useState(['name', 'description', 'languages', 'url']),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  return (
    <Drawer title="Bring in a public project" onClose={onClose}>
      <div className="drawer-form">
        <p className="form-note">
          This retrieves public metadata from GitHub. Review which fields to import; descriptions
          are copied from the repository, never invented. Repository languages are project metadata
          and are not automatically added as your skills.
        </p>
        <label className="field">
          <span>Public GitHub repository URL</span>
          <input
            placeholder="https://github.com/owner/repository"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
        <button
          className="button primary"
          disabled={busy || !url}
          onClick={async () => {
            setBusy(true)
            setError('')
            try {
              setRepo(await api('/import/github-preview', json('POST', { url })))
            } catch (e) {
              setError((e as Error).message)
            } finally {
              setBusy(false)
            }
          }}
        >
          Retrieve public metadata
        </button>
        {error && <p role="alert">{error}</p>}
        {repo && (
          <>
            <h3>{repo.name}</h3>
            <p>
              {repo.stars} stars · {repo.topics.join(', ')}
            </p>
            {['name', 'description', 'languages', 'url'].map((k) => (
              <label className="selection-row" key={k}>
                <input
                  type="checkbox"
                  checked={selected.includes(k)}
                  disabled={k === 'name'}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? [...selected, k] : selected.filter((s) => s !== k)
                    )
                  }
                />
                <span>
                  <strong>{k}</strong>
                  <br />
                  {String(repo[k as keyof typeof repo])}
                </span>
              </label>
            ))}
            <button
              className="button primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await api(
                    '/profile/items',
                    json('POST', {
                      kind: 'projects',
                      data: {
                        name: repo.name,
                        description: selected.includes('description') ? repo.description : '',
                        technologies: selected.includes('languages') ? repo.languages : [],
                        github: selected.includes('url') ? repo.url : '',
                      },
                    })
                  )
                  onSaved()
                  onClose()
                } catch (e) {
                  setError((e as Error).message)
                } finally {
                  setBusy(false)
                }
              }}
            >
              Import selected project fields
            </button>
          </>
        )}
      </div>
    </Drawer>
  )
}
