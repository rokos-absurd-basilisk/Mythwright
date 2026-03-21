import { ReactNode, useState, useRef } from 'react'
import { clsx } from 'clsx'

interface TooltipProps {
  content: string
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ content, children, placement = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    timer.current = setTimeout(() => setVisible(true), 400)
  }
  const hide = () => {
    if (timer.current) clearTimeout(timer.current)
    setVisible(false)
  }

  const placementClasses: Record<string, string> = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <span
          role="tooltip"
          className={clsx(
            'absolute z-[1100] pointer-events-none whitespace-nowrap',
            'px-2.5 py-1.5 rounded-[var(--radius-md)]',
            'text-[12px] text-[var(--text-secondary)] font-[family-name:var(--font-body)]',
            'border border-[var(--border)] animate-fade-in',
            placementClasses[placement], className
          )}
          style={{ background: 'var(--bg-tooltip)', boxShadow: 'var(--shadow-card)' }}
        >
          {content}
        </span>
      )}
    </span>
  )
}
