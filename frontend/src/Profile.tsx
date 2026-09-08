import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowUpRight, BriefcaseBusiness, Check, GraduationCap, Pencil, Plus, Trash2, X } from 'lucide-react'
import { api, json } from './api'
import { CareerItem, fields, itemSubtitle, itemTitle, Kind, labels, Personal, Profile as ProfileData } from './profile-types'

export function Drawer({ title, onClose, children, wide }: { title: string, onClose: () => void, children: React.ReactNode, wide?:boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close() }, [])
  return <dialog className={`drawer ${wide?"wide-drawer":""}`} ref={ref} onCancel={onClose} onClick={e => { if (e.target === ref.current) onClose() }}><div className="drawer-inner"><header><div><span className="eyebrow">CAREER WORKSPACE</span><h2>{title}</h2></div><button className="icon-button" aria-label="Close drawer" onClick={onClose}><X size={20}/></button></header>{children}</div></dialog>
}

export function ItemEditor({ kind, item, onClose, onSaved, saveLocal }: { kind: Kind, item?: CareerItem, onClose: () => void, onSaved: () => void, saveLocal?: (data:CareerItem['data'])=>void }) {
  const shape: Record<string, z.ZodType> = {}
  const defaults: Record<string, unknown> = {}
  for (const field of fields[kind]) {
    shape[field.key] = field.type === 'check' ? z.boolean() : field.required ? z.string().trim().min(1, `${field.label} is required`).max(10000) : z.string().max(10000)
    const value = item?.data[field.key]
    defaults[field.key] = field.type === 'check' ? Boolean(value) : field.type === 'bullets' ? (value as {text:string}[] | undefined)?.map(b => b.text).join('\n') || '' : Array.isArray(value) ? value.join(', ') : value || (kind === 'skills' && field.key === 'category' ? 'Other' : field.options?.[0] || '')
  }
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: defaults, resolver: zodResolver(z.object(shape)) })
  const [error, setError] = useState('')
  const submit = handleSubmit(async values => {
    const data = { ...values }
    for (const field of fields[kind]) {
      if (field.type === 'list') data[field.key] = String(values[field.key]).split(',').map(v => v.trim()).filter(Boolean)
      if (field.type === 'bullets') data[field.key] = String(values[field.key]).split('\n').map(v => v.trim()).filter(Boolean).map((text, index) => ({ id: (item?.data[field.key] as {id:string}[] | undefined)?.[index]?.id || crypto.randomUUID(), text }))
    }
    try { if(saveLocal) saveLocal(data as CareerItem['data']); else await api(`/profile/items${item ? `/${item.id}` : ''}`, json(item ? 'PUT' : 'POST', { kind, data })); onSaved(); onClose() } catch (e) { setError((e as Error).message) }
  })
  return <Drawer title={`${item ? 'Edit' : 'Add'} ${labels[kind]}`} onClose={onClose}><form onSubmit={submit} className="drawer-form"><p className="form-note">{saveLocal ? 'Edit this resume only. Your Career Profile and other resumes stay independent.' : 'Saved to your reusable Career Profile. Existing resume copies stay independent.'}</p>{fields[kind].map(field => <label className={`field ${field.type === 'check' ? 'checkbox-field' : ''}`} key={field.key}><span>{field.label}{field.required && ' *'}</span>{field.type === 'check' ? <input type="checkbox" {...register(field.key)}/> : field.type === 'select' ? <select {...register(field.key)}>{field.options!.map(option => <option key={option}>{option}</option>)}</select> : field.type === 'long' || field.type === 'bullets' ? <textarea rows={field.type === 'bullets' ? 5 : 3} {...register(field.key)}/> : <input {...register(field.key)}/>} {errors[field.key] && <small className="error">{String(errors[field.key]?.message)}</small>}</label>)}{error && <p role="alert" className="error">{error}</p>}<div className="drawer-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : saveLocal ? 'Save to resume' : 'Save to profile'}</button></div></form></Drawer>
}

function About({ personal, onSaved }: { personal: Personal, onSaved: () => void }) {
  const [data, setData] = useState(personal)
  const [status, setStatus] = useState('')
  return <form className="about-form panel" onSubmit={async e => { e.preventDefault(); setStatus('Saving…'); try { await api('/profile/personal', json('PUT', data)); setStatus('Profile saved'); onSaved() } catch (error) { setStatus((error as Error).message) } }}><div className="panel-heading"><div><h3>The person behind the resume</h3><p>Your contact details and a little about where you want to go.</p></div></div><div className="form-grid">{Object.keys(personal).filter(key => key !== 'hidden_fields' && key !== 'summary').map(key => <label className="field" key={key}><span>{key.replaceAll('_', ' ')}</span><input type={key === 'email' ? 'email' : 'text'} value={String(data[key as keyof Personal])} onChange={e => setData({ ...data, [key]: e.target.value })}/></label>)}<label className="field full-width"><span>Professional summary</span><textarea rows={5} value={data.summary} onChange={e => setData({ ...data, summary: e.target.value })}/></label></div><div className="form-bottom"><span role="status">{status}</span><button className="button primary">Save personal details</button></div></form>
}

export default function Profile({ initialKind }: { initialKind?: Kind }) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [tab, setTab] = useState<Kind | 'about'>(initialKind || 'about')
  const [editing, setEditing] = useState<{kind: Kind, item?: CareerItem} | null>(null)
  const [deleting, setDeleting] = useState<CareerItem | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const refresh = () => { api<ProfileData>('/profile').then(setProfile).catch(e => setError(e.message)) }
  useEffect(refresh, [])
  useEffect(() => { setTab(initialKind || 'about') }, [initialKind])
  if (!profile) return <div className="panel loading-state">{error || 'Opening your career profile…'}</div>
  const visible = profile.items.filter(item => item.kind === tab)
  return <>
    <div className="profile-banner"><span className="profile-avatar">{profile.personal.full_name.split(' ').map(n => n[0]).slice(0,2).join('') || 'Y'}</span><div><span className="eyebrow">YOUR PROFESSIONAL FOUNDATION</span><h2>{profile.personal.full_name || 'Your career, all together.'}</h2><p>{profile.personal.professional_title || 'Add your story once. Make it work for every opportunity.'}</p></div><div className="completion"><span>Profile completeness <strong>{profile.completion.score}%</strong></span><div className="progress-track"><div style={{width:`${profile.completion.score}%`}}/></div><small>{profile.completion.suggestions[0] || 'Your essentials are in place.'}</small></div></div>
    {!initialKind && <div className="tabs" role="tablist" aria-label="Career profile sections">{(['about', ...Object.keys(labels)] as (Kind | 'about')[]).map(kind => <button role="tab" aria-selected={tab === kind} key={kind} onClick={() => setTab(kind)}>{kind === 'about' ? 'About' : labels[kind]}{kind !== 'about' && <span>{profile.items.filter(i => i.kind === kind).length}</span>}</button>)}</div>}
    {notice && <p className="notice" role="status"><Check size={14}/>{notice}</p>}{error && <p role="alert" className="error">{error}</p>}
    {tab === 'about' ? <About key={profile.id} personal={profile.personal} onSaved={refresh}/> : <><div className="section-toolbar"><div><h2>{labels[tab]} <span className="count-badge">{visible.length}</span></h2><p>{tab === 'references' ? 'Private by default. Include references in a resume only when explicitly selected.' : 'A growing library of what you bring to the table.'}</p></div><button className="button primary" onClick={() => setEditing({kind:tab})}><Plus size={15}/> Add {labels[tab]}</button></div><div className={tab === 'skills' ? 'skills-grid' : 'content-grid'}>{visible.map(item => <article className={`panel content-card kind-${item.kind}`} key={item.id}><div className="card-heading"><span className="item-icon">{item.kind === 'education' ? <GraduationCap size={20}/> : <BriefcaseBusiness size={20}/>}</span><div className="card-actions"><button className="icon-button" aria-label={`Edit ${itemTitle(item)}`} onClick={() => setEditing({kind:item.kind,item})}><Pencil size={15}/></button><button className="icon-button" aria-label={`Delete ${itemTitle(item)}`} onClick={() => setDeleting(item)}><Trash2 size={15}/></button></div></div><h3>{itemTitle(item)}</h3><p className="item-subtitle">{itemSubtitle(item)}</p>{(item.data.start_date || item.data.date || item.data.year) && <span className="item-date">{String(item.data.start_date || item.data.date || item.data.year)}{item.data.current ? ' — Present' : item.data.end_date ? ` — ${item.data.end_date}` : ''}</span>}{item.data.description && <p className="item-description">{String(item.data.description)}</p>}{Array.isArray(item.data.bullets) && <ul className="career-bullets">{(item.data.bullets as {id:string,text:string}[]).map(b => <li key={b.id}>{b.text}</li>)}</ul>}<div className="chips">{((item.data.technologies || item.data.skills || []) as string[]).map(t => <span className="chip" key={t}>{t}</span>)}</div>{typeof item.data.url === 'string' && /^https?:\/\//.test(item.data.url) && <a className="text-link" href={item.data.url} target="_blank" rel="noreferrer">View project <ArrowUpRight size={13}/></a>}</article>)}</div>{!visible.length && <div className="empty-state panel"><div className="empty-icon"><Plus size={25}/></div><h3>A place for your {labels[tab].toLowerCase()}.</h3><p>Add only what matters to your career. Reuse it across your resumes.</p><button className="button secondary" onClick={() => setEditing({kind:tab})}>Add your first entry</button></div>}</>}
    {editing && <ItemEditor {...editing} onClose={() => setEditing(null)} onSaved={() => { refresh(); setNotice('Career profile updated') }}/>} {deleting && <Drawer title="Delete career item?" onClose={() => setDeleting(null)}><div className="drawer-form"><p>Delete “{itemTitle(deleting)}” from your profile? Existing resume copies retain their content.</p><div className="drawer-actions"><button className="button secondary" onClick={() => setDeleting(null)}>Cancel</button><button className="button danger" onClick={async () => { try { await api(`/profile/items/${deleting.id}`,json('DELETE')); setDeleting(null); refresh(); setNotice('Career item deleted') } catch(e){setError((e as Error).message)} }}>Delete item</button></div></div></Drawer>}
  </>
}
