// ============================================================
// MYTHWRIGHT — LEFT COLUMN (BI-MODAL WRAPPER)
// Renders either the Binder or the Narrative Context Panel.
// Width is always var(--binder-width). Canvas never shifts.
// The mode switch is a crossfade — content changes, not layout.
// ============================================================
import { AnimatePresence, motion } from 'framer-motion'
import { useUI } from '../../store'
import { Binder }                from '../binder/Binder'
import { NarrativeContextPanel } from './NarrativeContextPanel'

const EASE = [0, 0, 0.2, 1] as const

export function LeftColumn() {
  const { binderOpen, leftPanelMode } = useUI()

  return (
    // Outer shell controls width (same CSS transition as before)
    <aside
      className="flex flex-col border-r border-[var(--border)] flex-shrink-0 relative overflow-hidden"
      style={{
        width:      binderOpen ? 'var(--binder-width)' : '0px',
        background: 'var(--bg-secondary)',
        transition: 'width var(--dur-medium) var(--ease-in-out)',
        boxShadow:  binderOpen ? 'var(--shadow-panel)' : 'none',
      }}
    >
      {/* Inner wrapper — always binder-width, content cross-fades */}
      <div style={{ width: 'var(--binder-width)', height: '100%', position: 'relative' }}>
        <AnimatePresence mode="wait" initial={false}>
          {leftPanelMode === 'binder' ? (
            <motion.div key="binder"
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: EASE }}
            >
              <Binder />
            </motion.div>
          ) : (
            <motion.div key="narrative"
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: EASE }}
            >
              <NarrativeContextPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  )
}
