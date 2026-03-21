import { useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent, DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { BookPlus, ChevronRight, FilePlus, FileText, GitBranch, Plus, GripVertical } from 'lucide-react'
import { clsx } from 'clsx'
import { useBoundStore, useStories, useNotes, useOutlines, useUI } from '../../store'
import { type Story, type Outline, type FrameworkId } from '../../types'
import { Badge }  from '../shared/Badge'
import { Modal }  from '../shared/Modal'
import { Button } from '../shared/Button'

// ── Framework definitions ───────────────────────────────────────
const FRAMEWORKS: { id: FrameworkId; name: string; level: string; desc: string }[] = [
  { id:1, name:"Booker's 7 Types",   level:'Level 1', desc:'Archetypal story concept' },
  { id:2, name:"Vonnegut's Shapes",  level:'Level 2', desc:'Fortune arc over time' },
  { id:3, name:"3-Act Structure",    level:'Level 3', desc:'Setup · Confrontation · Resolution' },
  { id:4, name:"5-Act / Freytag",    level:'Level 4', desc:'Classical dramatic pyramid' },
  { id:5, name:"7-Point Structure",  level:'Level 5', desc:'Hook → Pinches → Resolution' },
  { id:6, name:"Save the Cat",       level:'Level 6', desc:'15-beat sheet' },
  { id:7, name:"The Toolbox",        level:'Level 7', desc:'Freeform narrative devices' },
]

const LABEL_COLOURS = [
  '#5ec8c8','#e8933a','#c45050','#7c5cb4',
  '#4a9c6b','#c8a84b','#4a7bc8','#c84a8a',
]

// ── New Story Modal ─────────────────────────────────────────────
function NewStoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle]   = useState('')
  const [colour, setColour] = useState('#5ec8c8')
  const addStory            = useBoundStore(s => s.addStory)
  const setActiveStory      = useBoundStore(s => s.setActiveStory)
  const toggleExpanded      = useBoundStore(s => s.toggleStoryExpanded)

  const submit = () => {
    if (!title.trim()) return
    const s = addStory(title.trim(), colour)
    setActiveStory(s.id)
    toggleExpanded(s.id)
    setTitle(''); setColour('#5ec8c8'); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New Story">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold">Title</label>
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="My Story"
            className="h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] outline-none transition-colors"
            style={{ background:'var(--bg-input)' }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold">Label Colour</label>
          <div className="flex gap-2 flex-wrap">
            {LABEL_COLOURS.map(c => (
              <button key={c} onClick={() => setColour(c)}
                className={clsx('w-7 h-7 rounded-full transition-all duration-[var(--dur-fast)]',
                  colour === c && 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-secondary)] scale-110'
                )}
                style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={!title.trim()}>Create Story</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── New Outline Modal ───────────────────────────────────────────
function NewOutlineModal({ storyId, open, onClose }: { storyId: string; open: boolean; onClose: () => void }) {
  const [title, setTitle]         = useState('')
  const [frameworkId, setFw]      = useState<FrameworkId>(3)
  const addOutline                = useBoundStore(s => s.addOutline)
  const setActiveOutline          = useBoundStore(s => s.setActiveOutline)

  const submit = () => {
    if (!title.trim()) return
    const o = addOutline(storyId, title.trim(), frameworkId)
    setActiveOutline(o.id)
    setTitle(''); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New Outline" size="md">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold">Title</label>
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Main Plot"
            className="h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] outline-none transition-colors"
            style={{ background:'var(--bg-input)' }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold">Framework</label>
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
            {FRAMEWORKS.map(fw => (
              <button key={fw.id} onClick={() => setFw(fw.id)}
                className={clsx(
                  'flex items-center justify-between h-10 px-3 rounded-[var(--radius-md)] text-sm transition-all duration-[var(--dur-fast)] text-left gap-3',
                  frameworkId === fw.id
                    ? 'border border-[var(--accent-orange)] bg-[var(--accent-orange-10)] text-[var(--text-primary)]'
                    : 'border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-active)] hover:text-[var(--text-primary)]'
                )}
                style={frameworkId !== fw.id ? { background:'var(--bg-input)' } : {}}>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-medium truncate">{fw.name}</span>
                  <span className="text-[11px] text-[var(--text-muted)] truncate">{fw.desc}</span>
                </div>
                <span className="text-[11px] text-[var(--accent-orange)] font-[family-name:var(--font-heading)] tracking-wide flex-shrink-0">{fw.level}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={!title.trim()}>Create Outline</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Sortable Outline Item ───────────────────────────────────────
function SortableOutlineItem({ outline }: { outline: Outline }) {
  const { activeOutlineId } = useUI()
  const setActiveOutline    = useBoundStore(s => s.setActiveOutline)
  const active              = activeOutlineId === outline.id

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: outline.id })

  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={clsx(
        'flex items-center h-8 pl-8 pr-2 text-xs group cursor-pointer',
        'transition-colors duration-[var(--dur-fast)]',
        active
          ? 'text-[var(--text-primary)] bg-[var(--accent-teal-10)] border-l-2 border-l-[var(--accent-teal)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-teal-10)] border-l-2 border-l-transparent'
      )}
      onClick={() => setActiveOutline(outline.id)}>
      <button {...attributes} {...listeners}
        className="p-0.5 mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        onClick={e => e.stopPropagation()}>
        <GripVertical size={11} />
      </button>
      <GitBranch size={11} className="flex-shrink-0 text-[var(--text-muted)] mr-1.5" />
      <span className="truncate flex-1">{outline.title}</span>
      <span className={clsx(
        'text-[10px] font-[family-name:var(--font-heading)] tracking-wide flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
        active ? 'text-[var(--accent-orange)]' : 'text-[var(--text-muted)]'
      )}>F{outline.frameworkId}</span>
    </div>
  )
}

// ── Sortable Story Item ─────────────────────────────────────────
function SortableStoryItem({ story }: { story: Story }) {
  const { expandedStoryIds, activeStoryId } = useUI()
  const outlines         = useOutlines(story.id)
  const notes            = useNotes(story.id)
  const expanded         = expandedStoryIds.includes(story.id)
  const toggleExpanded   = useBoundStore(s => s.toggleStoryExpanded)
  const setActiveStory   = useBoundStore(s => s.setActiveStory)
  
  const [showNewOutline, setShowNewOutline] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: story.id })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const handleStoryClick = () => {
    setActiveStory(story.id)
    toggleExpanded(story.id)
  }

  const handleOutlineDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = outlines.findIndex(o => o.id === active.id)
    const newIdx = outlines.findIndex(o => o.id === over.id)
    if (oldIdx !== -1 && newIdx !== -1) {
      const reordered = arrayMove(outlines, oldIdx, newIdx)
      reordered.forEach((o, i) => useBoundStore.getState().updateOutline(o.id, { position: i }))
    }
  }

  const expandedHeight = expanded
    ? (outlines.length + notes.length + (outlines.length === 0 && notes.length === 0 ? 1 : 0)) * 32
    : 0

  return (
    <>
      <div ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
        {/* Story header */}
        <div
          className={clsx(
            'flex items-center h-9 px-2 gap-1.5 cursor-pointer select-none group transition-colors duration-[var(--dur-fast)]',
            activeStoryId === story.id ? 'bg-[var(--accent-teal-10)]' : 'hover:bg-[var(--accent-teal-10)]'
          )}
          onClick={handleStoryClick}>
          <button {...attributes} {...listeners}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-[var(--text-muted)] hover:text-[var(--text-secondary)] p-0.5"
            onClick={e => e.stopPropagation()}>
            <GripVertical size={13} />
          </button>
          <span className="w-[3px] h-5 rounded-full flex-shrink-0" style={{ background: story.labelColour }} />
          <ChevronRight size={13} className="flex-shrink-0 text-[var(--text-muted)] transition-transform duration-[var(--dur-normal)]"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
          <span className="flex-1 truncate text-[13px] font-medium text-[var(--text-primary)] min-w-0">{story.title}</span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--dur-fast)]">
            <button onClick={e => { e.stopPropagation(); setShowNewOutline(true) }}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-orange)] hover:bg-[var(--accent-orange-10)] transition-colors"
              title="New Outline">
              <FilePlus size={13} />
            </button>
          </div>
          <Badge status={story.status} className="flex-shrink-0 scale-90 origin-right" />
        </div>

        {/* Expandable children with dnd sortable outlines */}
        <div className="overflow-hidden"
          style={{ maxHeight:`${expandedHeight}px`, transition:`max-height var(--dur-normal) var(--ease-in-out)` }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter}
            onDragStart={e => setActiveId(String(e.active.id))}
            onDragEnd={handleOutlineDragEnd}
            onDragCancel={() => setActiveId(null)}>
            <SortableContext items={outlines.map(o => o.id)} strategy={verticalListSortingStrategy}>
              {outlines.map((o, i) => (
                <div key={o.id} className="animate-beat-appear" style={{ animationDelay:`${i * 20}ms` }}>
                  <SortableOutlineItem outline={o} />
                </div>
              ))}
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div className="flex items-center h-8 pl-10 pr-3 text-xs rounded border border-[var(--border-drag)] bg-[var(--bg-card)] text-[var(--text-primary)] opacity-90 shadow-[var(--shadow-card-drag)]">
                  {outlines.find(o => o.id === activeId)?.title}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {notes.map((n, i) => (
            <div key={n.id} className="animate-beat-appear" style={{ animationDelay:`${(outlines.length+i)*20}ms` }}>
              <button className="w-full flex items-center gap-2 h-8 pl-10 pr-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--accent-teal-10)] transition-all border-l-2 border-l-transparent">
                <FileText size={11} className="flex-shrink-0" />
                <span className="truncate flex-1 text-left">{n.title}</span>
              </button>
            </div>
          ))}

          {outlines.length === 0 && notes.length === 0 && (
            <button onClick={e => { e.stopPropagation(); setShowNewOutline(true) }}
              className="w-full flex items-center gap-2 h-8 pl-10 pr-3 text-xs text-[var(--text-muted)] hover:text-[var(--accent-orange)] transition-all animate-beat-appear">
              <Plus size={12} /><span>Add outline…</span>
            </button>
          )}
        </div>
      </div>

      <NewOutlineModal storyId={story.id} open={showNewOutline} onClose={() => setShowNewOutline(false)} />
    </>
  )
}

// ── Binder Root ─────────────────────────────────────────────────
export function Binder() {
  const stories         = useStories()
  const { binderOpen }  = useUI()
  const [showNewStory, setShowNewStory] = useState(false)
  const [activeId, setActiveId]         = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const handleStoryDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = stories.findIndex(s => s.id === active.id)
    const newIdx = stories.findIndex(s => s.id === over.id)
    if (oldIdx !== -1 && newIdx !== -1) {
      const reordered = arrayMove(stories, oldIdx, newIdx)
      reordered.forEach((s, i) => useBoundStore.getState().updateStory(s.id, { position: i }))
    }
  }

  const draggedStory = activeId ? stories.find(s => s.id === activeId) : null

  return (
    <>
      <aside className="flex flex-col border-r border-[var(--border)] flex-shrink-0"
        style={{
          width: binderOpen ? 'var(--binder-width)' : '0px',
          background: 'var(--bg-secondary)',
          overflow: 'hidden',
          transition: 'width var(--dur-medium) var(--ease-in-out)',
          boxShadow: binderOpen ? 'var(--shadow-panel)' : 'none',
        }}>
        <div style={{
          width: 'var(--binder-width)', height:'100%',
          opacity: binderOpen ? 1 : 0,
          transition: 'opacity var(--dur-normal) var(--ease-in-out)',
          display:'flex', flexDirection:'column', overflow:'hidden',
        }}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 h-10 border-b border-[var(--border-subtle)] flex-shrink-0">
            <span className="text-[11px] uppercase tracking-widest font-[family-name:var(--font-heading)] font-semibold text-[var(--text-muted)]">Stories</span>
            <button onClick={() => setShowNewStory(true)}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-orange)] hover:bg-[var(--accent-orange-10)] transition-all"
              title="New Story">
              <BookPlus size={14} />
            </button>
          </div>

          {/* Story list with dnd-kit sorting */}
          <div className="flex-1 overflow-y-auto py-1">
            {stories.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
                <BookPlus size={32} className="text-[var(--text-muted)]" strokeWidth={1.5} />
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">Your shelf is empty.<br/>Create your first story.</p>
                <button onClick={() => setShowNewStory(true)}
                  className="text-xs text-[var(--accent-orange)] hover:text-[var(--accent-orange-dim)] transition-colors">
                  + New Story
                </button>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter}
                onDragStart={e => setActiveId(String(e.active.id))}
                onDragEnd={handleStoryDragEnd}
                onDragCancel={() => setActiveId(null)}>
                <SortableContext items={stories.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {stories.map(story => <SortableStoryItem key={story.id} story={story} />)}
                </SortableContext>
                <DragOverlay>
                  {draggedStory ? (
                    <div className="flex items-center h-9 px-3 gap-2 rounded border border-[var(--border-drag)] opacity-90 shadow-[var(--shadow-card-drag)]"
                      style={{ background:'var(--bg-card)', width:'var(--binder-width)' }}>
                      <span className="w-[3px] h-5 rounded-full" style={{ background: draggedStory.labelColour }} />
                      <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">{draggedStory.title}</span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
      </aside>

      <NewStoryModal open={showNewStory} onClose={() => setShowNewStory(false)} />
    </>
  )
}
