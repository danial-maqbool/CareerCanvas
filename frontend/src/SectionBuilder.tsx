import { ArrowDown, ArrowUp, Eye, EyeOff, MousePointerClick } from 'lucide-react'
import { ResumeSection } from './resume-types'
import { useEditor } from './editor-store'
import { SortableList, SortableRow } from './SortableList'

export default function SectionBuilder({
  sections,
  selected,
  onSelect,
}: {
  sections: ResumeSection[]
  selected: string
  onSelect: (id: string) => void
}) {
  const change = useEditor((s) => s.change)
  function move(id: string, offset: number) {
    change((r) => {
      const list = r.document.sections,
        index = list.findIndex((s) => s.id === id),
        target = index + offset
      if (target >= 0 && target < list.length) {
        const [item] = list.splice(index, 1)
        list.splice(target, 0, item)
      }
    })
  }
  return (
    <div className="section-list section-list-v2">
      <p className="section-list-help">
        <MousePointerClick size={13} /> Select a section to edit its heading, visibility, layout, and content.
      </p>
      <SortableList
        ids={sections.map((s) => s.id)}
        onReorder={(ids) =>
          change((r) => {
            r.document.sections = ids.map((id) => r.document.sections.find((s) => s.id === id)!)
          })
        }
      >
        {sections.map((sec, index) => (
          <SortableRow key={sec.id} id={sec.id} label={`${sec.heading} section`}>
            <div
              className={`section-row ${selected === sec.id ? 'selected' : ''} ${!sec.visible ? 'hidden-section' : ''}`}
            >
              <button
                className="section-select"
                title={`Edit ${sec.heading}`}
                onClick={() => onSelect(sec.id)}
              >
                <span>{sec.heading}</span>
                <small>{sec.items.length} item{sec.items.length === 1 ? '' : 's'}</small>
              </button>
              <div className="section-row-actions section-row-actions-v2">
                <button
                  className="section-action-button"
                  title={`${sec.visible ? 'Hide' : 'Show'} ${sec.heading}`}
                  aria-label={`${sec.visible ? 'Hide' : 'Show'} ${sec.heading}`}
                  onClick={() =>
                    change((r) => {
                      r.document.sections.find((s) => s.id === sec.id)!.visible = !sec.visible
                    })
                  }
                >
                  {sec.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  <span>{sec.visible ? 'Hide' : 'Show'}</span>
                </button>
                <button
                  className="section-action-button"
                  disabled={index === 0}
                  title={`Move ${sec.heading} up`}
                  aria-label={`Move ${sec.heading} up`}
                  onClick={() => move(sec.id, -1)}
                >
                  <ArrowUp size={12} />
                  <span>Up</span>
                </button>
                <button
                  className="section-action-button"
                  disabled={index === sections.length - 1}
                  title={`Move ${sec.heading} down`}
                  aria-label={`Move ${sec.heading} down`}
                  onClick={() => move(sec.id, 1)}
                >
                  <ArrowDown size={12} />
                  <span>Down</span>
                </button>
              </div>
            </div>
          </SortableRow>
        ))}
      </SortableList>
    </div>
  )
}
