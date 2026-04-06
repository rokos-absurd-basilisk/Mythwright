// ============================================================
// MYTHWRIGHT — OUTLINER VIEW
// Spreadsheet-style beat table. Inline edit on every cell.
// Click column header to sort. dnd-kit row drag to reorder.
// ============================================================
import { useState, useCallback } from 'react'
import {
  DndContext, PointerSensor, useSensor, useSensors,
  closestCenter, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { useBoundStore, useBeats, useUI } from '../../store'
import { type Beat, type StatusType } from '../../types'
import { clsx } from 'clsx'

const STATUS_LABELS: Record<StatusType, string> = {
  draft:'Draft', in_progress:'In Progress', final:'Final', blocked:'Blocked'
}
const STATUS_CYCLE: StatusType[] = ['draft', 'in_progress', 'final', 'blocked']
const STATUS_COLOURS: Record<StatusType, string> = {
  draft:'var(--status-draft)', in_progress:'var(--status-progress)',
  final:'var(--status-final)', blocked:'var(--status-blocked)',
}

type SortKey = 'position' | 'title' | 'status'
type SortDir = 'asc' | 'desc'

function SortableRow({ beat, index }: { beat: Beat; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: beat.id })
  const setSelectedBeat = useBoundStore(s => s.setSelectedBeat)
  const updateBeat      = useBoundStore(s => s.updateBeat)
  const { selectedBeatId } = useUI()
  const isSelected = selectedBeatId === beat.id

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation()
    const cur = STATUS_CYCLE.indexOf(beat.status)
    const next = STATUS_CYCLE[(cur + 1) % STATUS_CYCLE.length]
    updateBeat(beat.id, { status: next })
  }

  return (
    <tr ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      onClick={() => setSelectedBeat(beat.id)}
      className={clsx(
        'cursor-pointer transition-colors duration-[var(--dur-fast)] group',
        isSelected ? 'bg-[var(--accent-teal-10)]' : 'hover:bg-[var(--bg-card-hover)]'
      )}>
      {/* Drag handle */}
      <td className="px-1 py-2 w-6">
        <span {...attributes} {...listeners}
          className="opacity-0 group-hover:opacity-100 cursor-grab transition-opacity flex items-center">
          <GripVertical size={12} className="text-[var(--text-muted)]"/>
        </span>
      </td>
      {/* Position */}
      <td className="px-3 py-2 text-[11px] text-[var(--text-muted)] w-10 text-center font-[family-name:var(--font-mono)]">
        {index + 1}
      </td>
      {/* Label stripe */}
      <td className="px-1 py-2 w-1">
        <span className="block w-[3px] h-5 rounded-full" style={{ background: beat.labelColour || 'var(--accent-teal)' }}/>
      </td>
      {/* Title — inline edit */}
      <td className="px-3 py-2 min-w-[180px]">
        <input value={beat.title}
          onChange={e => updateBeat(beat.id, { title: e.target.value })}
          onClick={e => e.stopPropagation()}
          className="w-full bg-transparent text-[13px] font-medium text-[var(--text-primary)] outline-none border-b border-transparent focus:border-[var(--border-active)] transition-colors"
          placeholder="Untitled"
        />
      </td>
      {/* Synopsis — inline edit */}
      <td className="px-3 py-2 max-w-[280px]">
        <input value={beat.synopsis}
          onChange={e => updateBeat(beat.id, { synopsis: e.target.value })}
          onClick={e => e.stopPropagation()}
          className="w-full bg-transparent text-[12px] text-[var(--text-secondary)] outline-none border-b border-transparent focus:border-[var(--border-active)] transition-colors truncate"
          placeholder="Synopsis…"
        />
      </td>
      {/* Status — click to cycle */}
      <td className="px-3 py-2 w-28">
        <button onClick={cycleStatus}
          className="text-[10px] font-medium px-2 py-0.5 rounded-[var(--radius-pill)] hover:opacity-80 transition-opacity"
          style={{ background: `${STATUS_COLOURS[beat.status]}22`, color: STATUS_COLOURS[beat.status] }}
          title="Click to change status">
          {STATUS_LABELS[beat.status]}
        </button>
      </td>
      {/* Micro-beat */}
      <td className="px-3 py-2 w-16 text-center">
        {beat.isMicroBeat && <span className="text-[10px] text-[var(--accent-orange)]">⚡</span>}
      </td>
    </tr>
  )
}

function SortIndicator({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <span className="opacity-0 group-hover:opacity-30 ml-1"><ChevronUp size={10}/></span>
  return sortDir === 'asc'
    ? <ChevronUp   size={10} className="ml-1 text-[var(--accent-orange)]"/>
    : <ChevronDown size={10} className="ml-1 text-[var(--accent-orange)]"/>
}

export function OutlinerView({ outlineId }: { outlineId: string }) {
  const beats   = useBeats(outlineId)
  const addBeat = useBoundStore(s => s.addBeat)
  const updateBeat = useBoundStore(s => s.updateBeat)
  const [sortKey, setSortKey] = useState<SortKey>('position')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...beats].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'title')    cmp = a.title.localeCompare(b.title)
    else if (sortKey === 'status') cmp = STATUS_CYCLE.indexOf(a.status) - STATUS_CYCLE.indexOf(b.status)
    else cmp = a.position - b.position
    return sortDir === 'asc' ? cmp : -cmp
  })

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = sorted.findIndex(b => b.id === active.id)
    const newIdx = sorted.findIndex(b => b.id === over.id)
    if (oldIdx < 0 || newIdx < 0) return
    const reordered = arrayMove(sorted, oldIdx, newIdx)
    reordered.forEach((b, i) => updateBeat(b.id, { position: i }))
  }, [sorted, updateBeat])

  const Th = ({ col, label, className = '' }: { col: SortKey; label: string; className?: string }) => (
    <th
      className={`px-3 py-2 text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-[family-name:var(--font-heading)] text-left cursor-pointer hover:text-[var(--accent-orange)] transition-colors group select-none ${className}`}
      onClick={() => handleSort(col)}>
      {label}<SortIndicator col={col} sortKey={sortKey} sortDir={sortDir}/>
    </th>
  )

  return (
    <div className="flex-1 overflow-hidden flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] sticky top-0 z-10" style={{ background: 'var(--bg-secondary)' }}>
              <th className="w-6"/>
              <th className="px-3 py-2 text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-[family-name:var(--font-heading)] text-center w-10">#</th>
              <th className="w-1"/>
              <Th col="title"    label="Title"/>
              <th className="px-3 py-2 text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-[family-name:var(--font-heading)] text-left">Synopsis</th>
              <Th col="status"   label="Status"  className="w-28"/>
              <th className="px-3 py-2 text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-[family-name:var(--font-heading)] text-center w-16">Type</th>
            </tr>
          </thead>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sorted.map(b => b.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {sorted.map((beat, i) => <SortableRow key={beat.id} beat={beat} index={i}/>)}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>

        {beats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-[var(--text-muted)] text-sm">No beats yet.</p>
            <button onClick={() => addBeat(outlineId, 'New Beat')}
              className="text-[var(--accent-orange)] text-sm hover:text-[var(--accent-orange-dim)] transition-colors">
              + Add your first beat
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-subtle)] flex-shrink-0"
        style={{ background: 'var(--bg-secondary)' }}>
        <span className="text-[11px] text-[var(--text-muted)]">{beats.length} beats</span>
        <button onClick={() => addBeat(outlineId, 'New Beat')}
          className="flex items-center gap-1.5 px-3 h-7 rounded-[var(--radius-pill)] text-[11px] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors duration-[var(--dur-fast)]">
          + Add Beat
        </button>
      </div>
    </div>
  )
}
