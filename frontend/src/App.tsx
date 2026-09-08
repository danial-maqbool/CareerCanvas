import { ArrowUpRight, BriefcaseBusiness, ChartNoAxesCombined, FileText, LayoutDashboard, Layers, Leaf, Settings, Sparkles, Target, Trophy, UserRound, Video, Wrench } from 'lucide-react'
import { useState } from 'react'
import Profile from './Profile'
import { api, json } from './api'
import ResumeLibrary from './ResumeLibrary'
import ResumeEditor from './ResumeEditor'
import TemplateGallery from './TemplateGallery'
import { Resume } from './resume-types'

const navigation = [
  ['Dashboard', LayoutDashboard], ['Resumes', FileText], ['Career Profile', UserRound],
  ['Applications', BriefcaseBusiness], ['Cover Letters', FileText], ['Achievements', Trophy],
  ['Skills', Wrench], ['Portfolio', Layers], ['Interviews', Video], ['Career Goals', Target],
  ['Analytics', ChartNoAxesCombined], ['Templates', Layers], ['Settings', Settings],
] as const

export default function App() {
  const [page, setPage] = useState('Dashboard')
  const [notice, setNotice] = useState('')
  const [opened, setOpened] = useState<Resume|null>(null)
  const profilePage = ['Career Profile', 'Skills', 'Achievements', 'Portfolio'].includes(page)
  if(opened) return <ResumeEditor initial={opened} onClose={()=>setOpened(null)}/>
  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="/"><span className="brand-symbol"><Leaf size={22}/></span>CareerCanvas<span className="brand-dot">.</span></a>
      <div className="workspace-label">PERSONAL WORKSPACE</div>
      <nav aria-label="Main navigation">{navigation.map(([name, Icon]) => <button key={name} aria-label={name} aria-current={page === name ? 'page' : undefined} className={`nav-item ${page === name ? 'active' : ''}`} onClick={() => setPage(name)}><Icon size={18}/><span>{name}</span>{name === 'Resumes' && <span className="nav-count">0</span>}</button>)}</nav>
      <div className="privacy-card"><span className="status-dot"/> Local workspace<p>Your career. Your data.<br/>Stored on this device.</p></div>
      <div className="sidebar-user"><span className="avatar">Y</span><div>Your workspace<small>Personal account · Local</small></div></div>
    </aside>
    <main className="main"><header className="topbar"><span>Workspace <span className="muted">/</span> <strong>{page}</strong></span><span className="local-label"><span className="status-dot"/>Private by default</span></header>
      <div className="page-content"><div className="page-heading"><div><span className="eyebrow">A LITTLE CLARITY. A LOT OF POSSIBILITY.</span><h1>{page === 'Dashboard' ? 'Your next chapter starts here.' : page}</h1><p className="muted">One thoughtful space for your career, from first draft to next opportunity.</p></div><span className="outline-label">WORKSPACE FOUNDATION</span></div>
        {notice && <p className="notice" role="status">{notice}</p>}
        {page === 'Templates' ? <TemplateGallery/> : page === 'Resumes' ? <ResumeLibrary onOpen={setOpened}/> : profilePage ? <Profile key={page} initialKind={page === 'Skills' ? 'skills' : page === 'Achievements' ? 'achievements' : page === 'Portfolio' ? 'portfolio' : undefined}/> : <><section className="welcome-panel"><div><span className="pill"><Sparkles size={14}/> MADE FOR YOUR NEXT MOVE</span><h2>Build your career workspace.</h2><p>Bring your experience together. Shape a resume that feels like you.<br/>Make room for what comes next.</p><div style={{display:'flex',gap:10,marginTop:24,flexWrap:'wrap'}}><button className="button primary" onClick={() => setPage('Career Profile')}>Build my career profile <ArrowUpRight size={14}/></button><button className="button secondary" onClick={async () => { try { await api('/demo/profile', json('POST')); setNotice('Fictional demo career loaded'); setPage('Career Profile') } catch(e) {setNotice((e as Error).message)} }}>Load Demo Career</button></div><p className="foundation-note">Demo data is fictional. Your personal career information stays on this device.</p></div><div className="paper-illustration" aria-hidden="true"><span className="paper-line title-line"/><span className="paper-line short-line"/><hr/><span className="paper-line"/><span className="paper-line"/><span className="paper-line short-line"/><hr/><span className="paper-line"/><span className="paper-line"/><span className="paper-line"/><div className="paper-seal"><Leaf size={24}/></div></div></section>
        <div className="starter-grid">{[['01', 'Your story, together', 'A reusable career profile for your experience, skills, and achievements.'], ['02', 'A resume for every opportunity', 'Independent documents with thoughtful typography and clear structure.'], ['03', 'A clearer path forward', 'Applications, interviews, and goals in a single local workspace.']].map(([number, title, description]) => <article className="starter-card" key={number}><span className="step-number">{number}</span><ArrowUpRight size={18}/><h3>{title}</h3><p>{description}</p></article>)}</div>
        </>}<footer className="workspace-footer"><Leaf size={14}/> A little progress, every day.<span>CareerCanvas · Local-first career management</span></footer>
      </div>
    </main>
  </div>
}
