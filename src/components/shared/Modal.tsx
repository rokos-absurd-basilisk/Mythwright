import { useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface ModalProps {
  open:       boolean
  onClose:    () => void
  title?:     string
  size?:      'sm' | 'md' | 'lg'
  children:   React.ReactNode
  className?: string
}

const SIZES = { sm:'max-w-sm', md:'max-w-md', lg:'max-w-lg' }
const EASE  = [0, 0, 0.2, 1] as const

export function Modal({ open, onClose, title, size = 'sm', children, className }: ModalProps) {
  const dialogRef    = useRef<HTMLDivElement>(null)
  const shouldReduce = useReducedMotion()

  useFocusTrap(dialogRef, open)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[998] backdrop-blur-sm"
            style={{ background: 'var(--dim-overlay)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduce ? 0 : 0.18 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={clsx(
              'fixed z-[999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-[calc(100vw-2rem)] rounded-[var(--radius-xl)]',
              'border border-[var(--border)]',
              'shadow-[var(--shadow-modal)]',
              SIZES[size], className
            )}
            style={{ background: 'var(--bg-secondary)' }}
            initial={{ opacity: 0, scale: shouldReduce ? 1 : 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{   opacity: 0, scale: shouldReduce ? 1 : 0.97 }}
            transition={{ duration: shouldReduce ? 0 : 0.18, ease: EASE }}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border-subtle)]">
                <h2
                  id="modal-title"
                  className="font-[family-name:var(--font-heading)] text-[15px] font-bold uppercase tracking-widest text-[var(--text-primary)]"
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-teal-10)] transition-colors duration-[var(--dur-fast)]"
                >
                  <X size={15} />
                </button>
              </div>
            )}
            <div className="px-5 py-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
