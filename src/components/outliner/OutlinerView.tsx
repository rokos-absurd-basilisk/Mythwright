import { useBoundStore, useBeats, useUI } from '../../store'
import { type Beat } from '../../types'
import { clsx } from 'clsx'

const STATUS_LABELS = { draft:'Draft', in_progress:'In Progress', final:'Final', blocked:'Blocked' }
const STATUS_COLOURS = {
  draft:'var(--status-draft)', in_progress:'var(--status-progress)',
  final:'var(--status-final)', blocked:'var(--status-blocked)',
}

function OutlinerRow({ beat, index }: { beat: Beat; index: number }) {
  const setSelectedBeat = useBoundStore(s => s.setSelectedBeat)
  const updateBeat      = useBoundStore(s => s.updateBeat)
  const { selectedBeatId } = useUI()
  const isSelected = selectedBeatId === beat.id

  return (
    <tr
      onClick={() => setSelectedBeat(beat.id)}
      className={clsx(
        'cursor-pointer transition-colors duration-[var(--dur-fast)] group',
        isSelected ? 'bg-[var(--accent-teal-10)]' : 'hover:bg-[var(--bg-card-hover)]'
      )}
    >
      {/* Position */}
      <td className="px-3 py-2 text-[11px] text-[var(--text-muted)] w-10 text-center font-[family-name:var(--font-mono)]">
        {index + 1}
      </td>
      {/* Label stripe */}
      <td className="px-1 py-2 w-1">
        <span className="block w-[3px] h-5 rounded-full" style={{ background: beat.labelColour || 'var(--accent-teal)' }} />
      </td>
      {/* Title */}
      <td className="px-3 py-2 min-w-[180px]">
        <input
          value={beat.title}
          onChange={e => updateBeat(beat.id, { title: e.target.value })}
          onClick={e => e.stopPropagation()}
          className="w-full bg-transparent text-[13px] font-medium text-[var(--text-primary)] outline-none border-b border-transparent focus:border-[var(--border-active)] transition-colors"
          placeholder="Untitled"
        />
      </td>
      {/* Synopsis */}
      <td className="px-3 py-2 max-w-[280px]">
        <input
          value={beat.synopsis}
          onChange={e => updateBeat(beat.id, { synopsis: e.target.value })}
          onClick={e => e.stopPropagation()}
          className="w-full bg-transparent text-[12px] text-[var(--text-secondary)] outline-none border-b border-transparent focus:border-[var(--border-active)] transition-colors truncate"
          placeholder="Synopsis…"
        />
      </td>
      {/* Status */}
      <td className="px-3 py-2 w-28">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-[var(--radius-pill)]"
          style={{ background: `${STATUS_COLOURS[beat.status]}22`, color: STATUS_COLOURS[beat.status] }}>
          {STATUS_LABELS[beat.status]}
        </span>
      </td>
      {/* Micro-beat indicator */}
      <td className="px-3 py-2 w-16 text-center">
        {beat.isMicroBeat && <span className="text-[10px] text-[var(--accent-orange)]">⚡</span>}
      </td>
    </tr>
  )
}

export function OutlinerView({ outlineId }: { outlineId: string }) {
  const beats   = useBeats(outlineId)
  const addBeat = useBoundStore(s => s.addBeat)

  return (
    <div className="flex-1 overflow-hidden flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] sticky top-0 z-10" style={{ background: 'var(--bg-secondary)' }}>
              <th className="px-3 py-2 text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-[family-name:var(--font-heading)] text-center w-10">#</th>
              <th className="w-1" />
              <th className="px-3 py-2 text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-[family-name:var(--font-heading)] text-left">Title</th>
              <th className="px-3 py-2 text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-[family-name:var(--font-heading)] text-left">Synopsis</th>
              <th className="px-3 py-2 text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-[family-name:var(--font-heading)] text-left w-28">Status</th>
              <th className="px-3 py-2 text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-[family-name:var(--font-heading)] text-center w-16">Type</th>
            </tr>
          </thead>
          <tbody>
            {beats.map((beat, i) => <OutlinerRow key={beat.id} beat={beat} index={i} />)}
          </tbody>
        </table>

        {beats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-[var(--text-muted)] text-sm">No beats yet.</p>
            <button onClick={() => addBeat(outlineId, 'New Beat')}
              className="text-[var(--accent-orange)] text-sm hover:text-[var(--accent-orange-dim)] transition-colors">
              + Add your first beat
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-subtle)] flex-shrink-0"
        style={{ background: 'var(--bg-secondary)' }}>
        <span className="text-[11px] text-[var(--text-muted)]">{beats.length} beats</span>
        <button onClick={() => addBeat(outlineId, 'New Beat')}
          className="flex items-center gap-1.5 px-3 h-7 rounded-[var(--radius-pill)] text-[11px] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors duration-[var(--dur-fast)]">
          + Add Beat
        </button>
      </div>
    </div>
  )
}
