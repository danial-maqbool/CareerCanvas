import { ArrowDown, ArrowUp, Eye, EyeOff } from 'lucide-react'
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
    <div className="section-list">
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
              <button className="section-select" onClick={() => onSelect(sec.id)}>
                <span>{sec.heading}</span>
                <small>{sec.items.length}</small>
              </button>
              <div className="section-row-actions">
                <button
                  className="icon-button"
                  aria-label={`${sec.visible ? 'Hide' : 'Show'} ${sec.heading}`}
                  onClick={() =>
                    change((r) => {
                      r.document.sections.find((s) => s.id === sec.id)!.visible = !sec.visible
                    })
                  }
                >
                  {sec.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button
                  className="icon-button"
                  disabled={index === 0}
                  aria-label={`Move ${sec.heading} up`}
                  onClick={() => move(sec.id, -1)}
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  className="icon-button"
                  disabled={index === sections.length - 1}
                  aria-label={`Move ${sec.heading} down`}
                  onClick={() => move(sec.id, 1)}
                >
                  <ArrowDown size={12} />
                </button>
              </div>
            </div>
          </SortableRow>
        ))}
      </SortableList>
    </div>
  )
}
