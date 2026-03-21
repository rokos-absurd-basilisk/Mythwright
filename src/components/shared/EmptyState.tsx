import React from 'react'
import { cn } from '../../lib/cn'
import { Button } from './Button'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 p-12 text-center', className)}>
      <div className="text-[var(--text-muted)]">{icon}</div>
      <div>
        <h3 className="font-heading text-[18px] font-medium uppercase tracking-wider text-[var(--text-primary)] mb-1">
          {title}
        </h3>
        {description && (
          <p className="text-[13px] text-[var(--text-secondary)] max-w-[280px] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
