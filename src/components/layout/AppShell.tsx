import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBoundStore, useUI } from '../../store'
import { Toolbar } from './Toolbar'
import { Binder } from '../binder/Binder'
import { CanvasContainer } from '../canvas/CanvasContainer'
import { InspectorPanel } from '../inspector/InspectorPanel'

const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const

export function AppShell() {
  const { focusMode } = useUI()
  const setFocusMode = useBoundStore(s => s.setFocusMode)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F11') { e.preventDefault(); setFocusMode(!focusMode) }
      if (e.key === 'Escape' && focusMode) setFocusMode(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [focusMode, setFocusMode])

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Toolbar */}
      <AnimatePresence initial={false}>
        {!focusMode && (
          <motion.div
            key="toolbar"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 48 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: EASE_IN_OUT }}
            className="overflow-hidden flex-shrink-0"
          >
            <Toolbar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Three-panel body */}
      <div className="flex flex-1 overflow-hidden">
        <Binder />
        <CanvasContainer />
        <InspectorPanel />
      </div>

      {/* Focus mode hint */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            key="focus-hint"
            className="fixed bottom-4 right-4 px-3 py-1.5 rounded-[var(--radius-md)] text-xs text-[var(--text-muted)] border border-[var(--border)] pointer-events-none z-50"
            style={{ background: 'var(--bg-secondary)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.7, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            Press Esc to exit Focus Mode
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
