import { } from 'react'
import { motion } from 'framer-motion'
import { GripVertical, Zap } from 'lucide-react'
import { clsx } from 'clsx'
import { type Beat } from '../../types'
import { useBoundStore } from '../../store'

interface BeatCardProps {
  beat: Beat
  isDragging?: boolean
  isSelected?: boolean
  compact?: boolean
  style?: React.CSSProperties
  className?: string
}

const STATUS_COLOURS = {
  draft:       'var(--status-draft)',
  in_progress: 'var(--status-progress)',
  final:       'var(--status-final)',
  blocked:     'var(--status-blocked)',
}

export function BeatCard({ beat, isDragging, isSelected, compact, style, className }: BeatCardProps) {
  const setSelectedBeat = useBoundStore(s => s.setSelectedBeat)

  return (
    <motion.div
      animate={{
        scale:     isDragging ? 1.04 : 1,
        boxShadow: isDragging
          ? 'var(--shadow-card-drag)'
          : isSelected
            ? `0 0 0 2px var(--accent-teal), var(--shadow-card)`
            : 'var(--shadow-card)',
      }}
      transition={{ duration: 0.1, ease: [0, 0, 0.2, 1] }}
      onClick={() => setSelectedBeat(beat.id)}
      className={clsx(
        'relative flex flex-col rounded-[var(--radius-lg)] border cursor-pointer select-none',
        'transition-colors duration-[var(--dur-fast)] group',
        isSelected
          ? 'border-[var(--border-active)] bg-[var(--bg-card-hover)]'
          : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-active)] hover:bg-[var(--bg-card-hover)]',
        compact ? 'min-w-[120px] max-w-[160px]' : 'w-full',
        className
      )}
      style={style}
    >
      {/* Coloured left stripe */}
      <span
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
        style={{ background: beat.labelColour || 'var(--accent-teal)' }}
      />

      <div className={clsx('pl-3 pr-2', compact ? 'py-2' : 'py-2.5')}>
        {/* Top row: drag handle + title + micro-beat indicator */}
        <div className="flex items-start gap-1.5">
          <GripVertical
            size={12}
            className="flex-shrink-0 mt-0.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
          />
          <span className={clsx(
            'flex-1 font-[family-name:var(--font-heading)] font-medium text-[var(--text-primary)] min-w-0',
            compact ? 'text-[11px] line-clamp-2' : 'text-[13px] leading-snug truncate'
          )}>
            {beat.title || 'Untitled Beat'}
          </span>
          {beat.isMicroBeat && (
            <Zap size={10} className="flex-shrink-0 mt-0.5 text-[var(--accent-orange)]" />
          )}
        </div>

        {/* Synopsis — only in non-compact mode */}
        {!compact && beat.synopsis && (
          <p className="mt-1 text-[12px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {beat.synopsis}
          </p>
        )}

        {/* Status dot */}
        {!compact && (
          <div className="flex items-center justify-end mt-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: STATUS_COLOURS[beat.status] }}
              title={beat.status.replace('_', ' ')}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Micro-beat variant — smaller, dot-indicator only
export function MicroBeatDot({ beat }: { beat: Beat }) {
  const setSelectedBeat = useBoundStore(s => s.setSelectedBeat)
  return (
    <button
      onClick={() => setSelectedBeat(beat.id)}
      title={beat.title}
      className="group flex flex-col items-center gap-1"
    >
      <span
        className="w-2 h-2 rounded-full border-2 border-[var(--bg-primary)] transition-transform group-hover:scale-125"
        style={{ background: beat.labelColour || 'var(--accent-teal)' }}
      />
      <span className="text-[9px] text-[var(--text-muted)] max-w-[60px] truncate hidden group-hover:block">
        {beat.title}
      </span>
    </button>
  )
}
