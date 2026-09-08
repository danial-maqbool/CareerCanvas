import { Children, ReactNode, useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react'
import { api, json } from './api'
import { Preferences } from './WorkspaceSettings'
const ids = ['pipeline', 'next', 'interviews', 'followups', 'goals', 'performance', 'activity']
const defaults = ids.map((id) => ({
  id,
  visible: true,
  width: ['pipeline', 'performance'].includes(id) ? 2 : 1,
}))
export default function DashboardWidgets({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences | null>(null),
    [editing, setEditing] = useState(false),
    [error, setError] = useState('')
  useEffect(() => {
    api<Preferences>('/preferences')
      .then(setPrefs)
      .catch((e) => setError(e.message))
  }, [])
  const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    ),
    nodes = Children.toArray(children),
    widgets = prefs?.widgets || defaults
  async function save(next: typeof widgets) {
    if (!prefs) return
    setPrefs({ ...prefs, widgets: next })
    try {
      await api('/preferences', json('PUT', { ...prefs, widgets: next }))
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <>
      <div className="dashboard-customize">
        <button className="text-action" onClick={() => setEditing(!editing)}>
          {editing ? 'Done customizing' : 'Customize dashboard'}
        </button>
        {editing && (
          <button className="text-action" onClick={() => void save(defaults)}>
            Reset to default
          </button>
        )}
        {error && <span role="alert">{error}</span>}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over.id)
            void save(
              arrayMove(
                widgets,
                widgets.findIndex((w) => w.id === active.id),
                widgets.findIndex((w) => w.id === over.id)
              )
            )
        }}
      >
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="dashboard-layout">
            {widgets.map((w, index) => (
              <Widget
                key={w.id}
                widget={w}
                editing={editing}
                onChange={(updated) => void save(widgets.map((x) => (x.id === w.id ? updated : x)))}
                move={(offset) => {
                  if (index + offset >= 0 && index + offset < widgets.length)
                    void save(arrayMove(widgets, index, index + offset))
                }}
              >
                {nodes[ids.indexOf(w.id)]}
              </Widget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  )
}
function Widget({
  widget,
  editing,
  onChange,
  move,
  children,
}: {
  widget: Preferences['widgets'][number]
  editing: boolean
  onChange: (w: Preferences['widgets'][number]) => void
  move: (offset: number) => void
  children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: widget.id,
    disabled: !editing,
  })
  if (!widget.visible && !editing) return null
  return (
    <div
      ref={setNodeRef}
      className={`dashboard-widget widget-width-${widget.width} ${!widget.visible ? 'widget-hidden' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {editing && (
        <div className="widget-controls">
          <button aria-label={'Drag widget ' + widget.id} {...attributes} {...listeners}>
            <GripVertical size={14} />
          </button>
          <span>{widget.id}</span>
          <button aria-label={'Move ' + widget.id + ' up'} onClick={() => move(-1)}>
            <ArrowUp size={13} />
          </button>
          <button aria-label={'Move ' + widget.id + ' down'} onClick={() => move(1)}>
            <ArrowDown size={13} />
          </button>
          <button
            aria-label={(widget.visible ? 'Hide ' : 'Show ') + widget.id}
            onClick={() => onChange({ ...widget, visible: !widget.visible })}
          >
            {widget.visible ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
          <select
            aria-label={'Width of ' + widget.id}
            value={widget.width}
            onChange={(e) => onChange({ ...widget, width: Number(e.target.value) })}
          >
            <option value="1">Small</option>
            <option value="2">Wide</option>
            <option value="3">Full</option>
          </select>
        </div>
      )}
      {widget.visible && children}
    </div>
  )
}
