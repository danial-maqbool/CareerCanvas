import { useEffect, useState } from 'react'
import { ArrowRight, Check, Eye, LayoutGrid } from 'lucide-react'
import { api } from './api'
import { Profile } from './profile-types'
import { ResumeDocument } from './resume-types'
import ResumePaper from './ResumePaper'
import { profileDocument, templateInfo } from './templates'
import { Drawer } from './Profile'

export default function TemplateGallery({
  document: provided,
  onChoose,
}: {
  document?: ResumeDocument
  onChoose?: (name: string) => void
}) {
  const [doc, setDoc] = useState<ResumeDocument | undefined>(provided),
    [filter, setFilter] = useState('All templates'),
    [preview, setPreview] = useState<string | null>(null),
    [error, setError] = useState('')
  useEffect(() => {
    if (provided) setDoc(provided)
    else
      api<Profile>('/profile')
        .then((p) => setDoc(profileDocument(p)))
        .catch((e) => setError(e.message))
  }, [provided])
  return (
    <div className="template-gallery">
      <div className="gallery-intro">
        <span className="eyebrow">GOOD DESIGN MAKES YOUR STORY CLEARER.</span>
        <h2>Find your paper personality.</h2>
        <p>
          Twelve distinct layouts. Your content, always intact. Preview with your own career data.
        </p>
      </div>
      <div className="template-filters" aria-label="Filter templates">
        {[
          'All templates',
          'ATS Friendly',
          'Single Column',
          'Two Column',
          'Technical',
          'Academic',
          'Corporate',
          'Minimal',
          'Creative',
          'One Page',
          'Multi Page',
        ].map((tag) => (
          <button key={tag} aria-pressed={filter === tag} onClick={() => setFilter(tag)}>
            {tag}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      <div className="template-grid">
        {templateInfo
          .filter((t) => filter === 'All templates' || t.tags.includes(filter))
          .map((template, index) => (
            <article className="template-card" key={template.name}>
              <button
                className={`template-thumbnail tone-${index % 4}`}
                aria-label={`Preview ${template.name} with my data`}
                onClick={() => setPreview(template.name)}
              >
                {doc && (
                  <div className="template-paper">
                    <ResumePaper document={{ ...doc, template: template.name }} />
                  </div>
                )}
                <span className="template-preview-label">
                  <Eye size={13} />
                  Preview with my data
                </span>
              </button>
              <div className="template-card-details">
                <div>
                  <h3>{template.name}</h3>
                  {doc?.template === template.name && (
                    <span className="current-template">
                      <Check size={10} />
                      Current
                    </span>
                  )}
                </div>
                <p>{template.description}</p>
                <div className="template-tags">
                  {template.tags.slice(0, 2).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                {onChoose && (
                  <button className="text-action" onClick={() => onChoose(template.name)}>
                    Use template <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </article>
          ))}
      </div>
      {preview && doc && (
        <Drawer title={`${preview} · With your data`} wide onClose={() => setPreview(null)}>
          <div className="full-template-preview">
            <div className="template-preview-actions">
              <span>Changing a template preserves all content and hidden sections.</span>
              {onChoose && (
                <button
                  className="button primary"
                  onClick={() => {
                    onChoose(preview)
                    setPreview(null)
                  }}
                >
                  Apply {preview}
                </button>
              )}
            </div>
            <div className="template-preview-paper">
              <ResumePaper document={{ ...doc, template: preview }} />
            </div>
          </div>
        </Drawer>
      )}
    </div>
  )
}
