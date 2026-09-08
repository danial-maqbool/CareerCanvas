import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  FileText,
  LayoutDashboard,
  Layers,
  Leaf,
  Settings,
  Target,
  Trophy,
  UserRound,
  Video,
  Wrench,
  Search,
  Plus,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Profile, { ItemEditor } from './Profile'
import { api, json } from './api'
import Dashboard from './Dashboard'
import Analytics from './Analytics'
import Goals from './Goals'
import Interviews, { RecordEditor, CareerRecord, Collection } from './Interviews'
import Applications, { JobEditor, Job } from './Applications'
import './activity.css'
import CoverLetters, { downloadFile } from './CoverLetters'
import ResumeLibrary, { ResumeWizard } from './ResumeLibrary'
import ResumeEditor from './ResumeEditor'
import TemplateGallery from './TemplateGallery'
import { Resume } from './resume-types'
import { Kind, CareerItem, Profile as ProfileData } from './profile-types'
import CommandPalette, { SearchResult } from './CommandPalette'
import WorkspaceSettings, { applyTheme, Preferences } from './WorkspaceSettings'
import { flushSave } from './editor-store'
const navigation = [
  ['Dashboard', LayoutDashboard],
  ['Resumes', FileText],
  ['Career Profile', UserRound],
  ['Applications', BriefcaseBusiness],
  ['Cover Letters', FileText],
  ['Achievements', Trophy],
  ['Skills', Wrench],
  ['Portfolio', Layers],
  ['Interviews', Video],
  ['Career Goals', Target],
  ['Analytics', ChartNoAxesCombined],
  ['Templates', Layers],
  ['Settings', Settings],
] as const
export default function App() {
  const [page, setPage] = useState('Dashboard'),
    [notice, setNotice] = useState(''),
    [opened, setOpened] = useState<Resume | null>(null),
    [palette, setPalette] = useState(false),
    [quick, setQuick] = useState(''),
    [item, setItem] = useState<CareerItem | undefined>(),
    [job, setJob] = useState<Job | undefined>(),
    [record, setRecord] = useState<CareerRecord | undefined>(),
    [refresh, setRefresh] = useState(0)
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((p) => !p)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  async function navigate(name: string) {
    try {
      if (opened) await flushSave()
      setOpened(null)
      setPage(name)
      setPalette(false)
    } catch (e) {
      setNotice((e as Error).message)
    }
  }
  function add(kind: string) {
    setPalette(false)
    setQuick(kind)
    setItem(undefined)
    setJob(undefined)
    setRecord(undefined)
  }
  function closeQuick() {
    setQuick('')
    setRefresh((n) => n + 1)
  }
  async function command(name: string) {
    setPalette(false)
    if (name === 'Create Resume') add('Resume')
    else if (name === 'Open Resume') void navigate('Resumes')
    else if (name === 'Open Applications') void navigate('Applications')
    else if (name === 'Add Job') add('Job Application')
    else if (name === 'Add Experience') add('Experience')
    else if (name === 'Add Achievement') add('Achievement')
    else if (name === 'Create Cover Letter') {
      try {
        await api('/cover-letters', json('POST', { name: 'Untitled cover letter' }))
        void navigate('Cover Letters')
        setRefresh((n) => n + 1)
      } catch (e) {
        setNotice((e as Error).message)
      }
    } else if (name === 'Export Current Resume' && opened) {
      try {
        await flushSave()
        await downloadFile(`/api/resumes/${opened.id}/export/pdf`, opened.name + '.pdf')
        setNotice('PDF generated')
      } catch (e) {
        setNotice((e as Error).message)
      }
    }
  }
  async function result(r: SearchResult) {
    setPalette(false)
    try {
      if (r.kind === 'resumes') {
        await flushSave()
        setOpened(await api<Resume>('/resumes/' + r.id))
      } else if (r.kind === 'applications') {
        setJob((await api<Job[]>('/applications')).find((j) => j.id === r.id))
        setQuick('Job Application')
      } else if (r.kind === 'profile') {
        const p = await api<ProfileData>('/profile')
        setItem(p.items.find((i) => i.id === r.id))
        setQuick('Profile item')
      } else if (['interviews', 'contacts', 'stories', 'questions', 'goals'].includes(r.kind)) {
        setRecord((await api<CareerRecord[]>('/career/' + r.kind)).find((x) => x.id === r.id))
        setQuick(r.kind)
      } else void navigate('Cover Letters')
    } catch (e) {
      setNotice((e as Error).message)
    }
  }
  async function demo() {
    try {
      await api('/demo/workspace', json('POST'))
      setNotice(
        'Fictional demo workspace loaded — all people, employers and applications are examples'
      )
      setRefresh((n) => n + 1)
    } catch (e) {
      setNotice((e as Error).message)
    }
  }
  useEffect(() => {
    let theme: Preferences['theme'] = 'System'
    const media = matchMedia('(prefers-color-scheme: dark)'),
      update = () => applyTheme(theme)
    api<Preferences>('/preferences')
      .then((p) => {
        theme = p.theme
        update()
      })
      .catch(() => {})
    const change = (e: Event) => {
      theme = (e as CustomEvent).detail
      update()
    }
    media.addEventListener('change', update)
    window.addEventListener('career-theme', change)
    return () => {
      media.removeEventListener('change', update)
      window.removeEventListener('career-theme', change)
    }
  }, [])
  const profilePage = ['Career Profile', 'Skills', 'Achievements', 'Portfolio'].includes(page)
  const itemKind: Record<string, Kind> = {
    Experience: 'experience',
    Project: 'projects',
    Achievement: 'achievements',
    Skill: 'skills',
  }
  const recordKind: Record<string, Collection> = {
    Interview: 'interviews',
    Goal: 'goals',
    Contact: 'contacts',
    interviews: 'interviews',
    contacts: 'contacts',
    stories: 'stories',
    questions: 'questions',
    goals: 'goals',
  }
  return (
    <>
      {opened ? (
        <ResumeEditor
          onOpen={setOpened}
          initial={opened}
          onClose={() => {
            setOpened(null)
            setPage('Resumes')
          }}
        />
      ) : (
        <div className="app-shell">
          <aside className="sidebar">
            <a className="brand" href="/">
              <span className="brand-symbol">
                <Leaf size={22} />
              </span>
              CareerCanvas<span className="brand-dot">.</span>
            </a>
            <div className="workspace-label">PERSONAL WORKSPACE</div>
            <nav aria-label="Main navigation">
              {navigation.map(([name, Icon]) => (
                <button
                  key={name}
                  aria-label={name}
                  aria-current={page === name ? 'page' : undefined}
                  className={`nav-item ${page === name ? 'active' : ''}`}
                  onClick={() => void navigate(name)}
                >
                  <Icon size={18} />
                  <span>{name}</span>
                </button>
              ))}
            </nav>
            <div className="privacy-card">
              <span className="status-dot" />
              Local workspace
              <p>
                Your career. Your data.
                <br />
                Stored on this device.
              </p>
            </div>
            <div className="sidebar-user">
              <span className="avatar">Y</span>
              <div>
                Your workspace<small>Personal workspace · Local</small>
              </div>
            </div>
          </aside>
          <main className="main">
            <header className="topbar">
              <span>
                Workspace <span className="muted">/</span> <strong>{page}</strong>
              </span>
              <div className="topbar-actions">
                <button className="global-search-button" onClick={() => setPalette(true)}>
                  <Search size={14} />
                  <span>Search workspace</span>
                  <kbd>Ctrl K</kbd>
                </button>
                <details className="action-menu quick-add">
                  <summary className="button primary">
                    <Plus size={14} />
                    Add
                  </summary>
                  <div>
                    {[
                      'Resume',
                      'Job Application',
                      'Experience',
                      'Project',
                      'Achievement',
                      'Skill',
                      'Interview',
                      'Goal',
                      'Contact',
                    ].map((k) => (
                      <button
                        key={k}
                        onClick={(e) => {
                          e.currentTarget.closest('details')?.removeAttribute('open')
                          add(k)
                        }}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </details>
              </div>
            </header>
            <div className="page-content" key={refresh}>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">A LITTLE CLARITY. A LOT OF POSSIBILITY.</span>
                  <h1>{page === 'Dashboard' ? 'Your next chapter starts here.' : page}</h1>
                  <p className="muted">
                    One thoughtful space for your career, from first draft to next opportunity.
                  </p>
                </div>
                <span className="outline-label">LOCAL CAREER WORKSPACE</span>
              </div>
              {notice && (
                <p className="notice" role="status">
                  {notice}
                  <button className="text-action" onClick={() => setNotice('')}>
                    Dismiss
                  </button>
                </p>
              )}
              {page === 'Dashboard' ? (
                <Dashboard navigate={(name) => void navigate(name)} onDemo={demo} />
              ) : page === 'Analytics' ? (
                <Analytics />
              ) : page === 'Career Goals' ? (
                <Goals />
              ) : page === 'Interviews' ? (
                <Interviews />
              ) : page === 'Applications' ? (
                <Applications />
              ) : page === 'Cover Letters' ? (
                <CoverLetters />
              ) : page === 'Templates' ? (
                <TemplateGallery />
              ) : page === 'Resumes' ? (
                <ResumeLibrary onOpen={setOpened} />
              ) : profilePage ? (
                <Profile
                  key={page}
                  initialKind={
                    page === 'Skills'
                      ? 'skills'
                      : page === 'Achievements'
                        ? 'achievements'
                        : page === 'Portfolio'
                          ? 'portfolio'
                          : undefined
                  }
                />
              ) : (
                <WorkspaceSettings />
              )}
              <footer className="workspace-footer">
                <Leaf size={14} />A little progress, every day.
                <span>CareerCanvas · Local-first career management</span>
              </footer>
            </div>
          </main>
        </div>
      )}
      {palette && (
        <CommandPalette
          onClose={() => setPalette(false)}
          onCommand={(name) => void command(name)}
          onResult={(r) => void result(r)}
          hasResume={!!opened}
        />
      )}
      {quick === 'Resume' && (
        <ResumeWizard
          onClose={closeQuick}
          onCreated={(r) => {
            closeQuick()
            setOpened(r)
          }}
        />
      )}
      {quick === 'Job Application' && <JobEditor initial={job} onClose={closeQuick} />}
      {(itemKind[quick] || (quick === 'Profile item' && item)) && (
        <ItemEditor
          kind={item?.kind || itemKind[quick]}
          item={item}
          onClose={closeQuick}
          onSaved={() => setNotice('Career profile updated')}
        />
      )}
      {recordKind[quick] && (
        <RecordEditor kind={recordKind[quick]} initial={record} onClose={closeQuick} />
      )}
    </>
  )
}
