import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ResumePaper from './ResumePaper'
import { defaultStyle, templateInfo } from './templates'
import { ResumeDocument } from './resume-types'

const doc = {
  personal: {
    full_name: 'Test Engineer',
    professional_title: 'Software Engineer',
    email: 'test@example.com',
    phone: '555-0123',
    city: 'Austin',
    country: 'US',
    linkedin: '',
    github: '',
    portfolio: '',
    website: '',
    summary: 'A tested career summary.',
    hidden_fields: [],
  },
  style: defaultStyle,
  template: 'Modern',
  sections: ['experience', 'education', 'skills', 'projects'].map((kind) => ({
    id: kind,
    kind,
    heading: kind,
    visible: true,
    columns: 1,
    separator: ' · ',
    items: [
      {
        id: kind,
        source_id: null,
        kind,
        data:
          kind === 'skills'
            ? { name: 'Python' }
            : {
                name: `${kind} unique content`,
                description: `${kind} description`,
              },
      },
    ],
  })),
} as ResumeDocument
describe('template content contract', () => {
  it('academic continuation headings retain their document ordinal', () => {
    const page = { ...doc, template: 'Academic' as const, sections: doc.sections.slice(3) }
    const html = renderToStaticMarkup(
      <ResumePaper
        document={page}
        showHeader={false}
        showSummary={false}
        sectionOrder={doc.sections.map((section) => section.id)}
      />
    )
    expect(html).toContain('V. projects')
    expect(html).not.toContain('I. projects')
  })
  for (const template of templateInfo)
    it(`${template.name} retains all required sections`, () => {
      const before = JSON.stringify(doc)
      const html = renderToStaticMarkup(
        <ResumePaper document={{ ...doc, template: template.name }} />
      )
      for (const expected of [
        'Test Engineer',
        'test@example.com',
        'A tested career summary.',
        'experience unique content',
        'education unique content',
        'projects unique content',
        'Python',
      ])
        expect(html).toContain(expected)
      expect(JSON.stringify(doc)).toBe(before)
    })
})
