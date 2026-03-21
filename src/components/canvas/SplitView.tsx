// ============================================================
// MYTHWRIGHT — SPLIT MODE
// Horizontal two-panel canvas. Each panel independently shows
// any Outline. Draggable divider to resize panels.
// Drag beat from one panel → copies to the other.
// ============================================================
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GripHorizontal, ChevronDown, GitBranch } from 'lucide-react'
import { clsx } from 'clsx'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useBoundStore, useBeats, useUI } from '../../store'
import { useToast } from '../shared/Toast'

import { type Beat, type UUID } from '../../types'
import { CanvasContainer } from './CanvasContainer'

const EASE = [0, 0, 0.2, 1] as const
const MIN_PANEL_PX = 160  // minimum panel height

// ── Outline selector dropdown ─────────────────────────────────
function OutlineSelector({ panelId, outlineId }: { panelId: 'top'|'bottom'; outlineId: UUID|null }) {
  const [open, setOpen] = useState(false)
  const stories  = useBoundStore(s => s.stories.filter(st=>!st.archived))
  const allOutlines = useBoundStore(s => s.outlines)
  const setSplitOutlines = useBoundStore(s => s.setSplitOutlines)
  const { splitTopOutlineId, splitBottomOutlineId } = useUI()
  const setActiveOutline = useBoundStore(s => s.setActiveOutline)

  const selected = allOutlines.find(o => o.id === outlineId)

  const select = (id: UUID) => {
    if (panelId === 'top') {
      setSplitOutlines(id, splitBottomOutlineId)
    } else {
      setSplitOutlines(splitTopOutlineId, id)
    }
    setActiveOutline(id)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 h-8 rounded-[var(--radius-md)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] hover:border-[var(--border-active)] hover:text-[var(--text-primary)] transition-colors duration-[var(--dur-fast)] max-w-[260px]"
        style={{ background: 'var(--bg-input)' }}
      >
        <GitBranch size={12} className="text-[var(--accent-orange)] flex-shrink-0" />
        <span className="truncate">{selected?.title ?? 'Choose an outline…'}</span>
        <ChevronDown size={12} className="flex-shrink-0 text-[var(--text-muted)]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <motion.div
            className="absolute top-full left-0 mt-1 z-50 min-w-[260px] max-w-[340px] rounded-[var(--radius-lg)] border border-[var(--border-active)] py-1 overflow-hidden"
            style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-modal)' }}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.14, ease: EASE }}
          >
            {stories.map(story => {
              const outlines = allOutlines.filter(o => o.storyId === story.id)
              if (!outlines.length) return null
              return (
                <div key={story.id}>
                  <div className="px-3 py-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: story.labelColour }} />
                    <span className="text-[10px] uppercase tracking-widest font-[family-name:var(--font-heading)] font-semibold text-[var(--text-muted)]">
                      {story.title}
                    </span>
                  </div>
                  {outlines.map(o => (
                    <button key={o.id}
                      onClick={() => select(o.id)}
                      className={clsx(
                        'w-full flex items-center gap-2 px-5 py-2 text-[12px] text-left transition-colors duration-[var(--dur-fast)]',
                        o.id === outlineId
                          ? 'bg-[var(--accent-teal-10)] text-[var(--accent-teal)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
                      )}
                    >
                      <GitBranch size={11} className="flex-shrink-0 text-[var(--text-muted)]" />
                      <span className="truncate">{o.title}</span>
                      <span className="text-[9px] text-[var(--text-muted)] ml-auto flex-shrink-0">F{o.frameworkId}</span>
                    </button>
                  ))}
                </div>
              )
            })}
            {stories.length === 0 && (
              <p className="px-4 py-3 text-[12px] text-[var(--text-muted)]">No outlines yet.</p>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}

// ── Draggable beat (for cross-panel drag) ────────────────────
function DraggableBeatChip({ beat, sourcePanel }: { beat: Beat; sourcePanel: 'top'|'bottom' }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `split-beat-${beat.id}`,
    data: { beat, sourcePanel },
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] border cursor-grab select-none',
        'text-[12px] text-[var(--text-primary)] transition-all duration-[var(--dur-fast)]',
        isDragging
          ? 'opacity-40 border-[var(--accent-orange)]'
          : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-active)]'
      )}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: beat.labelColour || 'var(--accent-teal)' }} />
      <span className="truncate max-w-[160px]">{beat.title}</span>
    </div>
  )
}

// ── Drop zone panel overlay ──────────────────────────────────
function PanelDropZone({ panelId }: { panelId: 'top'|'bottom' }) {
  const { setNodeRef, isOver } = useDroppable({ id: `panel-${panelId}`, data: { panelId } })
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'absolute inset-0 pointer-events-none transition-all duration-[var(--dur-fast)] z-10',
        isOver && 'ring-inset ring-2 ring-[var(--accent-teal)] bg-[var(--accent-teal-10)]'
      )}
    />
  )
}

// ── Beat strip shown at bottom of each split panel ──────────
function BeatStrip({ outlineId, panelId }: { outlineId: UUID; panelId: 'top'|'bottom' }) {
  const beats = useBeats(outlineId).slice(0, 12)
  if (!beats.length) return null
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 border-t border-[var(--border-subtle)] flex-shrink-0 overflow-x-auto"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] flex-shrink-0">
        Drag to copy →
      </span>
      {beats.map(b => <DraggableBeatChip key={b.id} beat={b} sourcePanel={panelId} />)}
    </div>
  )
}

// ── Single split panel ────────────────────────────────────────
function SplitPanel({
  panelId, height, outlineId,
}: { panelId: 'top'|'bottom'; height: number; outlineId: UUID|null }) {
  const setActiveOutline = useBoundStore(s => s.setActiveOutline)

  useEffect(() => {
    if (outlineId) setActiveOutline(outlineId)
  }, [outlineId, setActiveOutline])

  return (
    <div
      className="relative flex flex-col overflow-hidden flex-shrink-0"
      style={{ height }}
    >
      {/* Panel header with outline selector */}
      <div
        className="flex items-center gap-3 px-4 flex-shrink-0 border-b border-[var(--border-subtle)]"
        style={{ height: 40, background: 'var(--bg-secondary)' }}
      >
        <span className="text-[9px] uppercase tracking-widest font-[family-name:var(--font-heading)] font-semibold text-[var(--text-muted)] flex-shrink-0">
          {panelId === 'top' ? '▲ Top' : '▼ Bottom'}
        </span>
        <OutlineSelector panelId={panelId} outlineId={outlineId} />
      </div>

      {/* Canvas — reuse CanvasContainer but force active outline */}
      <div className="flex-1 overflow-hidden relative">
        <PanelDropZone panelId={panelId} />
        {outlineId
          ? <CanvasContainer forceOutlineId={outlineId} />
          : (
            <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-[13px]">
              Select an outline above to begin plotting.
            </div>
          )
        }
      </div>

      {/* Beat drag strip */}
      {outlineId && <BeatStrip outlineId={outlineId} panelId={panelId} />}
    </div>
  )
}

// ── Draggable divider ─────────────────────────────────────────
function SplitDivider({ onDrag }: { onDrag: (dy: number) => void }) {
  const dragRef = useRef(false)
  const lastY   = useRef(0)

  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = true
    lastY.current   = e.clientY
    e.preventDefault()
  }

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragRef.current) return
      onDrag(e.clientY - lastY.current)
      lastY.current = e.clientY
    }
    const up = () => { dragRef.current = false }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [onDrag])

  return (
    <div
      onMouseDown={onMouseDown}
      className="flex items-center justify-center h-[5px] bg-[var(--border)] hover:bg-[var(--accent-teal)] cursor-row-resize transition-colors duration-[var(--dur-fast)] flex-shrink-0 group"
    >
      <GripHorizontal
        size={16}
        className="text-[var(--text-muted)] group-hover:text-[var(--accent-teal)] opacity-0 group-hover:opacity-100 transition-all duration-[var(--dur-fast)]"
      />
    </div>
  )
}

// ── Main SplitView ────────────────────────────────────────────
export function SplitView({ totalHeight }: { totalHeight: number }) {
  const { splitTopOutlineId, splitBottomOutlineId } = useUI()
  const copyBeat = useBoundStore(s => s.copyBeat)
  const [topRatio, setTopRatio] = useState(0.5)

  const topH    = Math.max(MIN_PANEL_PX, Math.min(totalHeight - MIN_PANEL_PX - 5, Math.floor(totalHeight * topRatio)))
  const bottomH = totalHeight - topH - 5

  const handleDividerDrag = useCallback((dy: number) => {
    setTopRatio(r => {
      const newTop = Math.floor((r * totalHeight) + dy)
      return Math.max(MIN_PANEL_PX, Math.min(totalHeight - MIN_PANEL_PX - 5, newTop)) / totalHeight
    })
  }, [totalHeight])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const { success: toastSuccess } = useToast()

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || !active.data.current) return
    const { beat, sourcePanel } = active.data.current as { beat: Beat; sourcePanel: 'top'|'bottom' }
    const targetPanel = (over.data.current as { panelId: string })?.panelId as 'top'|'bottom'
    if (!targetPanel || targetPanel === sourcePanel) return

    const targetOutlineId = targetPanel === 'top' ? splitTopOutlineId : splitBottomOutlineId
    if (!targetOutlineId) return

    const copied = copyBeat(beat.id, targetOutlineId)
    void copied
    toastSuccess(`"${beat.title}" copied to ${targetPanel} panel`)
  }

  // Active drag beat for overlay
  const [activeDragBeat, setActiveDragBeat] = useState<Beat | null>(null)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={e => {
        const beat = (e.active.data.current as { beat: Beat })?.beat
        if (beat) setActiveDragBeat(beat)
      }}
      onDragEnd={(e) => { handleDragEnd(e); setActiveDragBeat(null) }}
      onDragCancel={() => setActiveDragBeat(null)}
    >
      <div className="flex flex-col overflow-hidden" style={{ height: totalHeight }}>
        <SplitPanel panelId="top"    height={topH}    outlineId={splitTopOutlineId} />
        <SplitDivider onDrag={handleDividerDrag} />
        <SplitPanel panelId="bottom" height={bottomH} outlineId={splitBottomOutlineId} />
      </div>

      <DragOverlay>
        {activeDragBeat && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--accent-orange)] text-[12px] text-[var(--text-primary)]"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card-drag)', minWidth: 140 }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: activeDragBeat.labelColour || 'var(--accent-teal)' }} />
            <span className="truncate">{activeDragBeat.title}</span>
            <span className="text-[10px] text-[var(--accent-teal)] ml-auto">→ Copy</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
