import { RotateCcw, SlidersHorizontal, WandSparkles } from 'lucide-react'
import { useEditor } from './editor-store'
import { ResumeStyle } from './resume-types'

const presets = [
  {
    name: 'Conservative',
    accent: '#273e50',
    secondary: '#667780',
    font: 'Arial',
  },
  {
    name: 'Technical',
    accent: '#236155',
    secondary: '#5c7c71',
    font: 'Calibri',
  },
  { name: 'Modern', accent: '#245c4b', secondary: '#6b7e74', font: 'Arial' },
  {
    name: 'Minimal',
    accent: '#303030',
    secondary: '#777777',
    font: 'System Sans',
  },
  {
    name: 'Research',
    accent: '#493b4d',
    secondary: '#7e6d80',
    font: 'Georgia',
  },
  {
    name: 'Executive',
    accent: '#4e4435',
    secondary: '#847762',
    font: 'Times New Roman',
  },
]

const standardHeadings: Record<string, string> = {
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  skills: 'Skills',
  certifications: 'Certifications',
  publications: 'Publications',
  achievements: 'Achievements',
  languages: 'Languages',
  references: 'References',
  portfolio: 'Portfolio',
}

const defaults: ResumeStyle = {
  font: 'Arial',
  font_size: 10.5,
  line_height: 1.4,
  margin: 16,
  section_spacing: 14,
  bullet_spacing: 4,
  accent: '#245c4b',
  secondary: '#6b7e74',
  text: '#263832',
  page_size: 'A4',
  alignment: 'left',
  heading_style: 'uppercase',
  date_style: 'short',
}

export default function StylePanel() {
  const style = useEditor((s) => s.resume!.document.style),
    change = useEditor((s) => s.change)
  function set<K extends keyof ResumeStyle>(key: K, value: ResumeStyle[K]) {
    change((r) => {
      r.document.style[key] = value
    })
  }

  function applyQuickLayout(mode: 'ats' | 'compact' | 'comfortable' | 'reset') {
    change((resume) => {
      const doc = resume.document
      if (mode === 'ats') {
        doc.template = 'Professional'
        doc.style = {
          ...doc.style,
          font: 'Arial',
          font_size: Math.max(10.5, doc.style.font_size),
          line_height: 1.3,
          margin: 16,
          section_spacing: 11,
          bullet_spacing: 3,
          alignment: 'left',
          heading_style: 'title',
        }
        doc.sections.forEach((section) => {
          section.columns = 1
          if (standardHeadings[section.kind]) section.heading = standardHeadings[section.kind]
        })
      } else if (mode === 'compact') {
        doc.style = {
          ...doc.style,
          font_size: Math.max(10, Math.min(10.5, doc.style.font_size)),
          line_height: 1.2,
          margin: 12,
          section_spacing: 8,
          bullet_spacing: 2,
        }
      } else if (mode === 'comfortable') {
        doc.style = {
          ...doc.style,
          font_size: Math.max(10.5, Math.min(11.5, doc.style.font_size)),
          line_height: 1.4,
          margin: 18,
          section_spacing: 15,
          bullet_spacing: 4,
        }
      } else {
        doc.style = { ...defaults }
      }
    })
  }

  const numericControls: {
    key: 'font_size' | 'line_height' | 'margin' | 'section_spacing' | 'bullet_spacing'
    label: string
    min: number
    max: number
    step: number
    unit: string
  }[] = [
    { key: 'font_size', label: 'Font size', min: 9, max: 16, step: 0.5, unit: 'pt' },
    { key: 'line_height', label: 'Line height', min: 1.1, max: 2, step: 0.05, unit: '' },
    { key: 'margin', label: 'Page margin', min: 8, max: 32, step: 1, unit: 'mm' },
    { key: 'section_spacing', label: 'Section spacing', min: 4, max: 32, step: 1, unit: 'px' },
    { key: 'bullet_spacing', label: 'Bullet spacing', min: 0, max: 16, step: 1, unit: 'px' },
  ]

  return (
    <>
      <p className="form-note">
        Every control updates the paper immediately. Use a quick layout first, then fine-tune exact values.
      </p>

      <div className="property-subheading">QUICK LAYOUT ACTIONS</div>
      <div className="design-quick-actions">
        <button className="button secondary" onClick={() => applyQuickLayout('ats')}>
          <WandSparkles size={14} /> ATS-safe layout
        </button>
        <button className="button secondary" onClick={() => applyQuickLayout('compact')}>
          <SlidersHorizontal size={14} /> Compact spacing
        </button>
        <button className="button secondary" onClick={() => applyQuickLayout('comfortable')}>
          <SlidersHorizontal size={14} /> Comfortable spacing
        </button>
        <button className="button secondary" onClick={() => applyQuickLayout('reset')}>
          <RotateCcw size={14} /> Reset design
        </button>
      </div>
      <p className="form-note">
        ATS-safe layout uses a single-column Professional template and standard headings. It never rewrites career content.
      </p>

      <div className="property-subheading">STYLE PRESETS</div>
      <div className="preset-grid">
        {presets.map((p) => (
          <button
            key={p.name}
            title={`Apply ${p.name} colors and font`}
            onClick={() =>
              change((r) => {
                r.document.style = {
                  ...r.document.style,
                  accent: p.accent,
                  secondary: p.secondary,
                  font: p.font,
                }
              })
            }
          >
            <span style={{ background: p.accent }} />
            {p.name}
          </button>
        ))}
      </div>
      <label className="field">
        <span>Font family</span>
        <select value={style.font} onChange={(e) => set('font', e.target.value as ResumeStyle['font'])}>
          {['Arial', 'Calibri', 'Georgia', 'Times New Roman', 'Verdana', 'System Sans'].map(
            (font) => (
              <option key={font}>{font}</option>
            )
          )}
        </select>
      </label>

      {numericControls.map((control) => (
        <label className="field range-field exact-range-field" key={control.key}>
          <span>
            {control.label}
            <output>
              {style[control.key]} {control.unit}
            </output>
          </span>
          <div className="range-with-number">
            <input
              aria-label={`${control.label} slider`}
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={style[control.key]}
              onChange={(e) => set(control.key, Number(e.target.value))}
            />
            <input
              aria-label={`${control.label} exact value`}
              type="number"
              min={control.min}
              max={control.max}
              step={control.step}
              value={style[control.key]}
              onChange={(e) => {
                const next = Number(e.target.value)
                if (!Number.isNaN(next) && next >= control.min && next <= control.max)
                  set(control.key, next)
              }}
            />
          </div>
        </label>
      ))}

      <div className="property-subheading">COLOR PALETTE</div>
      {[
        { key: 'accent', label: 'Primary color' },
        { key: 'secondary', label: 'Secondary color' },
        { key: 'text', label: 'Text color' },
      ].map((c) => (
        <label className="color-field" key={c.key}>
          <span>{c.label}</span>
          <input
            aria-label={c.label}
            type="color"
            value={style[c.key as 'accent']}
            onChange={(e) => set(c.key as 'accent', e.target.value)}
          />
          <code>{style[c.key as 'accent']}</code>
        </label>
      ))}

      <div className="property-subheading">PAGE & DETAILS</div>
      <label className="field">
        <span>Paper size</span>
        <select
          value={style.page_size}
          onChange={(e) => set('page_size', e.target.value as 'A4' | 'Letter')}
        >
          <option>A4</option>
          <option value="Letter">US Letter</option>
        </select>
      </label>
      <label className="field">
        <span>Header alignment</span>
        <select
          value={style.alignment}
          onChange={(e) => set('alignment', e.target.value as 'left' | 'center')}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
        </select>
      </label>
      <label className="field">
        <span>Heading style</span>
        <select
          value={style.heading_style}
          onChange={(e) => set('heading_style', e.target.value as ResumeStyle['heading_style'])}
        >
          <option value="uppercase">Uppercase</option>
          <option value="title">Title case</option>
          <option value="small-caps">Small caps</option>
        </select>
      </label>
      <label className="field">
        <span>Date style</span>
        <select
          value={style.date_style}
          onChange={(e) => set('date_style', e.target.value as ResumeStyle['date_style'])}
        >
          <option value="original">As entered</option>
          <option value="short">Sep 2026</option>
          <option value="long">September 2026</option>
        </select>
      </label>
      <p className="form-note">
        System fonts only. If a font is unavailable on this computer, the system uses its local fallback. Minimum font size is 9 pt; ATS review recommends 10.5 pt or larger when space allows.
      </p>
    </>
  )
}
