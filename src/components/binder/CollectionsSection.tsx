// ============================================================
// MYTHWRIGHT — COLLECTIONS SECTION
// Virtual saved filters at bottom of Binder.
// Clicking a collection filters the main story list.
// ============================================================
import { useState } from 'react'
import { Layers, Plus, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { useBoundStore } from '../../store'
import { type StatusType, type FrameworkId } from '../../types'
import { type Collection, type CollectionFilter } from '../../store/slices/collectionsSlice'
import { Modal } from '../shared/Modal'

const EASE = [0, 0, 0.2, 1] as const

const STATUS_OPTIONS: { id: StatusType; label: string }[] = [
  { id:'draft',       label:'Draft'       },
  { id:'in_progress', label:'In Progress' },
  { id:'final',       label:'Final'       },
  { id:'blocked',     label:'Blocked'     },
]
const FW_OPTIONS: { id: FrameworkId; label: string }[] = [
  {id:1,label:'Booker'},{id:2,label:'Vonnegut'},{id:3,label:'3-Act'},
  {id:4,label:'5-Act'},{id:5,label:'7-Point'},{id:6,label:'Save the Cat'},{id:7,label:'Toolbox'},
]

function useMatchCount(filter: CollectionFilter): number {
  return useBoundStore(s => {
    const { statuses, frameworkIds } = filter
    let n = 0
    s.beats.forEach(b => { if (!statuses?.length || statuses.includes(b.status)) n++ })
    s.outlines.forEach(o => { if (!frameworkIds?.length || frameworkIds.includes(o.frameworkId)) n++ })
    return n
  })
}

function CollectionRow({ col }: { col: Collection }) {
  const count      = useMatchCount(col.filter)
  const activeId   = useBoundStore(s => s.activeCollectionId)
  const setActive  = useBoundStore(s => s.setActiveCollection)
  const deleteCol  = useBoundStore(s => s.deleteCollection)
  const isActive   = activeId === col.id
  const [hov, setHov] = useState(false)

  return (
    <div
      className={clsx('flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-[var(--radius-md)] transition-colors duration-[var(--dur-fast)]',
        isActive ? 'bg-[var(--accent-orange-10)]' : 'hover:bg-[var(--accent-teal-10)]'
      )}
      onClick={() => setActive(isActive ? null : col.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <span className="text-[13px] flex-shrink-0 leading-none">{col.icon}</span>
      <span className={clsx('flex-1 text-[12px] truncate', isActive ? 'text-[var(--accent-orange)]' : 'text-[var(--text-secondary)]')}>
        {col.name}
      </span>
      <span className="text-[10px] text-[var(--text-muted)] tabular-nums flex-shrink-0">{count}</span>
      {hov && !['col-blocked','col-final','col-draft'].includes(col.id) && (
        <button onClick={e => { e.stopPropagation(); deleteCol(col.id) }}
          className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--status-blocked)] transition-colors"
          aria-label={`Delete ${col.name}`}><X size={10}/></button>
      )}
    </div>
  )
}

function NewCollectionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name,     setName]     = useState('')
  const [statuses, setStatuses] = useState<StatusType[]>([])
  const [fwIds,    setFwIds]    = useState<FrameworkId[]>([])
  const add = useBoundStore(s => s.addCollection)
  const toggle = <T,>(arr: T[], v: T): T[] => arr.includes(v) ? arr.filter(x=>x!==v) : [...arr,v]

  const submit = () => {
    if (!name.trim()) return
    const filter: CollectionFilter = {}
    if (statuses.length) filter.statuses     = statuses
    if (fwIds.length)    filter.frameworkIds  = fwIds
    add(name.trim(), filter)
    setName(''); setStatuses([]); setFwIds([]); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New Collection" size="sm">
      <div className="flex flex-col gap-4">
        <input autoFocus value={name} onChange={e=>setName(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Collection name…"
          className="h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-input)] text-[var(--text-primary)] text-[13px] outline-none focus:border-[var(--border-active)]"
        />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold mb-2">Filter by status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map(s=>(
              <button key={s.id} onClick={()=>setStatuses(toggle(statuses,s.id))}
                className={clsx('px-2.5 h-6 rounded-[var(--radius-pill)] text-[11px] border transition-colors',
                  statuses.includes(s.id)
                    ? 'border-[var(--accent-teal)] bg-[var(--accent-teal-10)] text-[var(--accent-teal)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
                )}>
                {statuses.includes(s.id)&&<Check size={9} className="inline mr-1"/>}{s.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold mb-2">Filter by framework</p>
          <div className="flex flex-wrap gap-1.5">
            {FW_OPTIONS.map(f=>(
              <button key={f.id} onClick={()=>setFwIds(toggle(fwIds,f.id))}
                className={clsx('px-2.5 h-6 rounded-[var(--radius-pill)] text-[11px] border transition-colors',
                  fwIds.includes(f.id)
                    ? 'border-[var(--accent-orange)] bg-[var(--accent-orange-10)] text-[var(--accent-orange)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
                )}>
                {fwIds.includes(f.id)&&<Check size={9} className="inline mr-1"/>}{f.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={submit} disabled={!name.trim()}
          className="h-9 rounded-[var(--radius-md)] text-[13px] font-medium text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
          style={{ background:'var(--accent-orange)' }}>Create Collection</button>
      </div>
    </Modal>
  )
}

export function CollectionsSection() {
  const collections = useBoundStore(s => s.collections)
  const [open,     setOpen]     = useState(false)
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="border-t border-[var(--border-subtle)] mt-1 pt-1 pb-2">
      <button onClick={()=>setExpanded(e=>!e)}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--accent-teal-10)] rounded-[var(--radius-md)] transition-colors duration-[var(--dur-fast)] group">
        <Layers size={12} className="text-[var(--text-muted)] flex-shrink-0"/>
        <span className="text-[10px] uppercase tracking-widest font-[family-name:var(--font-heading)] font-semibold text-[var(--text-muted)] flex-1">Collections</span>
        <button onClick={e=>{e.stopPropagation();setOpen(true)}}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--accent-orange)] transition-all"
          aria-label="New collection"><Plus size={11}/></button>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
            exit={{height:0,opacity:0}} transition={{duration:0.16,ease:EASE}} className="overflow-hidden">
            {collections.sort((a,b)=>a.position-b.position).map(col=><CollectionRow key={col.id} col={col}/>)}
            {collections.length===0&&(
              <p className="px-3 py-2 text-[11px] text-[var(--text-muted)]">
                No collections.{' '}
                <button onClick={()=>setOpen(true)} className="text-[var(--accent-teal)] hover:underline">Create one</button>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <NewCollectionModal open={open} onClose={()=>setOpen(false)}/>
    </div>
  )
}
