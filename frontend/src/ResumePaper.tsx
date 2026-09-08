import { CSSProperties } from 'react'
import { ResumeDocument, ResumeItem } from './resume-types'

export function safeLink(value: unknown) { return typeof value === 'string' && /^https?:\/\//i.test(value) ? value : undefined }
export function PaperItem({ item }: { item: ResumeItem }) {
  const d = item.data
  const title = String(d.position || d.name || d.title || d.statement || d.language || '')
  const subtitle = String(d.company || d.institution || d.issuer || d.venue || d.role || '')
  const date = String(d.start_date || d.date || d.year || '') + (d.current ? ' — Present' : d.end_date ? ` — ${d.end_date}` : '')
  const bullets = (d.bullets || []) as {id:string,text:string}[]
  return <div className="resume-item" data-item-id={item.id}><div className="resume-item-heading"><strong>{title}</strong><span className="resume-date">{date}</span></div>{subtitle && <div className="resume-subtitle">{subtitle}{d.location ? ` · ${d.location}` : ''}</div>}{d.degree && <div>{String(d.degree)}{d.field ? `, ${d.field}` : ''}{d.gpa ? ` · GPA ${d.gpa}` : ''}</div>}{d.description && <p>{String(d.description)}</p>}{bullets.length > 0 && <ul>{bullets.map(b => <li key={b.id}>{b.text}</li>)}</ul>}{(d.technologies as string[] | undefined)?.length ? <div className="resume-technologies">{(d.technologies as string[]).join(' · ')}</div> : null}{d.proficiency && <span>{String(d.proficiency)}</span>}{safeLink(d.url || d.credential_url) && <a href={safeLink(d.url || d.credential_url)}>{String(d.url || d.credential_url)}</a>}{safeLink(d.github) && <a href={safeLink(d.github)}>GitHub</a>}</div>
}

export default function ResumePaper({document:doc, onSelect, onPersonalChange, selected}: {document:ResumeDocument, onSelect?:(id:string)=>void, onPersonalChange?:(key:string,value:string)=>void, selected?:string}) {
  const p = doc.personal, s = doc.style
  const visible = (key:string) => !p.hidden_fields.includes(key)
  const style = {'--resume-accent':s.accent,'--resume-secondary':s.secondary,'--resume-text':s.text,'--resume-section-gap':`${s.section_spacing}px`,'--resume-bullet-gap':`${s.bullet_spacing}px`,fontFamily:s.font === 'System Sans' ? 'Arial, sans-serif' : s.font,fontSize:`${s.font_size}pt`,lineHeight:s.line_height,padding:`${s.margin}mm`,width:doc.style.page_size === 'A4' ? '210mm' : '215.9mm',minHeight:doc.style.page_size === 'A4' ? '297mm' : '279.4mm'} as CSSProperties
  const inline = (key:string) => onPersonalChange ? {contentEditable:true,suppressContentEditableWarning:true,onBlur:(e:React.FocusEvent<HTMLElement>) => onPersonalChange(key,e.currentTarget.textContent || ''),onKeyDown:(e:React.KeyboardEvent) => {if(e.key === 'Enter'){e.preventDefault();(e.target as HTMLElement).blur()}},'aria-label':`Edit ${key.replaceAll('_',' ')}`} : {}
  return <article className={`resume-paper template-${doc.template.toLowerCase().replaceAll(' ','-')} headings-${s.heading_style}`} style={style}>
    <header className={`resume-header ${selected === 'header' ? 'paper-selected' : ''}`} style={{textAlign:s.alignment}} onClick={() => onSelect?.('header')}><h1 {...inline('full_name')}>{p.full_name || 'Your name'}</h1>{visible('professional_title') && <div className="resume-title" {...inline('professional_title')}>{p.professional_title}</div>}<div className="resume-contact">{visible('email') && p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}{visible('phone') && p.phone && <span>{p.phone}</span>}{visible('city') && p.city && <span>{p.city}{visible('country') && p.country ? `, ${p.country}` : ''}</span>}{(['linkedin','github','portfolio','website'] as const).filter(key => visible(key) && safeLink(p[key])).map(key => <a key={key} href={p[key]}>{key === 'linkedin' ? 'LinkedIn' : key === 'github' ? 'GitHub' : key === 'portfolio' ? 'Portfolio' : 'Website'}</a>)}</div></header>
    {visible('summary') && p.summary && <section className={`resume-section ${selected === 'summary' ? 'paper-selected' : ''}`} onClick={() => onSelect?.('summary')}><h2>Professional Summary</h2><p {...inline('summary')}>{p.summary}</p></section>}
    <div className="resume-body">{doc.sections.filter(section => section.visible).map(section => <section className={`resume-section section-${section.kind} ${selected === section.id ? 'paper-selected' : ''}`} key={section.id} data-section-id={section.id} onClick={() => onSelect?.(section.id)}><h2>{section.heading}</h2>{section.kind === 'skills' ? <div className="resume-skills" style={{columns:section.columns}}>{section.items.map(i => String(i.data.name)).join(section.separator)}</div> : section.items.map(item => <PaperItem key={item.id} item={item}/>)}</section>)}</div>
  </article>
}
