import { clsx } from 'clsx'
import { type StatusType } from '../../types'

interface BadgeProps {
  status: StatusType
  className?: string
}

const LABELS: Record<StatusType, string> = {
  draft:       'Draft',
  in_progress: 'In Progress',
  final:       'Final',
  blocked:     'Blocked',
}

const COLOURS: Record<StatusType, string> = {
  draft:       'bg-[var(--status-draft)] text-white',
  in_progress: 'bg-[var(--status-progress)] text-white',
  final:       'bg-[var(--status-final)] text-[var(--bg-secondary)]',
  blocked:     'bg-[var(--status-blocked)] text-white',
}

export function Badge({ status, className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 h-5 rounded-[var(--radius-pill)]',
      'text-[10px] font-semibold font-[family-name:var(--font-body)] uppercase tracking-widest',
      COLOURS[status], className
    )}>
      {LABELS[status]}
    </span>
  )
}
