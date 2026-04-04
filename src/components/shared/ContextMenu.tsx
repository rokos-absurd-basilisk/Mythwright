// ============================================================
// MYTHWRIGHT — CONTEXT MENU
// Portal-based right-click menu. Auto-clamps to viewport.
// ============================================================
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

export interface ContextMenuItem {
  id:       string
  label:    string
  icon?:    React.ReactNode
  danger?:  boolean
  divider?: boolean
  disabled?: boolean
  action:   () => void
}

interface ContextMenuProps {
  items:   ContextMenuItem[]
  x:       number
  y:       number
  open:    boolean
  onClose: () => void
}

const EASE = [0, 0, 0.2, 1] as const
const W = 188, ROW_H = 34

export function ContextMenu({ items, x, y, open, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', down, true)
    document.addEventListener('keydown', key, true)
    return () => { document.removeEventListener('mousedown', down, true); document.removeEventListener('keydown', key, true) }
  }, [open, onClose])

  const realItems = items.filter(i => !i.divider || items.indexOf(i) > 0)
  const estimatedH = realItems.length * ROW_H + 8
  const cx = Math.min(x, window.innerWidth  - W - 8)
  const cy = Math.min(y, window.innerHeight - estimatedH - 8)

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div ref={ref} role="menu" aria-label="Context menu"
          className="fixed z-[2000] py-1 min-w-[188px] rounded-[var(--radius-lg)] border border-[var(--border-active)] overflow-hidden"
          style={{ left: cx, top: cy, background:'var(--bg-secondary)', boxShadow:'var(--shadow-modal)' }}
          initial={{ opacity:0, scale:0.96, y:-4 }}
          animate={{ opacity:1, scale:1,    y:0   }}
          exit={{   opacity:0, scale:0.96, y:-4   }}
          transition={{ duration:0.12, ease:EASE }}
        >
          {items.map(item => (
            <div key={item.id}>
              {item.divider && <div className="my-1 h-px bg-[var(--border)]"/>}
              <button role="menuitem" disabled={item.disabled}
                onClick={() => { if (!item.disabled) { item.action(); onClose() } }}
                className={[
                  'w-full flex items-center gap-2.5 px-3 py-[7px] text-left text-[12px]',
                  'transition-colors duration-75 disabled:opacity-40 disabled:cursor-not-allowed',
                  item.danger
                    ? 'text-[var(--status-blocked)] hover:bg-[rgba(196,80,80,0.12)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--accent-teal-10)] hover:text-[var(--text-primary)]',
                ].join(' ')}
              >
                {item.icon && <span className="flex-shrink-0 opacity-70">{item.icon}</span>}
                {item.label}
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
