// ============================================================
// MYTHWRIGHT — TOAST NOTIFICATION SYSTEM
// Lightweight stack of animated toasts, auto-dismiss, 4 types.
// Global: use useToast() hook from anywhere.
// ============================================================
import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id:       string
  type:     ToastType
  message:  string
  duration: number  // ms, 0 = persistent
}

interface ToastContextValue {
  toasts:    Toast[]
  addToast:  (message: string, type?: ToastType, duration?: number) => void
  dismiss:   (id: string) => void
}

// ── Context ──────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return {
    toast:   (msg: string, duration?: number) => ctx.addToast(msg, 'info',    duration),
    success: (msg: string, duration?: number) => ctx.addToast(msg, 'success', duration),
    error:   (msg: string, duration?: number) => ctx.addToast(msg, 'error',   duration ?? 5000),
    warn:    (msg: string, duration?: number) => ctx.addToast(msg, 'warning', duration),
    dismiss: ctx.dismiss,
  }
}

// ── Visual config ─────────────────────────────────────────────
const TYPE_CONFIG = {
  success: { Icon: CheckCircle,   colour: 'var(--status-final)',   bg: 'var(--accent-teal-10)'      },
  error:   { Icon: AlertCircle,   colour: 'var(--status-blocked)', bg: 'rgba(196,80,80,0.12)'       },
  warning: { Icon: AlertTriangle, colour: 'var(--spotlight-gold)', bg: 'rgba(240,180,41,0.12)'      },
  info:    { Icon: Info,          colour: 'var(--accent-teal)',    bg: 'var(--accent-teal-10)'      },
} as const

const EASE = [0, 0, 0.2, 1] as const

// ── Single Toast ─────────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { Icon, colour, bg } = TYPE_CONFIG[toast.type]

  useEffect(() => {
    if (toast.duration === 0) return
    const t = setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => clearTimeout(t)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <motion.div
      layout
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      initial={{ opacity: 0, x: 48, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{   opacity: 0, x: 48, scale: 0.96 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-modal)] max-w-[360px] w-full"
      style={{ background: bg }}
    >
      <Icon size={16} style={{ color: colour }} className="flex-shrink-0" />
      <p className="flex-1 text-[13px] text-[var(--text-primary)] leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="flex-shrink-0 p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <X size={12} />
      </button>
    </motion.div>
  )
}

// ── Provider ──────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev.slice(-4), { id, type, message, duration }]) // max 5
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismiss }}>
      {children}
      {/* Toast stack — bottom-right, fixed */}
      <div
        className="fixed bottom-6 right-6 z-[2000] flex flex-col gap-2 items-end pointer-events-none"
        aria-label="Notifications"
        role="region"
      >
        <AnimatePresence mode="sync">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
