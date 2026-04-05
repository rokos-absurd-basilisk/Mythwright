import { useState, useRef, useCallback, useEffect } from 'react'
import { Link2 } from 'lucide-react'
import { useBoundStore, useBeats, useUI } from '../../store'
import { type Beat } from '../../types'
import { clsx } from 'clsx'
import { LabelThreads } from './LabelThreads'

function IndexCard({ beat }: { beat: Beat }) {
  const setSelectedBeat = useBoundStore(s => s.setSelectedBeat)
  const { selectedBeatId } = useUI()
  const isSelected = selectedBeatId === beat.id
  return (
    <div
      data-beat-id={beat.id}
      onClick={() => setSelectedBeat(beat.id)}
      className={clsx(
        'relative flex flex-col rounded-[var(--radius-lg)] p-4 cursor-pointer select-none',
        'transition-all duration-[var(--dur-normal)] min-w-[180px]',
        isSelected
          ? 'shadow-[0_0_0_2px_var(--accent-teal)] scale-[1.02]'
          : 'hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:scale-[1.01]'
      )}
      style={{
        background: '#2a5555',
        borderBottom: `4px solid ${beat.labelColour || 'var(--accent-teal)'}`,
        boxShadow: isSelected ? undefined : 'var(--shadow-card)',
      }}
    >
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-primary)]"
        style={{ background: beat.labelColour || 'var(--accent-orange)' }}/>
      <h3 className="font-[family-name:var(--font-heading)] font-semibold text-[14px] text-[var(--text-primary)] uppercase tracking-wide leading-tight mt-1 line-clamp-2">
        {beat.title || 'Untitled'}
      </h3>
      {beat.synopsis && (
        <p className="mt-2 text-[12px] text-[var(--text-secondary)] leading-relaxed line-clamp-3">{beat.synopsis}</p>
      )}
      <div className="mt-auto pt-2 flex justify-end">
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)]">
          {beat.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  )
}

export function CorkboardView({ outlineId }: { outlineId: string }) {
  const beats   = useBeats(outlineId)
  const addBeat = useBoundStore(s => s.addBeat)
  const [columns, setColumns]         = useState(4)
  const [threadsOn, setThreadsOn]     = useState(false)
  const [activeColours, setActiveColours] = useState<Set<string>>(new Set())
  const [cardRects, setCardRects]     = useState<Record<string, { cx: number; cy: number }>>({})
  const [gridSize, setGridSize]       = useState({ w: 0, h: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef      = useRef<HTMLDivElement>(null)

  // Unique label colours in this outline
  const labelColours = [...new Set(beats.map(b => b.labelColour).filter(Boolean))]

  // Measure card centre positions relative to the container
  const measureCards = useCallback(() => {
    if (!containerRef.current || !gridRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const rects: Record<string, { cx: number; cy: number }> = {}
    containerRef.current.querySelectorAll('[data-beat-id]').forEach(el => {
      const id   = el.getAttribute('data-beat-id')!
      const rect = el.getBoundingClientRect()
      rects[id] = {
        cx: rect.left - containerRect.left + rect.width  / 2,
        cy: rect.top  - containerRect.top  + rect.height / 2,
      }
    })
    setCardRects(rects)
    setGridSize({ w: containerRect.width, h: containerRect.height })
  }, [])

  // Re-measure when beats or columns change
  useEffect(() => {
    if (!threadsOn) return
    const id = requestAnimationFrame(measureCards)
    return () => cancelAnimationFrame(id)
  }, [beats, columns, threadsOn, measureCards])

  // ResizeObserver to keep measurements fresh
  useEffect(() => {
    if (!containerRef.current || !threadsOn) return
    const ro = new ResizeObserver(measureCards)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [threadsOn, measureCards])

  const toggleThread = (colour: string) => {
    setActiveColours(prev => {
      const next = new Set(prev)
      next.has(colour) ? next.delete(colour) : next.add(colour)
      return next
    })
    if (!threadsOn) {
      setThreadsOn(true)
      requestAnimationFrame(measureCards)
    }
  }

  const toggleAllThreads = () => {
    if (threadsOn && activeColours.size > 0) {
      setActiveColours(new Set())
      setThreadsOn(false)
    } else {
      setActiveColours(new Set(labelColours))
      setThreadsOn(true)
      requestAnimationFrame(measureCards)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Controls bar */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-[var(--border-subtle)] flex-shrink-0">
        <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-[family-name:var(--font-heading)]">Columns</span>
        {[2,3,4,5,6].map(c => (
          <button key={c} onClick={() => setColumns(c)}
            className={clsx('w-7 h-7 rounded text-[12px] font-medium transition-colors duration-[var(--dur-fast)]',
              columns===c ? 'bg-[var(--accent-orange)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--accent-orange)]'
            )}>{c}</button>
        ))}

        {/* Thread toggle */}
        {labelColours.length > 0 && (
          <>
            <div className="w-px h-4 bg-[var(--border)] mx-1"/>
            <button
              onClick={toggleAllThreads}
              title="Toggle label colour threads"
              className={clsx(
                'flex items-center gap-1.5 px-2.5 h-7 rounded-[var(--radius-pill)] text-[11px] border transition-colors',
                threadsOn && activeColours.size > 0
                  ? 'border-[var(--accent-teal)] text-[var(--accent-teal)] bg-[var(--accent-teal-10)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
              )}>
              <Link2 size={11}/>Threads
            </button>
            {/* Per-colour toggles */}
            {threadsOn && labelColours.map(colour => (
              <button key={colour} onClick={() => toggleThread(colour)}
                title={`Toggle ${colour} thread`}
                className={clsx(
                  'w-5 h-5 rounded-full border-2 transition-all duration-[var(--dur-fast)]',
                  activeColours.has(colour) ? 'scale-110 border-white shadow-[0_0_0_1.5px_var(--accent-teal)]' : 'border-transparent opacity-50 hover:opacity-80'
                )}
                style={{ background: colour }}
                aria-label={`Thread colour ${colour}`}
                aria-pressed={activeColours.has(colour)}
              />
            ))}
          </>
        )}

        <div className="flex-1"/>
        <button onClick={() => addBeat(outlineId, 'New Beat')}
          className="flex items-center gap-1.5 px-3 h-7 rounded-[var(--radius-pill)] text-[11px] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors duration-[var(--dur-fast)]">
          + Add Card
        </button>
      </div>

      {/* Card grid + thread overlay */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-6 relative">
        {threadsOn && activeColours.size > 0 && (
          <LabelThreads
            cardRects={cardRects}
            beats={beats}
            activeColours={activeColours}
            width={gridSize.w}
            height={gridSize.h}
          />
        )}
        {beats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-[var(--text-muted)] text-sm">No beats yet.</p>
            <button onClick={() => addBeat(outlineId, 'New Beat')}
              className="text-[var(--accent-orange)] text-sm hover:text-[var(--accent-orange-dim)] transition-colors">
              + Add your first card
            </button>
          </div>
        ) : (
          <div ref={gridRef} className="grid gap-6 pt-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {beats.map((beat, i) => (
              <div key={beat.id} className="animate-beat-appear" style={{ animationDelay: `${i * 30}ms` }}>
                <IndexCard beat={beat}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
