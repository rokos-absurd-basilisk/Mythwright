import React from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:   'bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-dim)] text-white',
  secondary: 'border border-[var(--border-active)] text-[var(--accent-teal)] hover:bg-[var(--accent-teal-10)] bg-transparent',
  ghost:     'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 bg-transparent',
  danger:    'bg-[#c45050] hover:bg-[#a83c3c] text-white',
}

const sizes: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5',
  md: 'text-sm px-3.5 py-2 gap-2',
  lg: 'text-sm px-5 py-2.5 gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-body font-medium rounded-[var(--radius-md)]',
        'transition-colors duration-[var(--dur-fast)]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-teal)] focus-visible:outline-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
}
