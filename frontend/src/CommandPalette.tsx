import { useEffect, useState } from 'react'
import { Search, ArrowUpRight, Command } from 'lucide-react'
import { api } from './api'
import { Drawer } from './Profile'
export type SearchResult = {
  kind: string
  id: string
  title: string
  detail: string
}
export default function CommandPalette({
  onClose,
  onCommand,
  onResult,
  hasResume,
}: {
  onClose: () => void
  onCommand: (name: string) => void
  onResult: (r: SearchResult) => void
  hasResume: boolean
}) {
  const [query, setQuery] = useState(''),
    [results, setResults] = useState<SearchResult[]>([]),
    [index, setIndex] = useState(0),
    [error, setError] = useState('')
  const commands = [
    'Create Resume',
    'Open Resume',
    'Add Job',
    'Add Experience',
    'Add Achievement',
    'Open Applications',
    'Create Cover Letter',
    ...(hasResume ? ['Export Current Resume'] : []),
  ].filter((c) => c.toLowerCase().includes(query.toLowerCase()))
  useEffect(() => {
    let active = true
    const timer = setTimeout(
      () =>
        api<SearchResult[]>('/search?q=' + encodeURIComponent(query))
          .then((r) => {
            if (active) setResults(r)
          })
          .catch((e) => {
            if (active) setError(e.message)
          }),
      200
    )
    setIndex(0)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query])
  const choices = [
    ...commands.map((title) => ({
      title,
      detail: 'Command',
      action: () => onCommand(title),
    })),
    ...results.map((r) => ({
      title: r.title,
      detail: r.detail,
      action: () => onResult(r),
    })),
  ]
  return (
    <Drawer title="Find your next move" onClose={onClose}>
      <div
        className="command-palette"
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setIndex((i) => Math.min(choices.length - 1, i + 1))
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setIndex((i) => Math.max(0, i - 1))
          }
          if (e.key === 'Enter') {
            e.preventDefault()
            choices[index]?.action()
          }
        }}
      >
        <div className="command-search">
          <Search size={19} />
          <input
            autoFocus
            aria-label="Search workspace and commands"
            placeholder="Search anything, or jump to an action…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd>Esc</kbd>
        </div>
        <p className="eyebrow">COMMANDS & WORKSPACE RESULTS</p>
        <div className="command-results">
          {choices.map((c, i) => (
            <button
              className={index === i ? 'selected' : ''}
              key={i}
              onMouseEnter={() => setIndex(i)}
              onClick={c.action}
            >
              <Command size={14} />
              <span>
                {c.title}
                <small>{c.detail}</small>
              </span>
              <ArrowUpRight size={13} />
            </button>
          ))}
          {!choices.length && <p>No matching career records.</p>}
          {error && <p role="alert">{error}</p>}
        </div>
        <footer>↑ ↓ Navigate · Enter Open · Esc Close</footer>
      </div>
    </Drawer>
  )
}
