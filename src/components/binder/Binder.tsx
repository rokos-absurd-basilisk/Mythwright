import { useState } from 'react'
import { BookPlus, ChevronRight, FilePlus, FileText, GitBranch, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import {
  DndContext, closestCenter, DragOverlay,
  useSortable, SortableContext, verticalListSortingStrategy,
  type DragEndEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useBoundStore, useStories, useNotes, useOutlines, useUI } from '../../store'
import { type Story, type Outline, type FrameworkId } from '../../types'
import { Badge } from '../shared/Badge'
import { Modal } from '../shared/Modal'
import { Button } from '../shared/Button'

// ── New Story Modal ─────────────────────────────────────────────
function NewStoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [colour, setColour] = useState('#5ec8c8')
  const addStory = useBoundStore(s => s.addStory)
  const setActiveStory = useBoundStore(s => s.setActiveStory)
  const toggleStoryExpanded = useBoundStore(s => s.toggleStoryExpanded)
  const COLOURS = ['#5ec8c8','#e8933a','#c45050','#7c5cb4','#4a9c6b','#c8a84b','#4a7bc8','#c84a8a']
  const submit = () => {
    if (!title.trim()) return
    const story = addStory(title.trim(), colour)
    setActiveStory(story.id); toggleStoryExpanded(story.id)
    setTitle(''); setColour('#5ec8c8'); onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="New Story">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold">Title</label>
          <input autoFocus value={title} onChange={e=>setTitle(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="My Story"
            className="h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] outline-none transition-colors"
            style={{ background:'var(--bg-input)' }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold">Label Colour</label>
          <div className="flex gap-2 flex-wrap">
            {COLOURS.map(c=>(
              <button key={c} onClick={()=>setColour(c)}
                className={clsx('w-7 h-7 rounded-full transition-all duration-[var(--dur-fast)]',
                  colour===c&&'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-secondary)] scale-110')}
                style={{background:c}} />
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
const FRAMEWORKS: { id: FrameworkId; name: string; level: string; desc: string }[] = [
  { id:1, name:"Booker's 7 Types",   level:'Level 1', desc:'Archetypal story concept' },
  { id:2, name:"Vonnegut's Shapes",  level:'Level 2', desc:'Fortune arc over time' },
  { id:3, name:"3-Act Structure",    level:'Level 3', desc:'Setup · Confrontation · Resolution' },
  { id:4, name:"5-Act / Freytag",    level:'Level 4', desc:'Classical dramatic pyramid' },
  { id:5, name:"7-Point Structure",  level:'Level 5', desc:'Hook → Pinches → Resolution' },
  { id:6, name:"Save the Cat",       level:'Level 6', desc:'15-beat sheet' },
  { id:7, name:"The Toolbox",        level:'Level 7', desc:'Freeform narrative devices' },
]

function NewOutlineModal({ storyId, open, onClose }: { storyId: string; open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [fwId, setFwId] = useState<FrameworkId>(3)
  const addOutline = useBoundStore(s => s.addOutline)
  const setActiveOutline = useBoundStore(s => s.setActiveOutline)
  const submit = () => {
    if (!title.trim()) return
    const outline = addOutline(storyId, title.trim(), fwId)
    setActiveOutline(outline.id); setTitle(''); onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="New Outline" size="md">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold">Title</label>
          <input autoFocus value={title} onChange={e=>setTitle(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Main Plot"
            className="h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] outline-none transition-colors"
            style={{ background:'var(--bg-input)' }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold">Framework</label>
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
            {FRAMEWORKS.map(fw=>(
              <button key={fw.id} onClick={()=>setFwId(fw.id)}
                className={clsx('flex items-center justify-between h-10 px-3 rounded-[var(--radius-md)] text-sm transition-all duration-[var(--dur-fast)] text-left gap-3',
                  fwId===fw.id ? 'border border-[var(--accent-orange)] bg-[var(--accent-orange-10)] text-[var(--text-primary)]'
                    : 'border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-active)] hover:text-[var(--text-primary)]'
                )}
                style={{ background: fwId===fw.id ? undefined : 'var(--bg-input)' }}>
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

// ── Sortable outline row ────────────────────────────────────────
function SortableOutlineRow({ outline }: { outline: Outline }) {
  const { activeOutlineId } = useUI()
  const setActiveOutline = useBoundStore(s => s.setActiveOutline)
  const active = activeOutlineId === outline.id
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: outline.id })

  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={clsx(
        'flex items-center gap-1 h-8 pl-8 pr-2 text-xs group transition-all duration-[var(--dur-fast)]',
        active ? 'text-[var(--text-primary)] bg-[var(--accent-teal-10)] border-l-2 border-l-[var(--accent-teal)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-teal-10)] border-l-2 border-l-transparent'
      )}>
      <button {...attributes} {...listeners}
        className="p-0.5 opacity-0 group-hover:opacity-100 cursor-grab text-[var(--text-muted)] transition-opacity">
        <GripVertical size={11}/>
      </button>
      <button className="flex items-center gap-1.5 flex-1 min-w-0" onClick={() => setActiveOutline(outline.id)}>
        <GitBranch size={11} className="flex-shrink-0 text-[var(--text-muted)]"/>
        <span className="truncate flex-1 text-left">{outline.title}</span>
        <span className="text-[10px] text-[var(--accent-orange)] font-[family-name:var(--font-heading)] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          F{outline.frameworkId}
        </span>
      </button>
    </div>
  )
}

// ── Story row ───────────────────────────────────────────────────
function StoryRow({ story }: { story: Story }) {
  const { expandedStoryIds, activeStoryId } = useUI()
  const outlines = useOutlines(story.id)
  const notes    = useNotes(story.id)
  const expanded = expandedStoryIds.includes(story.id)
  const toggleStoryExpanded = useBoundStore(s => s.toggleStoryExpanded)
  const setActiveStory      = useBoundStore(s => s.setActiveStory)
  const reorderOutlines     = useBoundStore(s => s.reorderOutlines)
  const [showNewOutline, setShowNewOutline] = useState(false)
  const active = activeStoryId === story.id
  const childCount = outlines.length + notes.length

  const handleDragEnd = (e: DragEndEvent) => {
    const { active: a, over } = e
    if (!over || a.id === over.id) return
    const oldIdx = outlines.findIndex(o => o.id === a.id)
    const newIdx = outlines.findIndex(o => o.id === over.id)
    if (oldIdx < 0 || newIdx < 0) return
    const reordered = [...outlines]
    reordered.splice(newIdx, 0, reordered.splice(oldIdx, 1)[0])
    reorderOutlines(story.id, reordered.map(o => o.id))
  }

  return (
    <>
      <div onClick={() => { setActiveStory(story.id); toggleStoryExpanded(story.id) }}
        className={clsx('flex items-center h-9 px-2 gap-1.5 cursor-pointer select-none group transition-colors duration-[var(--dur-fast)]',
          active ? 'bg-[var(--accent-teal-10)]' : 'hover:bg-[var(--accent-teal-10)]')}>
        <span className="w-[3px] h-5 rounded-full flex-shrink-0" style={{ background: story.labelColour }}/>
        <ChevronRight size={13}
          className="flex-shrink-0 text-[var(--text-muted)] transition-transform duration-[var(--dur-normal)]"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}/>
        <span className="flex-1 truncate text-[13px] font-medium text-[var(--text-primary)] min-w-0">{story.title}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--dur-fast)]">
          <button onClick={e=>{ e.stopPropagation(); setShowNewOutline(true) }}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-orange)] hover:bg-[var(--accent-orange-10)] transition-colors"
            title="New Outline"><FilePlus size={13}/></button>
        </div>
        <Badge status={story.status} className="flex-shrink-0 scale-90 origin-right"/>
      </div>

      {/* Children */}
      <div className="overflow-hidden"
        style={{ maxHeight: expanded ? `${childCount * 32 + (childCount===0?32:0)}px` : '0px',
          transition:'max-height var(--dur-normal) var(--ease-in-out)' }}>

        {/* Sortable outlines */}
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={outlines.map(o=>o.id)} strategy={verticalListSortingStrategy}>
            {outlines.map((o,i) => (
              <div key={o.id} className="animate-beat-appear" style={{ animationDelay:`${i*20}ms` }}>
                <SortableOutlineRow outline={o}/>
              </div>
            ))}
          </SortableContext>
        </DndContext>

        {notes.map((n,i) => (
          <div key={n.id} className="animate-beat-appear" style={{ animationDelay:`${(outlines.length+i)*20}ms` }}>
            <button className="w-full flex items-center gap-2 h-8 pl-10 pr-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--accent-teal-10)] transition-all duration-[var(--dur-fast)] border-l-2 border-l-transparent">
              <FileText size={11}/><span className="truncate flex-1 text-left">{n.title}</span>
            </button>
          </div>
        ))}

        {childCount === 0 && (
          <button onClick={e=>{e.stopPropagation();setShowNewOutline(true)}}
            className="w-full flex items-center gap-2 h-8 pl-10 pr-3 text-xs text-[var(--text-muted)] hover:text-[var(--accent-orange)] transition-all duration-[var(--dur-fast)] animate-beat-appear">
            <Plus size={12}/><span>Add outline…</span>
          </button>
        )}
      </div>

      <NewOutlineModal storyId={story.id} open={showNewOutline} onClose={() => setShowNewOutline(false)}/>
    </>
  )
}

// ── Binder root ─────────────────────────────────────────────────
export function Binder() {
  const stories = useStories()
  const { binderOpen } = useUI()
  const [showNewStory, setShowNewStory] = useState(false)

  return (
    <>
      <aside className="flex flex-col border-r border-[var(--border)] flex-shrink-0"
        style={{ width: binderOpen ? 'var(--binder-width)' : '0px', background:'var(--bg-secondary)',
          overflow:'hidden', transition:'width var(--dur-medium) var(--ease-in-out)',
          boxShadow: binderOpen ? 'var(--shadow-panel)' : 'none' }}>
        <div style={{ width:'var(--binder-width)', opacity:binderOpen?1:0,
          transition:'opacity var(--dur-normal) var(--ease-in-out)',
          display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

          <div className="flex items-center justify-between px-3 h-10 border-b border-[var(--border-subtle)] flex-shrink-0">
            <span className="text-[11px] uppercase tracking-widest font-[family-name:var(--font-heading)] font-semibold text-[var(--text-muted)]">Stories</span>
            <button onClick={() => setShowNewStory(true)} title="New Story"
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-orange)] hover:bg-[var(--accent-orange-10)] transition-all duration-[var(--dur-fast)]">
              <BookPlus size={14}/>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {stories.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
                <BookPlus size={32} className="text-[var(--text-muted)]" strokeWidth={1.5}/>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">Your shelf is empty.<br/>Create your first story.</p>
                <button onClick={() => setShowNewStory(true)}
                  className="text-xs text-[var(--accent-orange)] hover:text-[var(--accent-orange-dim)] transition-colors">
                  + New Story
                </button>
              </div>
            ) : (
              stories.map(story => <StoryRow key={story.id} story={story}/>)
            )}
          </div>
        </div>
      </aside>
      <NewStoryModal open={showNewStory} onClose={() => setShowNewStory(false)}/>
    </>
  )
}
