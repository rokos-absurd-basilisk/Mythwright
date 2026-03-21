import { useState } from 'react'
import { Camera, RotateCcw, X, ExternalLink, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useBoundStore, useUI } from '../../store'
import { type Beat, type BeatSnapshot, type Bookmark as BookmarkType, type NarrativeAnchor } from '../../types'
import { NotesEditor } from './NotesEditor'
import { Badge } from '../shared/Badge'

// ── Tab definitions ─────────────────────────────────────────────
type Tab = 'notes' | 'metadata' | 'snapshots' | 'bookmarks' | 'comments'

const EASE = [0, 0, 0.2, 1] as const

// ── Colour swatches ─────────────────────────────────────────────
const COLOURS = [
  '#5ec8c8','#e8933a','#c45050','#7c5cb4',
  '#4a9c6b','#c8a84b','#4a7bc8','#c84a8a',
  '#888888','#44aacc','#aa6633','#66aa44',
]

// ── Synopsis field (plain text, char limited) ───────────────────
function SynopsisField({ beat }: { beat: Beat }) {
  const updateBeat = useBoundStore(s => s.updateBeat)
  const MAX = 280
  const len = beat.synopsis.length
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold">
        Synopsis
      </label>
      <textarea
        value={beat.synopsis}
        onChange={e => {
          if (e.target.value.length <= MAX)
            updateBeat(beat.id, { synopsis: e.target.value })
        }}
        placeholder="One-line summary…"
        rows={2}
        className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] outline-none resize-none leading-relaxed"
        style={{ background: 'var(--bg-input)' }}
      />
      <span className={clsx('text-[10px] text-right', len > MAX * 0.9 ? 'text-[var(--accent-orange)]' : 'text-[var(--text-muted)]')}>
        {len}/{MAX}
      </span>
    </div>
  )
}

// ── Metadata panel ──────────────────────────────────────────────
function MetadataPanel({ beat }: { beat: Beat }) {
  const updateBeat = useBoundStore(s => s.updateBeat)
  return (
    <div className="flex flex-col gap-4 p-4">
      <SynopsisField beat={beat} />

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold">
          Status
        </label>
        <div className="flex gap-2 flex-wrap">
          {(['draft','in_progress','final','blocked'] as const).map(s => (
            <button key={s} onClick={() => updateBeat(beat.id, { status: s })}>
              <Badge status={s} className={clsx(
                'cursor-pointer transition-all duration-[var(--dur-fast)]',
                beat.status === s ? 'ring-2 ring-white ring-offset-1 ring-offset-[var(--bg-secondary)]' : 'opacity-50 hover:opacity-80'
              )} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold">
          Label Colour
        </label>
        <div className="flex gap-2 flex-wrap">
          {COLOURS.map(c => (
            <button key={c} onClick={() => updateBeat(beat.id, { labelColour: c })}
              className={clsx('w-6 h-6 rounded-full transition-all duration-[var(--dur-fast)]',
                beat.labelColour === c && 'ring-2 ring-white ring-offset-1 ring-offset-[var(--bg-secondary)] scale-110'
              )}
              style={{ background: c }} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold">
          Keywords
        </label>
        <div className="flex flex-wrap gap-1.5">
          {beat.keywords.map((kw, i) => (
            <span key={i} className="flex items-center gap-1 px-2 h-5 rounded-[var(--radius-pill)] text-[10px] bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-secondary)]">
              {kw}
              <button onClick={() => updateBeat(beat.id, { keywords: beat.keywords.filter((_,j)=>j!==i) })}
                className="text-[var(--text-muted)] hover:text-[var(--status-blocked)]"><X size={8}/></button>
            </span>
          ))}
          <form onSubmit={e => {
            e.preventDefault()
            const inp = (e.currentTarget.elements[0] as HTMLInputElement)
            if (inp.value.trim()) {
              updateBeat(beat.id, { keywords: [...beat.keywords, inp.value.trim()] })
              inp.value = ''
            }
          }}>
            <input placeholder="+ tag" className="h-5 px-2 rounded-[var(--radius-pill)] text-[10px] border border-dashed border-[var(--border)] bg-transparent text-[var(--text-muted)] focus:border-[var(--border-active)] focus:text-[var(--text-primary)] outline-none w-16" />
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Snapshots panel ─────────────────────────────────────────────
function SnapshotsPanel({ beat }: { beat: Beat }) {
  const updateBeat = useBoundStore(s => s.updateBeat)

  const takeSnapshot = () => {
    const snap: BeatSnapshot = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      label: null,
      bodyJson: beat.bodyJson,
      charCount: JSON.stringify(beat.bodyJson).length,
    }
    const snaps = [...beat.snapshots, snap].slice(-50)
    updateBeat(beat.id, { snapshots: snaps })
  }

  const restore = (snap: BeatSnapshot) => {
    if (confirm('Restore this snapshot? Current notes will be replaced.')) {
      updateBeat(beat.id, { bodyJson: snap.bodyJson })
    }
  }

  const del = (id: string) => {
    updateBeat(beat.id, { snapshots: beat.snapshots.filter(s => s.id !== id) })
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <button onClick={takeSnapshot}
        className="flex items-center justify-center gap-2 h-9 rounded-[var(--radius-md)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors duration-[var(--dur-fast)]">
        <Camera size={13}/> Take Snapshot
      </button>

      {beat.snapshots.length === 0 ? (
        <p className="text-[12px] text-[var(--text-muted)] text-center py-4">No snapshots yet.</p>
      ) : (
        [...beat.snapshots].reverse().map(snap => (
          <div key={snap.id} className="flex items-center gap-2 p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)]">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[var(--text-secondary)] truncate">
                {new Date(snap.timestamp).toLocaleString()}
              </p>
              {snap.label && <p className="text-[11px] text-[var(--accent-orange)] truncate">{snap.label}</p>}
            </div>
            <button onClick={() => restore(snap)} title="Restore"
              className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent-teal)] hover:bg-[var(--accent-teal-10)] transition-colors">
              <RotateCcw size={12}/>
            </button>
            <button onClick={() => del(snap.id)} title="Delete"
              className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--status-blocked)] transition-colors">
              <X size={12}/>
            </button>
          </div>
        ))
      )}
    </div>
  )
}

// ── Bookmarks panel ─────────────────────────────────────────────
function BookmarksPanel({ beat }: { beat: Beat }) {
  const updateBeat = useBoundStore(s => s.updateBeat)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')

  const add = () => {
    if (!url.trim()) return
    const bm: BookmarkType = {
      id: crypto.randomUUID(),
      type: 'external',
      title: title.trim() || url,
      url: url.trim(),
    }
    updateBeat(beat.id, { bookmarks: [...beat.bookmarks, bm] })
    setUrl(''); setTitle('')
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-2 p-3 rounded-[var(--radius-md)] border border-[var(--border)]"
        style={{ background: 'var(--bg-input)' }}>
        <input value={title} onChange={e=>setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="h-7 px-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] outline-none bg-transparent" />
        <div className="flex gap-2">
          <input value={url} onChange={e=>setUrl(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&add()}
            placeholder="https://…"
            className="flex-1 h-7 px-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] outline-none bg-transparent" />
          <button onClick={add}
            className="px-3 h-7 rounded-[var(--radius-sm)] bg-[var(--accent-orange)] text-white text-[11px] font-medium hover:bg-[var(--accent-orange-dim)] transition-colors">
            <Plus size={12}/>
          </button>
        </div>
      </div>

      {beat.bookmarks.length === 0 ? (
        <p className="text-[12px] text-[var(--text-muted)] text-center py-4">No bookmarks yet.</p>
      ) : (
        beat.bookmarks.map(bm => (
          <div key={bm.id} className="flex items-center gap-2 p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)]">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-[var(--text-primary)] truncate">{bm.title}</p>
              {bm.url && <p className="text-[10px] text-[var(--text-muted)] truncate">{bm.url}</p>}
            </div>
            {bm.url && (
              <a href={bm.url} target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent-teal)] transition-colors">
                <ExternalLink size={12}/>
              </a>
            )}
            <button onClick={() => updateBeat(beat.id, { bookmarks: beat.bookmarks.filter(b=>b.id!==bm.id) })}
              className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--status-blocked)] transition-colors">
              <X size={12}/>
            </button>
          </div>
        ))
      )}
    </div>
  )
}

// ── Comments panel ──────────────────────────────────────────────
function CommentsPanel({ beat }: { beat: Beat }) {
  const updateBeat = useBoundStore(s => s.updateBeat)
  const [text, setText] = useState('')

  const addComment = () => {
    if (!text.trim()) return
    updateBeat(beat.id, {
      comments: [...beat.comments, {
        id: crypto.randomUUID(),
        body: text.trim(),
        createdAt: new Date().toISOString(),
      }]
    })
    setText('')
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex gap-2">
        <input value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&addComment()}
          placeholder="Add a comment…"
          className="flex-1 h-8 px-3 rounded-[var(--radius-md)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] outline-none"
          style={{ background: 'var(--bg-input)' }} />
        <button onClick={addComment}
          className="px-3 h-8 rounded-[var(--radius-md)] bg-[var(--accent-orange)] text-white text-[12px] hover:bg-[var(--accent-orange-dim)] transition-colors">
          <Plus size={13}/>
        </button>
      </div>

      {beat.comments.length === 0 ? (
        <p className="text-[12px] text-[var(--text-muted)] text-center py-4">No comments yet.</p>
      ) : (
        [...beat.comments].reverse().map(c => (
          <div key={c.id} className="flex gap-2 p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)]">
            <div className="flex-1">
              <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">{c.body}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{new Date(c.createdAt).toLocaleString()}</p>
            </div>
            <button onClick={() => updateBeat(beat.id, { comments: beat.comments.filter(x=>x.id!==c.id) })}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--status-blocked)] transition-colors self-start">
              <X size={11}/>
            </button>
          </div>
        ))
      )}
    </div>
  )
}

// ── Beat detail view ─────────────────────────────────────────────
function BeatDetail({ beat }: { beat: Beat }) {
  const updateBeat = useBoundStore(s => s.updateBeat)
  const { activeInspectorTab: activeTab } = useBoundStore(s => ({ activeInspectorTab: s.activeInspectorTab }))
  const setActiveTab = useBoundStore(s => s.setActiveInspectorTab)

  const TAB_DEF: { id: Tab; label: string }[] = [
    { id:'notes',    label:'Notes'     },
    { id:'metadata', label:'Info'      },
    { id:'snapshots',label:'Snapshots' },
    { id:'bookmarks',label:'Links'     },
    { id:'comments', label:'Comments'  },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Beat title */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: beat.labelColour || 'var(--accent-teal)' }} />
          <input
            value={beat.title}
            onChange={e => updateBeat(beat.id, { title: e.target.value })}
            className="flex-1 font-[family-name:var(--font-heading)] font-semibold text-[15px] text-[var(--text-primary)] uppercase tracking-wide bg-transparent outline-none border-b border-transparent focus:border-[var(--border-active)] transition-colors"
            placeholder="Beat title"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-0 relative">
          {TAB_DEF.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-3 h-7 text-[11px] font-medium transition-all duration-[var(--dur-fast)] relative',
                activeTab===tab.id
                  ? 'text-[var(--accent-orange)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}>
              {tab.label}
              {activeTab===tab.id && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[var(--accent-orange)] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={activeTab}
            className="h-full overflow-y-auto"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: EASE }}>
            {activeTab === 'notes' && (
              <NotesEditor
                content={beat.bodyJson}
                onChange={json => updateBeat(beat.id, { bodyJson: json })}
                placeholder="Write your beat notes here… use #dramatic, #logline, or #theme to link to your story anchors."
                onTagClick={(anchor: NarrativeAnchor) => {
                  useBoundStore.getState().openNarrativeAnchor(anchor)
                }}
              />
            )}
            {activeTab === 'metadata'  && <MetadataPanel beat={beat} />}
            {activeTab === 'snapshots' && <SnapshotsPanel beat={beat} />}
            {activeTab === 'bookmarks' && <BookmarksPanel beat={beat} />}
            {activeTab === 'comments'  && <CommentsPanel beat={beat} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Inspector Panel root ────────────────────────────────────────
export function InspectorPanel() {
  const { inspectorOpen, selectedBeatId, activeOutlineId } = useUI()
  const beat = useBoundStore(s =>
    s.beats.find(b => b.id === selectedBeatId)
  )

  return (
    <aside
      className="flex flex-col border-l border-[var(--border)] flex-shrink-0"
      style={{
        width: inspectorOpen ? 'var(--inspector-width)' : '0px',
        background: 'var(--bg-secondary)',
        overflow: 'hidden',
        transition: 'width var(--dur-medium) var(--ease-in-out)',
      }}
    >
      <div style={{
        width: 'var(--inspector-width)',
        opacity: inspectorOpen ? 1 : 0,
        transition: 'opacity var(--dur-normal) var(--ease-in-out)',
        display: 'flex', flexDirection: 'column', height: '100%',
      }}>
        {/* Header */}
        <div className="flex items-center px-4 h-10 border-b border-[var(--border-subtle)] flex-shrink-0">
          <span className="text-[11px] uppercase tracking-widest font-[family-name:var(--font-heading)] font-semibold text-[var(--text-muted)]">
            Inspector
          </span>
          {beat && (
            <span className="ml-2 text-[10px] text-[var(--accent-orange)] font-[family-name:var(--font-heading)]">
              — {beat.title.slice(0, 20)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {beat ? (
              <motion.div key={beat.id} className="h-full"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16, ease: EASE }}>
                <BeatDetail beat={beat} />
              </motion.div>
            ) : (
              <motion.div key="empty"
                className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                  {activeOutlineId
                    ? 'Click any beat to view its notes and details.'
                    : 'Select an outline to get started.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  )
}
