// ============================================================
// MYTHWRIGHT — NARRATIVE CONTEXT PANEL
// The bi-modal "other side" of the Binder. Same 240px column,
// zero canvas-width change. Three tabbed editors:
//   Dramatic Question · Logline · Theme Stated
//
// Design principles applied:
// • Symmetry: exact same width as Binder — canvas never shifts
// • Ambient zone: tiny pills in NarrativeAnchorStrip give
//   peripheral awareness; this panel gives focused depth
// • Non-destructive: #tags are ProseMirror decorations only,
//   never stored — plain text falls back correctly everywhere
// • Escape hatch: header "Back to Binder" is always visible
// ============================================================

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, HelpCircle, AlignLeft, Flame, Lightbulb } from 'lucide-react'
import { clsx } from 'clsx'
import { useBoundStore, useUI } from '../../store'
import { type NarrativeAnchor, type TipTapJSON } from '../../types'
import { NotesEditor } from '../inspector/NotesEditor'

// ── Anchor metadata ──────────────────────────────────────────
interface AnchorDef {
  id:          NarrativeAnchor
  label:       string
  tag:         string
  placeholder: string
  hint:        string
  Icon:        typeof HelpCircle
}

const ANCHORS: AnchorDef[] = [
  {
    id: 'dramaticQuestion',
    label: 'Dramatic Question',
    tag: '#dramatic',
    placeholder: 'Will [protagonist] achieve [goal] before [stakes make it impossible]?\n\nThe dramatic question is the single question the reader must have answered by the last page. Everything in the story either tightens or answers it.',
    hint: 'One sentence. High stakes. Binary answer at the end.',
    Icon: HelpCircle,
  },
  {
    id: 'logline',
    label: 'Logline',
    tag: '#logline',
    placeholder: 'When [inciting incident], a [protagonist with flaw] must [goal] before [ticking clock/stakes], or [consequence].\n\nA logline is a single sentence that captures the essence of your story. Use it to test whether your concept is strong enough.',
    hint: 'One sentence. Protagonist · Conflict · Stakes.',
    Icon: AlignLeft,
  },
  {
    id: 'themeStated',
    label: 'Theme Stated',
    tag: '#theme',
    placeholder: '"[Theme in one sentence]"\n\nThe theme is the moral or philosophical argument your story makes. It should be falsifiable — a claim you prove through your characters\' choices.\n\nAsk: what do I believe about [the central human truth in this story]?',
    hint: 'One sentence. What does the story argue about life?',
    Icon: Flame,
  },
]

const EASE = [0, 0, 0.2, 1] as const

// ── Tag hint component ───────────────────────────────────────
function TagHint({ tag }: { tag: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-[var(--border-subtle)] flex-shrink-0">
      <Lightbulb size={10} className="text-[var(--accent-teal)] flex-shrink-0 opacity-70" />
      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
        Type{' '}
        <code className="px-1 py-0.5 rounded text-[9px] font-[family-name:var(--font-mono)]"
          style={{ background:'var(--bg-input)', color:'var(--accent-teal)' }}>
          {tag}
        </code>
        {' '}anywhere in your beat notes to create a clickable link back here.
      </p>
    </div>
  )
}

// ── Anchor editor ────────────────────────────────────────────
function AnchorEditor({ def, outlineId }: { def: AnchorDef; outlineId: string }) {
  const outline     = useBoundStore(s => s.outlines.find(o => o.id === outlineId))
  const updateOutline = useBoundStore(s => s.updateOutline)
  

  if (!outline) return null

  const content = outline[def.id] as TipTapJSON | null

  const handleChange = (json: TipTapJSON) => {
    updateOutline(outlineId, { [def.id]: json })
  }

  return (
    <motion.div
      key={def.id}
      className="flex flex-col flex-1 overflow-hidden"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.16, ease: EASE }}
    >
      {/* Section header */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <def.Icon size={14} className="text-[var(--accent-orange)] flex-shrink-0" />
          <h3 className="font-[family-name:var(--font-heading)] text-[13px] font-bold uppercase tracking-widest text-[var(--accent-orange)]">
            {def.label}
          </h3>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          {def.hint}
        </p>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden border-t border-[var(--border-subtle)]">
        <NotesEditor
          content={content ?? {}}
          onChange={handleChange}
          placeholder={def.placeholder}
        />
      </div>

      {/* #tag usage hint */}
      <TagHint tag={def.tag} />
    </motion.div>
  )
}

// ── Main Narrative Context Panel ─────────────────────────────
export function NarrativeContextPanel() {
  const { narrativeActiveAnchor, activeOutlineId } = useUI()
  const openAnchor      = useBoundStore(s => s.openNarrativeAnchor)
  const closePanel      = useBoundStore(s => s.closeNarrativePanel)
  const outline         = useBoundStore(s => s.outlines.find(o => o.id === activeOutlineId))

  if (!activeOutlineId || !outline) return null

  const activeDef = ANCHORS.find(a => a.id === narrativeActiveAnchor)!

  // Check fill status for tab indicators
  const isFilled = (id: NarrativeAnchor): boolean => {
    const val = outline[id] as TipTapJSON | null
    if (!val) return false
    const c = (val as { content?: unknown[] }).content
    return Array.isArray(c) && c.length > 0
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--bg-secondary)' }}
    >
      {/* Header with back button */}
      <div
        className="flex items-center gap-0 px-1 h-10 border-b border-[var(--border-subtle)] flex-shrink-0"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <button
          onClick={closePanel}
          className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-teal-10)] transition-all duration-[var(--dur-fast)] flex items-center gap-1.5"
          title="Back to Binder"
        >
          <ArrowLeft size={14} />
        </button>
        <div className="w-px h-4 bg-[var(--border)] mx-1" />
        <span className="text-[10px] uppercase tracking-widest font-[family-name:var(--font-heading)] font-semibold text-[var(--text-muted)] px-1">
          Story Anchors
        </span>
      </div>

      {/* Tab row — three anchor tabs */}
      <div
        className="flex flex-shrink-0 border-b border-[var(--border)]"
        style={{ background: 'var(--bg-secondary)' }}
      >
        {ANCHORS.map(def => {
          const isActive  = narrativeActiveAnchor === def.id
          const filled    = isFilled(def.id)
          return (
            <button
              key={def.id}
              onClick={() => openAnchor(def.id)}
              className={clsx(
                'relative flex-1 flex flex-col items-center justify-center py-2 px-1 gap-0.5',
                'transition-all duration-[var(--dur-fast)] group',
                isActive
                  ? 'text-[var(--accent-orange)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
            >
              <def.Icon size={13} />
              <span className="text-[9px] font-[family-name:var(--font-heading)] uppercase tracking-wide leading-none">
                {def.id === 'dramaticQuestion' ? 'Question' :
                 def.id === 'logline'          ? 'Logline'  : 'Theme'}
              </span>
              {/* Fill dot */}
              {filled && !isActive && (
                <span
                  className="absolute top-1.5 right-2 w-1 h-1 rounded-full"
                  style={{ background: 'var(--accent-teal)' }}
                />
              )}
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                  style={{ background: 'var(--accent-orange)' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Editor — animated on anchor switch */}
      <AnimatePresence mode="wait" initial={false}>
        <AnchorEditor
          key={narrativeActiveAnchor}
          def={activeDef}
          outlineId={activeOutlineId}
        />
      </AnimatePresence>
    </div>
  )
}
