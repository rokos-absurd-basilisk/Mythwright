import { BookOpen, GitBranch } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBoundStore, useUI } from '../../store'
import { BookerFramework }     from '../frameworks/BookerFramework'
import { VonnegutFramework }   from '../frameworks/VonnegutFramework'
import { ThreeActFramework }   from '../frameworks/ThreeActFramework'
import { FiveActFramework }    from '../frameworks/FiveActFramework'
import { SevenPointFramework } from '../frameworks/SevenPointFramework'
import { SaveTheCatFramework } from '../frameworks/SaveTheCatFramework'
import { ToolboxFramework }    from '../frameworks/ToolboxFramework'
import { CorkboardView }       from '../corkboard/CorkboardView'
import { MindmapView }         from '../mindmap/MindmapView'
import { OutlinerView }        from '../outliner/OutlinerView'

const FRAMEWORK_NAMES: Record<number, string> = {
  1:"Booker's 7 Types",      2:"Vonnegut's Story Shapes",
  3:"3-Act Structure",       4:"5-Act / Freytag's Pyramid",
  5:"7-Point Plot",          6:"Save the Cat",
  7:"The Toolbox",
}
const EASE = [0, 0, 0.2, 1] as const

export function CanvasContainer() {
  const { activeOutlineId, activeViewMode } = useUI()
  const outline = useBoundStore(s => s.outlines.find(o => o.id === activeOutlineId))

  if (!activeOutlineId || !outline) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4"
        style={{ background:'var(--bg-primary)' }}>
        <motion.div
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.2, ease:EASE }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <BookOpen size={48} className="text-[var(--text-muted)]" strokeWidth={1.5} />
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-1">
              No Outline Selected
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Select or create an outline in the Binder to begin plotting.
            </p>
          </div>
        </motion.div>
      </main>
    )
  }

  const id = outline.id

  const renderView = () => {
    if (activeViewMode === 'corkboard') return <CorkboardView outlineId={id} />
    if (activeViewMode === 'mindmap')   return <MindmapView   outlineId={id} />
    if (activeViewMode === 'outliner')  return <OutlinerView  outlineId={id} />
    switch (outline.frameworkId) {
      case 1: return <BookerFramework     outlineId={id} />
      case 2: return <VonnegutFramework   outlineId={id} />
      case 3: return <ThreeActFramework   outlineId={id} />
      case 4: return <FiveActFramework    outlineId={id} />
      case 5: return <SevenPointFramework outlineId={id} />
      case 6: return <SaveTheCatFramework outlineId={id} />
      case 7: return <ToolboxFramework    outlineId={id} />
      default: return null
    }
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden" style={{ background:'var(--bg-primary)' }}>
      {/* Framework identity strip */}
      <div
        className="flex items-center gap-2 px-4 flex-shrink-0 border-b border-[var(--border-subtle)]"
        style={{ height:'34px', background:'var(--bg-secondary)' }}
      >
        <GitBranch size={12} className="text-[var(--accent-orange)] flex-shrink-0" />
        <span className="text-[10px] uppercase tracking-widest font-[family-name:var(--font-heading)] font-semibold text-[var(--accent-orange)] flex-shrink-0">
          {FRAMEWORK_NAMES[outline.frameworkId]}
        </span>
        <span className="text-[10px] text-[var(--text-muted)] truncate min-w-0">
          — {outline.title}
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${activeOutlineId}-${outline.frameworkId}-${activeViewMode}`}
          className="flex-1 flex flex-col overflow-hidden"
          initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, y:-4 }}
          transition={{ duration:0.18, ease:EASE }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </main>
  )
}
