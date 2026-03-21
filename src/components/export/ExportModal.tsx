import { useState } from 'react'
import { Download, FileJson, FileText, FileCode, Image } from 'lucide-react'
import { clsx } from 'clsx'
import { Modal } from '../shared/Modal'
import { Button } from '../shared/Button'
import { useBoundStore, useBeats, useUI } from '../../store'
import { exportJSON, exportMarkdown, exportHTML, exportPNG } from '../../lib/exportUtils'

interface Format { id: string; label: string; desc: string; icon: typeof Download; ext: string }
const FORMATS: Format[] = [
  { id:'json', label:'JSON',     desc:'Full data — re-importable backup',        icon:FileJson, ext:'.json' },
  { id:'md',   label:'Markdown', desc:'Obsidian-compatible, one H2 per beat',    icon:FileText, ext:'.md'   },
  { id:'html', label:'HTML',     desc:'Self-contained styled page with your theme', icon:FileCode, ext:'.html' },
  { id:'png',  label:'PNG',      desc:'Screenshot of the current canvas',         icon:Image,    ext:'.png'  },
]

interface ExportModalProps { open: boolean; onClose: () => void }

export function ExportModal({ open, onClose }: ExportModalProps) {
  const [selected, setSelected] = useState<string>('md')
  const [loading, setLoading] = useState(false)
  const { activeOutlineId, activeStoryId } = useUI()
  const outline = useBoundStore(s => s.outlines.find(o => o.id === activeOutlineId))
  const story   = useBoundStore(s => s.stories.find(st => st.id === activeStoryId))
  const beats   = useBeats(activeOutlineId ?? '')

  const handleExport = async () => {
    if (!outline || !story) return
    setLoading(true)
    try {
      switch (selected) {
        case 'json': exportJSON(story, outline, beats); break
        case 'md':   exportMarkdown(story, outline, beats); break
        case 'html': exportHTML(story, outline, beats); break
        case 'png':  await exportPNG('framework-canvas', `${outline.title}.png`); break
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Export Outline" size="md">
      <div className="flex flex-col gap-4">
        {!outline && (
          <p className="text-[13px] text-[var(--text-muted)]">No outline selected.</p>
        )}
        {outline && (
          <>
            <p className="text-[13px] text-[var(--text-secondary)]">
              Exporting <span className="text-[var(--accent-orange)] font-medium">{outline.title}</span> — {beats.length} beats
            </p>

            <div className="grid grid-cols-2 gap-3">
              {FORMATS.map(fmt => {
                const Icon = fmt.icon
                const active = selected === fmt.id
                return (
                  <button key={fmt.id} onClick={() => setSelected(fmt.id)}
                    className={clsx(
                      'flex flex-col gap-2 p-4 rounded-[var(--radius-lg)] border text-left transition-all duration-[var(--dur-fast)]',
                      active
                        ? 'border-[var(--accent-orange)] bg-[var(--accent-orange-10)]'
                        : 'border-[var(--border)] bg-[var(--bg-input)] hover:border-[var(--border-active)]'
                    )}>
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={active ? 'text-[var(--accent-orange)]' : 'text-[var(--text-muted)]'} />
                      <span className={clsx('font-[family-name:var(--font-heading)] font-semibold text-[13px] uppercase tracking-wide',
                        active ? 'text-[var(--accent-orange)]' : 'text-[var(--text-primary)]')}>{fmt.label}</span>
                      <span className="ml-auto text-[10px] text-[var(--text-muted)] font-[family-name:var(--font-mono)]">{fmt.ext}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{fmt.desc}</p>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={handleExport} loading={loading}>
                <Download size={13} /> Export {FORMATS.find(f=>f.id===selected)?.ext}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
