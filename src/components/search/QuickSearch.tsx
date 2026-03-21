// ============================================================
// MYTHWRIGHT — QUICK SEARCH (Cmd+K)
// Animated command palette sliding from top-centre
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, BookOpen, GitBranch, FileText, Zap, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useBoundStore } from '../../store'
import { useQuickSearch, type SearchResult } from '../../hooks/useQuickSearch'

const TYPE_META = {
  story:   { Icon: BookOpen,   label: 'Story',   colour: 'var(--accent-orange)' },
  outline: { Icon: GitBranch,  label: 'Outline', colour: 'var(--accent-teal)' },
  beat:    { Icon: Zap,        label: 'Beat',    colour: '#7c5cb4' },
  note:    { Icon: FileText,   label: 'Note',    colour: '#4a9c6b' },
}

const EASE = [0, 0, 0.2, 1] as const
const GROUP_ORDER: SearchResult['type'][] = ['story', 'outline', 'beat', 'note']

function ResultRow({
  result, isActive, onClick,
}: { result: SearchResult; isActive: boolean; onClick: () => void }) {
  const { Icon, colour } = TYPE_META[result.type]
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75',
        isActive
          ? 'bg-[var(--accent-teal-10)]'
          : 'hover:bg-[var(--bg-card-hover)]'
      )}
    >
      <Icon size={14} style={{ color: colour }} className="flex-shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-medium text-[var(--text-primary)] truncate">
          {result.title}
        </span>
        {result.subtitle && (
          <span className="block text-[11px] text-[var(--text-muted)] truncate mt-0.5">
            {result.subtitle}
          </span>
        )}
      </span>
      <span
        className="flex-shrink-0 text-[9px] uppercase tracking-widest font-[family-name:var(--font-heading)] px-1.5 py-0.5 rounded"
        style={{ color: colour, background: `${colour}20` }}
      >
        {TYPE_META[result.type].label}
      </span>
    </button>
  )
}

interface QuickSearchProps {
  open: boolean
  onClose: () => void
}

export function QuickSearch({ open, onClose }: QuickSearchProps) {
  const [query, setQuery]     = useState('')
  const [cursor, setCursor]   = useState(0)
  const inputRef              = useRef<HTMLInputElement>(null)
  const results               = useQuickSearch(query)

  const setActiveOutline  = useBoundStore(s => s.setActiveOutline)
  const setActiveStory    = useBoundStore(s => s.setActiveStory)
  const setSelectedBeat   = useBoundStore(s => s.setSelectedBeat)
  const setInspectorOpen  = useBoundStore(s => s.setInspectorOpen)
  const toggleExpanded    = useBoundStore(s => s.toggleStoryExpanded)

  // Reset on open
  useEffect(() => {
    if (open) { setQuery(''); setCursor(0); setTimeout(() => inputRef.current?.focus(), 60) }
  }, [open])

  // Keyboard nav
  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape')   { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && results[cursor]) navigate(results[cursor])
  }, [results, cursor, onClose])

  const navigate = (r: SearchResult) => {
    if (r.type === 'story') {
      setActiveStory(r.id)
      toggleExpanded(r.id)
    } else if (r.type === 'outline') {
      if (r.storyId) { setActiveStory(r.storyId); toggleExpanded(r.storyId) }
      setActiveOutline(r.id)
    } else if (r.type === 'beat') {
      if (r.storyId) { setActiveStory(r.storyId); toggleExpanded(r.storyId) }
      if (r.outlineId) setActiveOutline(r.outlineId)
      setSelectedBeat(r.id)
      setInspectorOpen(true)
    }
    onClose()
  }

  // Group results by type preserving order
  const grouped = GROUP_ORDER
    .map(type => ({ type, items: results.filter(r => r.type === type) }))
    .filter(g => g.items.length > 0)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="qs-backdrop"
            className="fixed inset-0 z-[800]"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            key="qs-panel"
            className="fixed z-[801] left-1/2 w-[560px] rounded-[var(--radius-xl)] border border-[var(--border-active)] overflow-hidden"
            style={{
              top: '14vh',
              transform: 'translateX(-50%)',
              background: 'var(--bg-secondary)',
              boxShadow: 'var(--shadow-modal)',
              maxWidth: 'calc(100vw - 32px)',
            }}
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,   scale: 1 }}
            exit={{   opacity: 0, y: -12,  scale: 0.97 }}
            transition={{ duration: 0.18, ease: EASE }}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
              <Search size={16} className="text-[var(--text-muted)] flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setCursor(0) }}
                onKeyDown={handleKey}
                placeholder="Search stories, outlines, beats, notes…"
                className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  <X size={14} />
                </button>
              )}
              <kbd className="px-1.5 py-0.5 rounded text-[10px] text-[var(--text-muted)] border border-[var(--border)] font-[family-name:var(--font-mono)]">
                esc
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[380px] overflow-y-auto py-1">
              {query.trim() === '' && (
                <p className="px-4 py-6 text-center text-[13px] text-[var(--text-muted)]">
                  Start typing to search across all your stories, outlines, and beats.
                </p>
              )}

              {query.trim() !== '' && results.length === 0 && (
                <p className="px-4 py-6 text-center text-[13px] text-[var(--text-muted)]">
                  No results for <span className="text-[var(--text-secondary)]">"{query}"</span>
                </p>
              )}

              {grouped.map(({ type, items }) => {
                const { label, colour } = TYPE_META[type]
                return (
                  <div key={type}>
                    <div className="px-4 py-1.5 flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-[0.12em] font-[family-name:var(--font-heading)] font-semibold"
                        style={{ color: colour }}>
                        {label}s
                      </span>
                      <span className="flex-1 h-px" style={{ background: colour, opacity: 0.2 }} />
                    </div>
                    {items.map(r => {
                      const globalIdx = results.indexOf(r)
                      return (
                        <ResultRow
                          key={r.id}
                          result={r}
                          isActive={globalIdx === cursor}
                          onClick={() => navigate(r)}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {/* Footer hint */}
            {results.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 border-t border-[var(--border)]">
                {[['↑↓', 'Navigate'], ['↵', 'Open'], ['esc', 'Close']].map(([key, label]) => (
                  <span key={label} className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                    <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] font-[family-name:var(--font-mono)] text-[9px]">{key}</kbd>
                    {label}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
