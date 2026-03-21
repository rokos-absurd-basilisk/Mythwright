import { useState, useRef } from 'react'
import { Keyboard, Lock } from 'lucide-react'
import { clsx } from 'clsx'
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useBoundStore, useBeats } from '../../store'
import { type ToolboxTool } from '../../types'
import { Modal } from '../shared/Modal'
import { Button } from '../shared/Button'
import { BeatCard } from '../canvas/BeatCard'

const TOOLS: { id: ToolboxTool; label: string; tip: string }[] = [
  { id:'misdirection',  label:'Misdirection',  tip:'Send readers down the wrong path' },
  { id:'sacrifice',     label:'Sacrifice',      tip:'Character gives up something precious' },
  { id:'obstacle',      label:'Obstacle',       tip:'Appears 2–4× in Act 2' },
  { id:'confrontation', label:'Confrontation',  tip:'Direct clash of opposing forces' },
  { id:'complication',  label:'Complication',   tip:'New problem emerges mid-story' },
  { id:'escalation',    label:'Escalation',     tip:'Commonly appears 3–5× across the story' },
  { id:'surprise',      label:'Surprise',       tip:'Unexpected reversal of expectation' },
  { id:'reversal',      label:'Reversal',       tip:'Fortune flips in an instant' },
  { id:'decision',      label:'Decision',       tip:'Great for 3+ uses across the novel' },
  { id:'revelation',    label:'Revelation',     tip:'Hidden truth comes to light' },
  { id:'repetition',    label:'Repetition',     tip:'Echo of an earlier moment, changed' },
  { id:'betrayal',      label:'Betrayal',       tip:'Trust broken — reader feels it too' },
]

const ANCHORS: { id: ToolboxTool; label: string; defaultX: number }[] = [
  { id:'inciting_incident', label:'Inciting Incident', defaultX: 0.12 },
  { id:'tent_pole',         label:'Tent Pole',          defaultX: 0.52 },
  { id:'climax',            label:'Climax',             defaultX: 0.88 },
]

// ── Draggable tool chip ─────────────────────────────────────────
function ToolChip({ tool, dragging }: { tool: typeof TOOLS[0]; dragging: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `tool-${tool.id}`,
    data: { type: 'tool', toolType: tool.id },
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={tool.tip}
      className={clsx(
        'flex items-center justify-center h-10 px-3 rounded-[var(--radius-toolbox-chip)] border cursor-grab',
        'text-[12px] font-medium font-[family-name:var(--font-body)] text-[var(--text-primary)]',
        'transition-all duration-[var(--dur-fast)] select-none',
        dragging
          ? 'border-[var(--accent-orange)] bg-[var(--accent-orange-20)] opacity-50'
          : 'border-[var(--accent-orange)] bg-[var(--bg-canvas)] hover:bg-[var(--accent-orange-10)]'
      )}
      style={{ transform: CSS.Translate.toString(transform) }}
    >
      {tool.label}
    </div>
  )
}

// ── Timeline drop zone ──────────────────────────────────────────
function TimelineDropZone({ }: { onDrop?: (toolType: ToolboxTool, xPos: number) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'timeline', data: { type: 'timeline' } })
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'relative flex-1 h-20 rounded-[var(--radius-lg)] border-2 border-dashed transition-colors duration-[var(--dur-fast)]',
        isOver ? 'border-[var(--accent-orange)] bg-[var(--accent-orange-10)]' : 'border-[var(--border)]'
      )}
    >
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[var(--accent-orange)]">
          Drop beat here
        </div>
      )}
    </div>
  )
}

// ── CSV Mode Modal ──────────────────────────────────────────────
function CsvModal({ open, onClose, onImport }: {
  open: boolean; onClose: () => void
  onImport: (names: string[]) => void
}) {
  const [text, setText] = useState('')
  const handleImport = () => {
    const names = text.split(',').map(s=>s.trim()).filter(Boolean)
    if (names.length) { onImport(names); onClose(); setText('') }
  }
  return (
    <Modal open={open} onClose={onClose} title="CSV Mode — Bulk Beat Creation">
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          Type or paste comma-separated beat names. Each will be created as a beat on the timeline.
        </p>
        <textarea
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Confrontation, Escalation, Betrayal, Decision, Revelation, Climax"
          rows={4}
          className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] outline-none resize-none font-[family-name:var(--font-mono)]"
          style={{ background:'var(--bg-input)' }}
        />
        {text && (
          <p className="text-[11px] text-[var(--text-muted)]">
            Preview: {text.split(',').map(s=>s.trim()).filter(Boolean).length} beats
          </p>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleImport} disabled={!text.trim()}>Create Beats</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main Toolbox ────────────────────────────────────────────────
export function ToolboxFramework({ outlineId }: { outlineId: string }) {
  const beats   = useBeats(outlineId)
  const addBeat = useBoundStore(s => s.addBeat)
  const [activeDragId, setActiveDragId] = useState<string|null>(null)
  const [showCsv, setShowCsv] = useState(false)

  // Seed locked anchors if missing
  const anchorBeats = ANCHORS.map(a =>
    beats.find(b => b.toolType === a.id && b.isLockedAnchor)
  )

  const ensureAnchors = () => {
    ANCHORS.forEach((a, i) => {
      if (!anchorBeats[i]) {
        addBeat(outlineId, a.label, {
          toolType: a.id, isLockedAnchor: true, xPosition: a.defaultX,
          labelColour: '#e8933a',
        })
      }
    })
  }

  // Run once
  const seeded = useRef(false)
  if (!seeded.current && beats.length === 0) { seeded.current = true; ensureAnchors() }

  const toolBeats  = beats.filter(b => !b.isLockedAnchor && b.toolType)
  const activeTool = activeDragId
    ? TOOLS.find(t => `tool-${t.id}` === activeDragId)
    : null

  const onDragEnd = (e: DragEndEvent) => {
    setActiveDragId(null)
    if (e.over?.id === 'timeline' && e.active.data.current?.type === 'tool') {
      const toolType = e.active.data.current.toolType as ToolboxTool
      const tool = TOOLS.find(t => t.id === toolType)!
      // Distribute new beat between last locked anchor and next
      const existingX = toolBeats.map(b => b.xPosition ?? 0.5)
      const candidate = existingX.length
        ? Math.max(...existingX) + 0.05
        : 0.3
      addBeat(outlineId, tool.label, {
        toolType, xPosition: Math.min(0.85, candidate), labelColour:'#5ec8c8'
      })
    }
  }

  const csvImport = (names: string[]) => {
    names.forEach((name, i) => {
      const matched = TOOLS.find(t => t.label.toLowerCase() === name.toLowerCase())
      addBeat(outlineId, name, {
        toolType: matched?.id ?? 'decision',
        xPosition: 0.2 + (i / Math.max(1, names.length - 1)) * 0.6,
        labelColour: '#5ec8c8',
      })
    })
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col animate-page-enter">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between flex-shrink-0">
        <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold uppercase tracking-widest text-[var(--accent-orange)]">
          The Toolbox
        </h2>
        <button
          onClick={() => setShowCsv(true)}
          className="flex items-center gap-2 px-3 h-8 rounded-[var(--radius-md)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors duration-[var(--dur-fast)]"
        >
          <Keyboard size={14}/> CSV Mode
        </button>
      </div>

      <DndContext
        onDragStart={e => setActiveDragId(String(e.active.id))}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveDragId(null)}
      >
        <div className="flex flex-1 overflow-hidden gap-0">
          {/* Tool grid — left */}
          <div className="w-56 flex-shrink-0 p-4 border-r border-[var(--border)] overflow-y-auto"
            style={{ background:'var(--bg-canvas)' }}>
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] mb-3">
              Drag to Timeline
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TOOLS.map(tool => (
                <ToolChip key={tool.id} tool={tool} dragging={activeDragId === `tool-${tool.id}`}/>
              ))}
            </div>
          </div>

          {/* Timeline — centre/right */}
          <div className="flex-1 flex flex-col p-5 overflow-y-auto gap-5">
            {/* Locked anchors */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] mb-2">
                Story Anchors
              </p>
              <div className="flex gap-3">
                {ANCHORS.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 px-4 h-10 rounded-[var(--radius-pill)] border border-[var(--accent-orange)] bg-[var(--accent-orange-10)]">
                    <Lock size={12} className="text-[var(--accent-orange)]"/>
                    <span className="text-[12px] font-medium text-[var(--accent-orange)]">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Drop zone */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] mb-2">
                Timeline — drag beats here
              </p>
              <TimelineDropZone onDrop={() => {}} />
            </div>

            {/* Beat chips on timeline */}
            {toolBeats.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] mb-2">
                  Beats ({toolBeats.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {toolBeats.map((b, i) => (
                    <div key={b.id} className="animate-beat-appear" style={{ animationDelay:`${i*30}ms` }}>
                      <BeatCard beat={b} compact />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeTool && (
            <div className="px-4 h-10 rounded-[var(--radius-toolbox-chip)] border border-[var(--accent-orange)] bg-[var(--accent-orange-20)] text-[12px] font-medium text-[var(--accent-orange)] flex items-center shadow-[var(--shadow-card-drag)]">
              {activeTool.label}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <CsvModal open={showCsv} onClose={() => setShowCsv(false)} onImport={csvImport} />
    </div>
  )
}
