// ============================================================
// MYTHWRIGHT — NARRATIVE ANCHOR STRIP
// Thin ambient strip above the canvas showing 3 story pillars.
// Peripheral-zone design: always readable, never distracting.
// Clicking a pill toggles the Narrative Context Panel (left col).
// ============================================================
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { HelpCircle, AlignLeft, Flame } from 'lucide-react'
import { useBoundStore, useUI } from '../../store'
import { type NarrativeAnchor, type TipTapJSON } from '../../types'

interface AnchorDef {
  id:          NarrativeAnchor
  label:       string
  shortLabel:  string
  placeholder: string
  Icon:        typeof HelpCircle
}

const ANCHORS: AnchorDef[] = [
  { id:'dramaticQuestion', label:'Dramatic Question', shortLabel:'Dramatic Q.',
    placeholder:'Will they escape before the city falls?', Icon:HelpCircle },
  { id:'logline',          label:'Logline',           shortLabel:'Logline',
    placeholder:'[Protagonist] must [goal] before [stakes].', Icon:AlignLeft },
  { id:'themeStated',      label:'Theme Stated',      shortLabel:'Theme',
    placeholder:'Love requires sacrifice.', Icon:Flame },
]

const EASE = [0, 0, 0.2, 1] as const

/** Extract first ~60 chars of plain text from TipTap JSON */
function jsonPreview(json: TipTapJSON | null | undefined): string | null {
  if (!json) return null
  try {
    const nodes = (json as { content?: { content?: { text?: string }[] }[] }).content
    if (!Array.isArray(nodes)) return null
    const texts: string[] = []
    for (const block of nodes) {
      for (const inline of block.content ?? []) {
        if (inline.text) texts.push(inline.text)
      }
      if (texts.join('').length >= 60) break
    }
    const full = texts.join('').trim()
    return full.length > 60 ? full.slice(0, 58) + '…' : full || null
  } catch {
    return null
  }
}

function AnchorPill({ def }: { def: AnchorDef }) {
  const { leftPanelMode, narrativeActiveAnchor, activeOutlineId } = useUI()
  const openAnchor = useBoundStore(s => s.openNarrativeAnchor)
  const outline    = useBoundStore(s => s.outlines.find(o => o.id === activeOutlineId))

  const content    = outline?.[def.id] as TipTapJSON | null | undefined
  const preview    = jsonPreview(content)
  const hasContent = preview !== null
  const isActive   = leftPanelMode === 'narrative' && narrativeActiveAnchor === def.id

  return (
    <motion.button
      layout
      onClick={() => openAnchor(def.id)}
      title={isActive ? `Close ${def.label}` : `Open ${def.label}`}
      className={clsx(
        'flex items-center gap-1.5 px-3 h-7 rounded-[var(--radius-pill)]',
        'text-[11px] font-medium border transition-all duration-[var(--dur-normal)]',
        'max-w-[260px] min-w-[120px] relative group',
        // Active state (panel open for this anchor)
        isActive && 'border-[var(--accent-orange)] text-[var(--accent-orange)]',
        // Filled but inactive
        !isActive && hasContent && 'border-[var(--accent-teal)] text-[var(--text-secondary)]',
        // Empty
        !isActive && !hasContent && 'border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-active)] hover:text-[var(--text-secondary)]',
      )}
      style={{
        background: isActive
          ? 'var(--accent-orange-10)'
          : hasContent
            ? 'var(--accent-teal-10)'
            : 'transparent',
      }}
    >
      <def.Icon size={11} className="flex-shrink-0 opacity-70" />
      <span className="font-[family-name:var(--font-heading)] uppercase tracking-wide text-[10px] opacity-70 flex-shrink-0">
        {def.shortLabel}
      </span>
      {hasContent && (
        <span className="truncate text-[11px] opacity-80 font-normal font-[family-name:var(--font-body)]">
          {preview}
        </span>
      )}
      {!hasContent && (
        <span className="opacity-40 font-normal">
          + Add
        </span>
      )}

      {/* Indicator dot for filled */}
      {hasContent && !isActive && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: 'var(--accent-teal)', opacity: 0.7 }} />
      )}
    </motion.button>
  )
}

export function NarrativeAnchorStrip() {
  const { activeOutlineId } = useUI()
  if (!activeOutlineId) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: EASE }}
      className="flex items-center gap-2 px-4 flex-shrink-0 border-b border-[var(--border-subtle)]"
      style={{
        height: '38px',
        background: 'var(--bg-secondary)',
        // Subtle gradient towards the canvas
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Label */}
      <span className="text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)] font-[family-name:var(--font-heading)] font-semibold flex-shrink-0 pr-1">
        Story
      </span>
      <div className="w-px h-3 bg-[var(--border)]" />

      {/* Anchor pills */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {ANCHORS.map(def => <AnchorPill key={def.id} def={def} />)}
      </div>
    </motion.div>
  )
}
