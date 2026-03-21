import {} from 'react'
import { Download, FileJson, FileText, Globe, Image } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { useBoundStore, useBeats, useUI } from '../../store'
import { exportJSON, exportMarkdown, exportHTML, exportPNG } from '../../lib/exportUtils'
import { Modal } from '../shared/Modal'

interface ExportModalProps { open: boolean; onClose: () => void }

const EASE = [0, 0, 0.2, 1] as const

const FORMATS = [
  { id:'json',     Icon:FileJson,  label:'JSON',     desc:'Re-importable data archive', ext:'.json', colour:'var(--accent-orange)' },
  { id:'markdown', Icon:FileText,  label:'Markdown',  desc:'Obsidian-compatible export', ext:'.md',   colour:'var(--accent-teal)' },
  { id:'html',     Icon:Globe,     label:'HTML',      desc:'Self-contained styled page', ext:'.html', colour:'#7c5cb4' },
  { id:'png',      Icon:Image,     label:'PNG',       desc:'Screenshot of the canvas',   ext:'.png',  colour:'#4a9c6b' },
] as const

type FormatId = typeof FORMATS[number]['id']

export function ExportModal({ open, onClose }: ExportModalProps) {
  const { activeOutlineId, activeStoryId } = useUI()


  const outline = useBoundStore(s => s.outlines.find(o => o.id === activeOutlineId))
  const story   = useBoundStore(s => s.stories.find(s => s.id === activeStoryId))
  const beats   = useBeats(activeOutlineId ?? '')

  if (!outline || !story) return null

  const handle = (id: FormatId) => {
    switch (id) {
      case 'json':     exportJSON(story, outline, beats); break
      case 'markdown': exportMarkdown(outline, beats); break
      case 'html':     exportHTML(story, outline, beats); break
      case 'png': {
        const el = document.querySelector('main') as HTMLElement | null
        if (el) exportPNG(el, `${outline.title}.png`)
        break
      }
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Export Outline" size="md">
      <div className="flex flex-col gap-3">
        <p className="text-[13px] text-[var(--text-muted)]">
          Exporting <span className="text-[var(--text-primary)] font-medium">{outline.title}</span> — {beats.length} beats
        </p>

        <div className="grid grid-cols-2 gap-3 mt-1">
          <AnimatePresence>
            {FORMATS.map(({ id, Icon, label, desc, ext, colour }, i) => (
              <motion.button
                key={id}
                initial={{ opacity:0, y:8 }}
                animate={{ opacity:1, y:0 }}
                transition={{ duration:0.16, ease:EASE, delay: i * 0.04 }}
                onClick={() => handle(id)}
                className={clsx(
                  'flex flex-col items-start gap-2 p-4 rounded-[var(--radius-lg)] border border-[var(--border)]',
                  'transition-all duration-[var(--dur-fast)] text-left group',
                  'hover:border-[var(--border-active)] hover:bg-[var(--bg-card-hover)]'
                )}
                style={{ background:'var(--bg-card)' }}>
                <div className="flex items-center justify-between w-full">
                  <Icon size={20} style={{ color: colour }} />
                  <span className="text-[10px] font-[family-name:var(--font-mono)] text-[var(--text-muted)]">{ext}</span>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-heading)] font-semibold text-[14px] uppercase tracking-wide text-[var(--text-primary)]">{label}</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{desc}</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                  <Download size={11} /> Download
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  )
}
