import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBoundStore, useUI } from '../../store'
import { Toolbar }               from './Toolbar'
import { LeftColumn }            from '../narrative/LeftColumn'
import { NarrativeAnchorStrip }  from '../narrative/NarrativeAnchorStrip'
import { CanvasContainer }       from '../canvas/CanvasContainer'
import { SplitView }             from '../canvas/SplitView'
import { InspectorPanel }        from '../inspector/InspectorPanel'
import { QuickSearch }           from '../search/QuickSearch'
import { OnboardingTutorial }    from '../tutorial/OnboardingTutorial'
import { SettingsPanel }         from '../settings/SettingsPanel'

const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const

export function AppShell() {
  const { focusMode, splitMode } = useUI()
  const setFocusMode  = useBoundStore(s => s.setFocusMode)
  const setSplitMode  = useBoundStore(s => s.setSplitMode)
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const centreRef = useRef<HTMLDivElement>(null)
  const [centreHeight, setCentreHeight] = useState(600)

  // Track centre panel height for SplitView
  useEffect(() => {
    if (!centreRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setCentreHeight(e.contentRect.height)
    })
    ro.observe(centreRef.current)
    setCentreHeight(centreRef.current.offsetHeight)
    return () => ro.disconnect()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F11') { e.preventDefault(); setFocusMode(!focusMode) }
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'k') { e.preventDefault(); setSearchOpen(s => !s) }
      if (mod && e.key === '\\') { e.preventDefault(); setSplitMode(!splitMode) }
      if (e.key === 'Escape') {
        if (searchOpen)   { setSearchOpen(false);   return }
        if (settingsOpen) { setSettingsOpen(false);  return }
        if (focusMode)    { setFocusMode(false);     return }
        if (splitMode)    { setSplitMode(false);     return }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [focusMode, splitMode, searchOpen, settingsOpen, setFocusMode, setSplitMode])

  return (
    <div className="flex flex-col h-full overflow-hidden" role="application" aria-label="Mythwright story outliner" style={{ background: 'var(--bg-primary)' }}>

      {/* Toolbar */}
      <AnimatePresence initial={false}>
        {!focusMode && (
          <motion.div key="toolbar"
            initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:48 }}
            exit={{ opacity:0, height:0 }}
            transition={{ duration:0.2, ease:EASE_IN_OUT }}
            className="overflow-hidden flex-shrink-0">
            <Toolbar
              onSearchOpen={() => setSearchOpen(true)}
              onSettingsOpen={() => setSettingsOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Three-panel body */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left column — bi-modal */}
        <LeftColumn />

        {/* Centre column */}
        <div ref={centreRef} className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Narrative anchor strip — hidden in split mode + focus mode */}
          <AnimatePresence initial={false}>
            {!focusMode && !splitMode && (
              <motion.div key="strip"
                initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:38 }}
                exit={{ opacity:0, height:0 }}
                transition={{ duration:0.16, ease:EASE_IN_OUT }}
                className="flex-shrink-0 overflow-hidden">
                <NarrativeAnchorStrip />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas — single or split */}
          <AnimatePresence mode="wait" initial={false}>
            {splitMode ? (
              <motion.div key="split"
                className="flex-1 overflow-hidden"
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                exit={{ opacity:0 }}
                transition={{ duration:0.2, ease:EASE_IN_OUT }}>
                <SplitView totalHeight={centreHeight - (focusMode ? 0 : 0)} />
              </motion.div>
            ) : (
              <motion.div key="single"
                className="flex-1 overflow-hidden"
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                exit={{ opacity:0 }}
                transition={{ duration:0.2, ease:EASE_IN_OUT }}>
                <CanvasContainer />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right panel — Inspector */}
        <InspectorPanel />
      </div>

      {/* Focus mode hint */}
      <AnimatePresence>
        {focusMode && (
          <motion.div key="focus-hint"
            className="fixed bottom-4 right-4 px-3 py-1.5 rounded-[var(--radius-md)] text-xs text-[var(--text-muted)] border border-[var(--border)] pointer-events-none z-50"
            style={{ background:'var(--bg-secondary)' }}
            initial={{ opacity:0, y:8 }} animate={{ opacity:0.7, y:0 }}
            exit={{ opacity:0, y:8 }} transition={{ duration:0.2 }}>
            Press Esc to exit Focus Mode
          </motion.div>
        )}
        {splitMode && !focusMode && (
          <motion.div key="split-hint"
            className="fixed bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-[var(--radius-md)] text-xs text-[var(--text-muted)] border border-[var(--accent-orange)] pointer-events-none z-50"
            style={{ background:'var(--bg-secondary)', color:'var(--accent-orange)' }}
            initial={{ opacity:0, y:8 }} animate={{ opacity:0.85, y:0 }}
            exit={{ opacity:0, y:8 }} transition={{ duration:0.2, delay:0.3 }}>
            Split Mode — drag beats between panels to copy · Cmd+\ or Esc to exit
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global overlays */}
      <QuickSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <OnboardingTutorial />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
