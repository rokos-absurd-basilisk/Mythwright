import { useState } from 'react'
import React from 'react'
import {
  PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose,
  SplitSquareVertical, Maximize2, Minimize2, Settings,
  Cloud, CloudOff, RefreshCw, GitBranch, LayoutGrid, Network, Table, Download, Search,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useBoundStore, useUI } from '../../store'
import { type ViewMode } from '../../types'
import { Tooltip }     from '../shared/Tooltip'
import { ExportModal } from '../export/ExportModal'

const VIEW_TABS: { id: ViewMode; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id:'framework',  label:'Framework',  Icon:GitBranch  },
  { id:'corkboard',  label:'Corkboard',  Icon:LayoutGrid },
  { id:'mindmap',    label:'Mindmap',    Icon:Network    },
  { id:'outliner',   label:'Outliner',   Icon:Table      },
]

function SyncIndicator() {
  const status     = useBoundStore(s => s.syncStatus)
  const lastSyncAt = useBoundStore(s => s.lastSyncAt)
  const tip =
    status === 'synced' && lastSyncAt ? `Synced ${new Date(lastSyncAt).toLocaleTimeString()}` :
    status === 'disabled' ? 'Sync disabled — no Supabase configured' :
    status === 'offline'  ? 'Offline — working locally' :
    status === 'conflict' ? 'Conflict detected' : 'Syncing…'
  return (
    <Tooltip content={tip} placement="bottom">
      <button className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--accent-teal-10)] transition-colors duration-[var(--dur-fast)]">
        {status === 'syncing'  && <RefreshCw size={16} className="animate-spin text-[var(--accent-teal)]"/>}
        {status === 'offline'  && <CloudOff  size={16} className="text-[var(--text-muted)]"/>}
        {status === 'conflict' && <Cloud     size={16} className="text-[var(--spotlight-gold)]"/>}
        {status === 'pending'  && <Cloud     size={16} className="text-[var(--accent-orange)]"/>}
        {(status === 'synced' || status === 'disabled') && (
          <Cloud size={16} className={status === 'disabled' ? 'text-[var(--text-muted)] opacity-30' : 'text-[var(--text-muted)]'}/>
        )}
      </button>
    </Tooltip>
  )
}

interface ToolbarProps {
  onSearchOpen:   () => void
  onSettingsOpen: () => void
}

export function Toolbar({ onSearchOpen, onSettingsOpen }: ToolbarProps) {
  const { binderOpen, inspectorOpen, focusMode, splitMode, activeOutlineId, activeViewMode } = useUI()
  const { toggleBinder, toggleInspector, setFocusMode, setSplitMode, setViewMode } = useBoundStore()
  const [showExport, setShowExport] = useState(false)
  const activeOutline = useBoundStore(s => s.outlines.find(o => o.id === activeOutlineId))
  const activeStory   = useBoundStore(s => s.stories.find(st => st.id === s.activeStoryId))

  return (
    <>
      <header
        className="flex items-center gap-2 px-3 flex-shrink-0 z-10 border-b border-[var(--border)]"
        style={{ height:'var(--toolbar-height)', background:'var(--bg-toolbar)' }}>

        {/* Left: Binder toggle + breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0" style={{ width:'200px' }}>
          <Tooltip content={binderOpen ? 'Hide Binder' : 'Show Binder'} placement="bottom">
            <button onClick={toggleBinder}
              className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-teal-10)] transition-all duration-[var(--dur-fast)] flex-shrink-0">
              {binderOpen ? <PanelLeftClose size={18}/> : <PanelLeftOpen size={18}/>}
            </button>
          </Tooltip>
          <div className="flex items-center gap-1 text-sm min-w-0">
            {activeStory ? (
              <>
                <span className="text-[var(--text-muted)] truncate text-xs" title={activeStory.title}>{activeStory.title}</span>
                {activeOutline && (
                  <><span className="text-[var(--border)] text-xs">/</span>
                  <span className="text-[var(--text-secondary)] font-medium truncate text-xs">{activeOutline.title}</span></>
                )}
              </>
            ) : (
              <span className="font-[family-name:var(--font-heading)] font-semibold tracking-widest uppercase text-[var(--accent-orange)] text-sm">
                Mythwright
              </span>
            )}
          </div>
        </div>

        {/* Centre: View tabs */}
        <nav className="flex-1 flex items-center justify-center gap-0.5">
          {activeOutlineId && VIEW_TABS.map(({ id, label, Icon }) => {
            const active = activeViewMode === id
            return (
              <button key={id} onClick={() => setViewMode(id)}
                className={clsx(
                  'relative flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)]',
                  'text-xs font-medium transition-all duration-[var(--dur-fast)]',
                  active
                    ? 'text-[var(--accent-orange)] bg-[var(--accent-orange-10)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--accent-teal-10)]'
                )}>
                <Icon size={14}/><span className="hidden md:inline">{label}</span>
                {active && <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[var(--accent-orange)] rounded-full"/>}
              </button>
            )
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0" style={{ width:'200px', justifyContent:'flex-end' }}>
          {/* Quick Search */}
          <Tooltip content="Quick Search (⌘K)" placement="bottom">
            <button onClick={onSearchOpen}
              className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-teal-10)] transition-all duration-[var(--dur-fast)]">
              <Search size={18}/>
            </button>
          </Tooltip>

          {activeOutlineId && (
            <>
              <Tooltip content="Export (⌘E)" placement="bottom">
                <button onClick={() => setShowExport(true)} title="Export (⌘E)"
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--accent-orange)] hover:bg-[var(--accent-orange-10)] transition-all duration-[var(--dur-fast)]">
                  <Download size={18}/>
                </button>
              </Tooltip>
              <Tooltip content={splitMode ? 'Exit Split' : 'Split Mode'} placement="bottom">
                <button onClick={() => setSplitMode(!splitMode)}
                  className={clsx('p-2 rounded-[var(--radius-md)] transition-all duration-[var(--dur-fast)]',
                    splitMode ? 'text-[var(--accent-orange)] bg-[var(--accent-orange-10)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-teal-10)]')}>
                  <SplitSquareVertical size={18}/>
                </button>
              </Tooltip>
              <Tooltip content={focusMode ? 'Exit Focus (F11)' : 'Focus Mode (F11)'} placement="bottom">
                <button onClick={() => setFocusMode(!focusMode)}
                  className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-teal-10)] transition-all duration-[var(--dur-fast)]">
                  {focusMode ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
                </button>
              </Tooltip>
            </>
          )}

          <SyncIndicator />

          <Tooltip content="Settings" placement="bottom">
            <button onClick={onSettingsOpen}
              className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-teal-10)] transition-all duration-[var(--dur-fast)]">
              <Settings size={18}/>
            </button>
          </Tooltip>

          <Tooltip content={inspectorOpen ? 'Hide Inspector' : 'Show Inspector'} placement="bottom">
            <button onClick={toggleInspector}
              className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-teal-10)] transition-all duration-[var(--dur-fast)]">
              {inspectorOpen ? <PanelRightClose size={18}/> : <PanelRightOpen size={18}/>}
            </button>
          </Tooltip>
        </div>
      </header>

      <ExportModal open={showExport} onClose={() => setShowExport(false)} />
    </>
  )
}
