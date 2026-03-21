// ============================================================
// MYTHWRIGHT — EXPORT MODAL
// All formats grouped: Native (4 in-browser) + Pandoc (18+)
// Pandoc formats show a "requires local bridge" badge if no
// server-side Pandoc is configured.
// ============================================================
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, AlertCircle, Loader } from 'lucide-react'
import { clsx } from 'clsx'
import { useBoundStore, useBeats, useUI } from '../../store'
import { exportOutline, EXPORT_FORMATS, type ExportFormat, type ExportFormatMeta } from '../../lib/exportUtils'
import { useToast }  from '../shared/Toast'
import { useFocusTrap } from '../../hooks/useFocusTrap'

const EASE = [0, 0, 0.2, 1] as const

const GROUP_LABELS: Record<string, string> = {
  native:   '✦ In-Browser',
  document: '📄 Documents',
  slides:   '📊 Slides',
  markup:   '🔤 Markup',
  web:      '🌐 Wiki / Web',
}

function FormatTile({
  meta, onExport, isLoading,
}: { meta: ExportFormatMeta; onExport: (id: ExportFormat) => void; isLoading: boolean }) {
  return (
    <button
      onClick={() => onExport(meta.id)}
      disabled={isLoading}
      className={clsx(
        'relative flex flex-col items-start gap-1 p-3 rounded-[var(--radius-lg)] border text-left',
        'transition-all duration-[var(--dur-fast)] group',
        meta.native
          ? 'border-[var(--accent-teal)] hover:bg-[var(--accent-teal-10)]'
          : 'border-[var(--border)] hover:border-[var(--border-active)] hover:bg-[var(--bg-card-hover)]',
        isLoading && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-2 w-full">
        <span className="text-base leading-none">{meta.icon}</span>
        <span className={clsx(
          'text-[12px] font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wide',
          meta.native ? 'text-[var(--accent-teal)]' : 'text-[var(--text-primary)]'
        )}>
          {meta.label}
        </span>
        <span className="ml-auto text-[10px] text-[var(--text-muted)] uppercase tracking-wide font-mono">
          .{meta.ext}
        </span>
      </div>
      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pl-6">
        {meta.description}
      </p>
      {!meta.native && (
        <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]">
          Pandoc
        </span>
      )}
    </button>
  )
}

interface ExportModalProps {
  open: boolean
  onClose: () => void
}

export function ExportModal({ open, onClose }: ExportModalProps) {
  const { activeOutlineId } = useUI()
  const outline  = useBoundStore(s => s.outlines.find(o => o.id === activeOutlineId))
  const beats    = useBeats(activeOutlineId ?? '')
  const { success, error: toastError } = useToast()
  const [loading, setLoading]  = useState<ExportFormat | null>(null)
  const [pandocInfo, setPandocInfo] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, open)

  if (!outline) return null

  const handleExport = async (fmt: ExportFormat) => {
    setLoading(fmt)
    const result = await exportOutline(outline, beats, fmt)
    setLoading(null)
    if (result.ok) {
      const meta = EXPORT_FORMATS.find(f => f.id === fmt)!
      success(`Exported as ${meta.label}`)
      if (fmt !== 'png') onClose()
    } else {
      if (result.message?.includes('Pandoc bridge not running')) {
        setPandocInfo(true)
      } else {
        toastError(result.message ?? 'Export failed')
      }
    }
  }

  // Group formats
  const groups = Object.keys(GROUP_LABELS).map(g => ({
    group: g,
    label: GROUP_LABELS[g],
    formats: EXPORT_FORMATS.filter(f => f.group === g),
  })).filter(g => g.formats.length > 0)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[998]"
            style={{ background: 'var(--dim-overlay)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog" aria-modal="true" aria-label="Export outline"
            className="fixed z-[999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-[var(--radius-xl)] border border-[var(--border)] overflow-hidden"
            style={{ width:'min(680px, 95vw)', maxHeight:'80vh', background:'var(--bg-secondary)', boxShadow:'var(--shadow-modal)' }}
            initial={{ opacity:0, scale:0.97, y:-12 }}
            animate={{ opacity:1, scale:1,    y:0    }}
            exit={{   opacity:0, scale:0.97, y:-8    }}
            transition={{ duration:0.18, ease:EASE }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-[16px] font-bold uppercase tracking-widest text-[var(--text-primary)]">
                  Export Outline
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {outline.title} · {beats.length} beat{beats.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={onClose} aria-label="Close export dialog"
                className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-teal-10)] transition-colors">
                <X size={16}/>
              </button>
            </div>

            {/* Format grid — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
              {groups.map(({ group, label, formats }) => (
                <div key={group}>
                  <p className="text-[10px] uppercase tracking-[0.12em] font-[family-name:var(--font-heading)] font-semibold text-[var(--text-muted)] mb-2">
                    {label}
                  </p>
                  <div className={clsx(
                    'grid gap-2',
                    group === 'native' ? 'grid-cols-4' : 'grid-cols-3'
                  )}>
                    {formats.map(meta => (
                      <FormatTile
                        key={meta.id}
                        meta={meta}
                        onExport={handleExport}
                        isLoading={loading !== null}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Pandoc bridge info */}
              <AnimatePresence>
                {pandocInfo && (
                  <motion.div
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                    exit={{ opacity:0, y:4 }}
                    className="p-4 rounded-[var(--radius-lg)] border border-[var(--spotlight-gold)] text-[12px]"
                    style={{ background:'rgba(240,180,41,0.08)' }}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle size={16} style={{ color:'var(--spotlight-gold)' }} className="flex-shrink-0 mt-0.5"/>
                      <div>
                        <p className="font-semibold text-[var(--spotlight-gold)] mb-1">Pandoc bridge not running</p>
                        <p className="text-[var(--text-secondary)] leading-relaxed mb-2">
                          Your Markdown has been copied to clipboard. To convert with Pandoc:
                        </p>
                        <code className="block px-3 py-2 rounded text-[11px] font-mono text-[var(--text-primary)]"
                          style={{ background:'var(--bg-input)' }}>
                          npm run pandoc-bridge
                        </code>
                        <p className="text-[var(--text-muted)] mt-2 text-[11px]">
                          Or install the{' '}
                          <a href="https://pandoc.org/installing.html" target="_blank" rel="noopener"
                            className="text-[var(--accent-teal)] underline inline-flex items-center gap-1">
                            Pandoc CLI <ExternalLink size={10}/>
                          </a>{' '}
                          and run the command directly.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {loading && (
              <div className="flex items-center gap-2 px-5 py-3 border-t border-[var(--border)] flex-shrink-0 text-[12px] text-[var(--text-muted)]">
                <Loader size={14} className="animate-spin text-[var(--accent-teal)]"/>
                Exporting as {EXPORT_FORMATS.find(f => f.id === loading)?.label}…
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
