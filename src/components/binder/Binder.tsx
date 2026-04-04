// ============================================================
// MYTHWRIGHT — BINDER
// Left panel: story/outline tree, dnd-kit sorting, context
// menus (rename/archive/delete), Collections section.
// ============================================================
import { useState } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCenter, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  BookPlus, ChevronRight, FilePlus, GitBranch, GripVertical,
  Edit2, Trash2, Archive, ArchiveRestore,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useBoundStore, useStories, useOutlines, useUI } from '../../store'
import { type Story, type Outline, type FrameworkId } from '../../types'
import { Modal }               from '../shared/Modal'
import { Button }              from '../shared/Button'
import { ColorPicker }         from '../shared/ColorPicker'
import { ContextMenu }         from '../shared/ContextMenu'
import { CollectionsSection }  from './CollectionsSection'

// ── Framework options ─────────────────────────────────────────
const FRAMEWORKS: { id: FrameworkId; name: string; level: string; desc: string }[] = [
  { id:1, name:"Booker's 7 Types",      level:'Level 1', desc:'Archetype selector' },
  { id:2, name:"Vonnegut's Shapes",     level:'Level 2', desc:'Fortune/time curve' },
  { id:3, name:"3-Act Structure",       level:'Level 3', desc:'Setup → Confrontation → Resolution' },
  { id:4, name:"5-Act / Freytag",       level:'Level 4', desc:'Pyramid with 5 stages' },
  { id:5, name:"7-Point Structure",     level:'Level 5', desc:'Hook → Pinches → Resolution' },
  { id:6, name:"Save the Cat",          level:'Level 6', desc:'15-beat sheet' },
  { id:7, name:"The Toolbox",           level:'Level 7', desc:'Freeform narrative devices' },
]

// ── Inline rename input ───────────────────────────────────────
function RenameInput({ current, onCommit, onCancel }: { current: string; onCommit:(v:string)=>void; onCancel:()=>void }) {
  const [val, setVal] = useState(current)
  return (
    <input autoFocus value={val} onChange={e=>setVal(e.target.value)}
      onKeyDown={e=>{if(e.key==='Enter')onCommit(val.trim()||current);if(e.key==='Escape')onCancel()}}
      onBlur={()=>onCommit(val.trim()||current)}
      onClick={e=>e.stopPropagation()}
      className="flex-1 min-w-0 bg-[var(--bg-input)] border border-[var(--border-active)] rounded px-1.5 text-[12px] text-[var(--text-primary)] outline-none"
    />
  )
}

// ── Outline item ──────────────────────────────────────────────
function SortableOutlineItem({ outline }: { outline: Outline }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id:outline.id })
  const { activeOutlineId }   = useUI()
  const setActiveOutline      = useBoundStore(s=>s.setActiveOutline)
  const updateOutline         = useBoundStore(s=>s.updateOutline)
  const deleteOutline         = useBoundStore(s=>s.deleteOutline)
  const setActiveStory        = useBoundStore(s=>s.setActiveStory)
  const [ctxOpen, setCtxOpen] = useState(false)
  const [ctxPos,  setCtxPos]  = useState({ x:0, y:0 })
  const [renaming, setRenaming] = useState(false)
  const isActive = activeOutlineId === outline.id

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setCtxPos({ x:e.clientX, y:e.clientY }); setCtxOpen(true)
  }

  return (
    <>
      <div ref={setNodeRef}
        style={{ transform:CSS.Transform.toString(transform), transition, opacity:isDragging?0.4:1 }}
        className={clsx(
          'flex items-center gap-1.5 pl-6 pr-2 py-[5px] cursor-pointer rounded-[var(--radius-md)] transition-colors duration-[var(--dur-fast)] group',
          isActive ? 'bg-[var(--accent-teal-10)] border border-[var(--accent-teal)]' : 'hover:bg-[var(--accent-teal-10)] border border-transparent'
        )}
        onClick={()=>{setActiveOutline(outline.id);setActiveStory(outline.storyId)}}
        onContextMenu={onContextMenu}
      >
        <span {...attributes} {...listeners} className="opacity-0 group-hover:opacity-100 cursor-grab transition-opacity flex-shrink-0">
          <GripVertical size={11} className="text-[var(--text-muted)]"/>
        </span>
        <GitBranch size={10} className={clsx('flex-shrink-0', isActive?'text-[var(--accent-orange)]':'text-[var(--text-muted)]')}/>
        {renaming
          ? <RenameInput current={outline.title}
              onCommit={v=>{updateOutline(outline.id,{title:v});setRenaming(false)}}
              onCancel={()=>setRenaming(false)}/>
          : <span className={clsx('flex-1 text-[11px] truncate min-w-0', isActive?'text-[var(--text-primary)] font-medium':'text-[var(--text-secondary)]')}>
              {outline.title}
            </span>
        }
        <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded font-medium opacity-60"
          style={{background:`var(--accent-orange-10)`,color:'var(--accent-orange)'}}>F{outline.frameworkId}</span>
      </div>
      <ContextMenu open={ctxOpen} onClose={()=>setCtxOpen(false)} x={ctxPos.x} y={ctxPos.y} items={[
        { id:'rename', label:'Rename', icon:<Edit2 size={12}/>, action:()=>setRenaming(true) },
        { id:'delete', label:'Delete outline', icon:<Trash2 size={12}/>, danger:true,
          action:()=>{ if(confirm(`Delete "${outline.title}"?`)) deleteOutline(outline.id) } },
      ]}/>
    </>
  )
}

// ── Story item ────────────────────────────────────────────────
function SortableStoryItem({ story }: { story: Story }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id:story.id })
  const { expandedStoryIds, activeStoryId } = useUI()
  const outlines          = useOutlines(story.id)
  const toggleExpanded    = useBoundStore(s=>s.toggleStoryExpanded)
  const setActiveStory    = useBoundStore(s=>s.setActiveStory)
  const updateStory       = useBoundStore(s=>s.updateStory)
  const deleteStory       = useBoundStore(s=>s.deleteStory)
  const setActiveOutline  = useBoundStore(s=>s.setActiveOutline)
  const [showNewOutline, setShowNewOutline] = useState(false)
  const [ctxOpen, setCtxOpen] = useState(false)
  const [ctxPos,  setCtxPos]  = useState({x:0,y:0})
  const [renaming, setRenaming] = useState(false)

  const isExpanded = expandedStoryIds.includes(story.id)
  const isActive   = activeStoryId === story.id

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint:{ distance:6 } }))

  const handleOutlineDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id===over.id) return
    const ids = outlines.map(o=>o.id)
    const oldIdx = ids.indexOf(String(active.id)), newIdx = ids.indexOf(String(over.id))
    if (oldIdx>-1&&newIdx>-1) {
      const reordered = arrayMove(outlines, oldIdx, newIdx)
      reordered.forEach((o,i)=>useBoundStore.getState().updateOutline(o.id,{position:i}))
    }
  }

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setCtxPos({x:e.clientX,y:e.clientY}); setCtxOpen(true)
  }

  return (
    <>
      <div ref={setNodeRef}
        style={{ transform:CSS.Transform.toString(transform), transition, opacity:isDragging?0.4:1 }}
        className="flex flex-col"
      >
        {/* Story row */}
        <div className={clsx(
          'flex items-center gap-1.5 px-2 py-[6px] cursor-pointer rounded-[var(--radius-md)]',
          'transition-colors duration-[var(--dur-fast)] group',
          isActive?'bg-[var(--accent-teal-10)]':'hover:bg-[var(--accent-teal-10)]'
        )}
          onClick={()=>{setActiveStory(story.id);toggleExpanded(story.id)}}
          onContextMenu={onContextMenu}
        >
          <span {...attributes} {...listeners} className="opacity-0 group-hover:opacity-100 cursor-grab transition-opacity flex-shrink-0">
            <GripVertical size={12} className="text-[var(--text-muted)]"/>
          </span>
          <span className="w-[3px] h-4 rounded-full flex-shrink-0" style={{background:story.labelColour}}/>
          <ChevronRight size={12} className={clsx('flex-shrink-0 text-[var(--text-muted)] transition-transform duration-[var(--dur-fast)]', isExpanded&&'rotate-90')}/>
          {renaming
            ? <RenameInput current={story.title}
                onCommit={v=>{updateStory(story.id,{title:v});setRenaming(false)}}
                onCancel={()=>setRenaming(false)}/>
            : <span className={clsx('flex-1 text-[12px] font-semibold truncate min-w-0', isActive?'text-[var(--text-primary)]':'text-[var(--text-secondary)]')}>
                {story.title}
              </span>
          }
          {story.archived && <span className="text-[9px] px-1.5 py-0.5 rounded-[var(--radius-pill)] font-medium" style={{background:'var(--accent-orange-10)',color:'var(--accent-orange)'}}>Archived</span>}
        </div>

        {/* Outlines */}
        {isExpanded && (
          <div className="flex flex-col gap-0.5 py-0.5">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOutlineDragEnd}>
              <SortableContext items={outlines.map(o=>o.id)} strategy={verticalListSortingStrategy}>
                {outlines.map(o=><SortableOutlineItem key={o.id} outline={o}/>)}
              </SortableContext>
            </DndContext>
            <button onClick={()=>setShowNewOutline(true)}
              className="flex items-center gap-1.5 pl-8 pr-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-orange)] transition-colors rounded-[var(--radius-md)] hover:bg-[var(--accent-orange-10)]">
              <FilePlus size={10}/>New outline
            </button>
          </div>
        )}
      </div>

      <ContextMenu open={ctxOpen} onClose={()=>setCtxOpen(false)} x={ctxPos.x} y={ctxPos.y} items={[
        { id:'rename', label:'Rename', icon:<Edit2 size={12}/>, action:()=>setRenaming(true) },
        { id:'newoutline', label:'New outline', icon:<FilePlus size={12}/>,
          action:()=>{if(!isExpanded)toggleExpanded(story.id);setShowNewOutline(true)} },
        { id:'archive', label:story.archived?'Unarchive':'Archive', icon:story.archived?<ArchiveRestore size={12}/>:<Archive size={12}/>,
          divider:true,
          action:()=>updateStory(story.id,{archived:!story.archived}) },
        { id:'delete', label:'Delete story', icon:<Trash2 size={12}/>, danger:true,
          action:()=>{ if(confirm(`Delete "${story.title}" and all its outlines?`)) deleteStory(story.id) } },
      ]}/>

      <NewOutlineModal storyId={story.id} open={showNewOutline} onClose={()=>setShowNewOutline(false)}
        onCreated={id=>{setActiveOutline(id);setActiveStory(story.id)}}/>
    </>
  )
}

// ── New Story Modal ───────────────────────────────────────────
function NewStoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title,  setTitle]  = useState('')
  const [colour, setColour] = useState('#5ec8c8')
  const addStory       = useBoundStore(s=>s.addStory)
  const setActiveStory = useBoundStore(s=>s.setActiveStory)
  const toggleExpanded = useBoundStore(s=>s.toggleStoryExpanded)

  const submit = () => {
    if (!title.trim()) return
    const s = addStory(title.trim(), colour)
    setActiveStory(s.id); toggleExpanded(s.id)
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
            style={{background:'var(--bg-input)'}}/>
        </div>
        <ColorPicker value={colour} onChange={setColour} label="Label Colour"/>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={!title.trim()}>Create Story</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── New Outline Modal ─────────────────────────────────────────
function NewOutlineModal({ storyId, open, onClose, onCreated }: {
  storyId: string; open: boolean; onClose: ()=>void; onCreated: (id:string)=>void
}) {
  const [title, setTitle] = useState('')
  const [fw,    setFw]    = useState<FrameworkId>(3)
  const addOutline = useBoundStore(s=>s.addOutline)

  const submit = () => {
    if (!title.trim()) return
    const o = addOutline(storyId, title.trim(), fw)
    onCreated(o.id); setTitle(''); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New Outline" size="md">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold">Title</label>
          <input autoFocus value={title} onChange={e=>setTitle(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Main Plot"
            className="h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] outline-none transition-colors"
            style={{background:'var(--bg-input)'}}/>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold">Framework</label>
          <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto pr-1">
            {FRAMEWORKS.map(f=>(
              <button key={f.id} onClick={()=>setFw(f.id)}
                className={clsx('flex items-start gap-3 p-3 rounded-[var(--radius-md)] border text-left transition-all duration-[var(--dur-fast)]',
                  fw===f.id ? 'border-[var(--accent-orange)] bg-[var(--accent-orange-10)]' : 'border-[var(--border)] hover:border-[var(--border-active)] hover:bg-[var(--bg-card-hover)]'
                )}>
                <span className={clsx('text-[10px] font-[family-name:var(--font-heading)] uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5',
                  fw===f.id?'bg-[var(--accent-orange)] text-white':'bg-[var(--bg-card)] text-[var(--text-muted)]')}>{f.level}</span>
                <div className="min-w-0">
                  <p className={clsx('text-[13px] font-medium', fw===f.id?'text-[var(--accent-orange)]':'text-[var(--text-primary)]')}>{f.name}</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{f.desc}</p>
                </div>
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

// ── Main Binder ───────────────────────────────────────────────
export function Binder() {
  const activeCollectionId = useBoundStore(s => s.activeCollectionId)
  const collections        = useBoundStore(s => s.collections)
  const allStories         = useStories()
  const [showNewStory, setShowNewStory] = useState(false)
  const [activeId, setActiveId]         = useState<string|null>(null)
  const sensors = useSensors(useSensor(PointerSensor, {activationConstraint:{distance:6}}))

  // Filter stories by active collection (if any)
  const beats    = useBoundStore(s => s.beats)
  const outlines = useBoundStore(s => s.outlines)

  const stories = activeCollectionId
    ? allStories.filter(story => {
        const col = collections.find(c => c.id === activeCollectionId)
        if (!col) return true
        const { statuses, frameworkIds } = col.filter
        const storyOutlines = outlines.filter(o => o.storyId === story.id)
        const storyBeats    = beats.filter(b => storyOutlines.some(o => o.id === b.outlineId))
        if (statuses?.length && !storyBeats.some(b => statuses.includes(b.status)) &&
            !storyOutlines.some(o => statuses.includes(o.status))) return false
        if (frameworkIds?.length && !storyOutlines.some(o => frameworkIds.includes(o.frameworkId))) return false
        return true
      })
    : allStories.filter(s => !s.archived)

  const draggedStory = activeId ? allStories.find(s => s.id === activeId) : null

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over || active.id===over.id) return
    const oldIdx = allStories.findIndex(s=>s.id===active.id)
    const newIdx = allStories.findIndex(s=>s.id===over.id)
    if (oldIdx>-1&&newIdx>-1) {
      const reordered = arrayMove(allStories, oldIdx, newIdx)
      reordered.forEach((s,i)=>useBoundStore.getState().updateStory(s.id,{position:i}))
    }
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden" style={{background:'var(--bg-secondary)'}}
        role="navigation" aria-label="Stories and outlines">
        {/* Header */}
        <div className="flex items-center justify-between px-3 h-10 border-b border-[var(--border-subtle)] flex-shrink-0">
          <span className="text-[11px] uppercase tracking-widest font-[family-name:var(--font-heading)] font-semibold text-[var(--text-muted)]">
            {activeCollectionId ? collections.find(c=>c.id===activeCollectionId)?.name ?? 'Stories' : 'Stories'}
          </span>
          <button onClick={()=>setShowNewStory(true)}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-orange)] hover:bg-[var(--accent-orange-10)] transition-all"
            title="New Story" aria-label="New Story"><BookPlus size={14}/></button>
        </div>

        {/* Story list */}
        <div className="flex-1 overflow-y-auto py-1 flex flex-col" role="list" aria-label="Stories list">
          {stories.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
              <BookPlus size={32} className="text-[var(--text-muted)]" strokeWidth={1.5}/>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {activeCollectionId ? 'No stories match this filter.' : 'Your shelf is empty.\nCreate your first story.'}
              </p>
              {!activeCollectionId && (
                <button onClick={()=>setShowNewStory(true)} className="text-xs text-[var(--accent-orange)] hover:text-[var(--accent-orange-dim)] transition-colors">
                  + New Story
                </button>
              )}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter}
              onDragStart={e=>setActiveId(String(e.active.id))}
              onDragEnd={handleDragEnd}
              onDragCancel={()=>setActiveId(null)}>
              <SortableContext items={allStories.map(s=>s.id)} strategy={verticalListSortingStrategy}>
                {stories.map(s=><SortableStoryItem key={s.id} story={s}/>)}
              </SortableContext>
              <DragOverlay>
                {draggedStory && (
                  <div className="flex items-center h-9 px-3 gap-2 rounded border border-[var(--border-drag)] opacity-90 shadow-[var(--shadow-card-drag)]"
                    style={{background:'var(--bg-card)',width:'var(--binder-width)'}}>
                    <span className="w-[3px] h-5 rounded-full" style={{background:draggedStory.labelColour}}/>
                    <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">{draggedStory.title}</span>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
          <div className="flex-1"/>
          {/* Collections section pinned to bottom */}
          <CollectionsSection/>
        </div>
      </div>

      <NewStoryModal open={showNewStory} onClose={()=>setShowNewStory(false)}/>
    </>
  )
}
