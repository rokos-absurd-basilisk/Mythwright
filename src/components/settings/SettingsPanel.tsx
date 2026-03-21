// ============================================================
// MYTHWRIGHT — SETTINGS PANEL
// Slide-in panel from the right. Auth, sync, export defaults,
// tutorial reset, danger zone.
// ============================================================
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RefreshCw, LogOut, Trash2, HelpCircle, Moon, Sun, Feather } from 'lucide-react'
import { clsx } from 'clsx'
import { useBoundStore } from '../../store'
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth'
import { isSupabaseAvailable } from '../../lib/supabaseClient'
import { resetOnboarding } from '../tutorial/OnboardingTutorial'

const EASE = [0, 0, 0.2, 1] as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[10px] uppercase tracking-[0.12em] font-[family-name:var(--font-heading)] font-semibold text-[var(--text-muted)] px-5">
        {title}
      </h3>
      <div className="px-5 flex flex-col gap-2">
        {children}
      </div>
    </div>
  )
}

function SettingRow({
  label, desc, children, danger = false,
}: { label: string; desc?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-[var(--border-subtle)] last:border-0">
      <div className="min-w-0">
        <p className={clsx('text-[13px] font-medium', danger ? 'text-[var(--status-blocked)]' : 'text-[var(--text-primary)]')}>
          {label}
        </p>
        {desc && <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-0.5">{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

interface SettingsPanelProps { open: boolean; onClose: () => void }

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { user, signOut } = useSupabaseAuth()
  const syncStatus  = useBoundStore(s => s.syncStatus)
  const lastSyncAt  = useBoundStore(s => s.lastSyncAt)
  const [clearing, setClearing] = useState(false)
  const [replayDone, setReplayDone] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  const handleClearData = async () => {
    if (!confirm('This will permanently delete ALL stories, outlines, and beats from this device. This cannot be undone.\n\nContinue?')) return
    setClearing(true)
    localStorage.removeItem('mythwright')
    setTimeout(() => { window.location.reload() }, 400)
  }

  const handleReplayTutorial = () => {
    resetOnboarding()
    setReplayDone(true)
    setTimeout(() => { onClose(); window.location.reload() }, 800)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div className="fixed inset-0 z-[700]" style={{background:'rgba(0,0,0,0.4)'}}
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            transition={{duration:0.2}} onClick={onClose} />

          {/* Panel */}
          <motion.aside
            className="fixed right-0 top-0 bottom-0 z-[710] flex flex-col border-l border-[var(--border)] overflow-hidden"
            style={{ width:'360px', background:'var(--bg-secondary)', boxShadow:'-4px 0 24px rgba(0,0,0,0.3)' }}
            initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
            transition={{ duration:0.24, ease:EASE }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-[var(--border)] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Feather size={18} className="text-[var(--accent-orange)]" />
                <h2 className="font-[family-name:var(--font-heading)] text-[15px] font-bold uppercase tracking-widest text-[var(--text-primary)]">
                  Settings
                </h2>
              </div>
              <button onClick={onClose}
                className="p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-teal-10)] transition-all">
                <X size={16}/>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-6">

              {/* Account */}
              <Section title="Account">
                {isSupabaseAvailable() ? (
                  <>
                    <SettingRow label="Signed in as" desc={user?.email ?? 'Local mode (not synced)'}>
                      {user && (
                        <button onClick={handleSignOut}
                          className="flex items-center gap-1.5 px-3 h-7 rounded-[var(--radius-md)] text-[11px] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--status-blocked)] hover:text-[var(--status-blocked)] transition-colors">
                          <LogOut size={11}/>Sign Out
                        </button>
                      )}
                    </SettingRow>
                    <SettingRow
                      label="Sync status"
                      desc={
                        syncStatus === 'synced' && lastSyncAt
                          ? `Last synced ${new Date(lastSyncAt).toLocaleTimeString()}`
                          : syncStatus === 'disabled' ? 'Supabase not configured'
                          : syncStatus === 'offline'  ? 'Offline — changes queued'
                          : 'Syncing…'
                      }
                    >
                      <span className={clsx('inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full',
                        syncStatus === 'synced'   ? 'bg-[var(--accent-teal-10)] text-[var(--accent-teal)]' :
                        syncStatus === 'offline'  ? 'bg-[rgba(255,255,255,0.08)] text-[var(--text-muted)]' :
                        syncStatus === 'syncing'  ? 'bg-[var(--accent-orange-10)] text-[var(--accent-orange)]' :
                        'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)]'
                      )}>
                        {syncStatus === 'syncing' && <RefreshCw size={10} className="animate-spin"/>}
                        {syncStatus}
                      </span>
                    </SettingRow>
                  </>
                ) : (
                  <SettingRow label="Local mode" desc="Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable cloud sync.">
                    <span className="text-[11px] text-[var(--text-muted)]">Offline only</span>
                  </SettingRow>
                )}
              </Section>

              {/* Appearance */}
              <Section title="Appearance">
                <SettingRow label="Theme" desc="Dark mode is the only supported theme.">
                  <div className="flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--border)] overflow-hidden">
                    <button className="px-3 h-7 text-[11px] font-medium text-white flex items-center gap-1.5" style={{background:'var(--accent-orange)'}}>
                      <Moon size={11}/>Dark
                    </button>
                    <button disabled className="px-3 h-7 text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1.5 opacity-40 cursor-not-allowed">
                      <Sun size={11}/>Light
                    </button>
                  </div>
                </SettingRow>
              </Section>

              {/* Export */}
              <Section title="Export">
                <SettingRow label="Export format" desc="The default format when exporting outlines.">
                  <select className="h-7 px-2 rounded-[var(--radius-md)] border border-[var(--border)] text-[12px] text-[var(--text-primary)] outline-none focus:border-[var(--border-active)]"
                    style={{background:'var(--bg-input)'}}>
                    <option>JSON</option>
                    <option>Markdown</option>
                    <option>HTML</option>
                  </select>
                </SettingRow>
              </Section>

              {/* Tutorial */}
              <Section title="Tutorial">
                <SettingRow
                  label="Replay onboarding"
                  desc="Walk through the introduction tour again."
                >
                  <button onClick={handleReplayTutorial}
                    className="flex items-center gap-1.5 px-3 h-7 rounded-[var(--radius-md)] text-[11px] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)] transition-colors">
                    {replayDone ? <><RefreshCw size={11}/>Reloading…</> : <><HelpCircle size={11}/>Replay Tour</>}
                  </button>
                </SettingRow>
              </Section>

              {/* Danger zone */}
              <Section title="Danger Zone">
                <SettingRow
                  label="Clear all local data"
                  desc="Permanently delete all stories, outlines, and beats stored on this device."
                  danger
                >
                  <button onClick={handleClearData} disabled={clearing}
                    className="flex items-center gap-1.5 px-3 h-7 rounded-[var(--radius-md)] text-[11px] border border-[var(--status-blocked)] text-[var(--status-blocked)] hover:bg-[rgba(196,80,80,0.1)] transition-colors disabled:opacity-50">
                    {clearing ? <RefreshCw size={11} className="animate-spin"/> : <Trash2 size={11}/>}
                    {clearing ? 'Clearing…' : 'Clear Data'}
                  </button>
                </SettingRow>
              </Section>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)] flex-shrink-0">
              <span className="text-[10px] text-[var(--text-muted)] font-[family-name:var(--font-mono)]">
                Mythwright v0.5.0
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                Built with ♥ for storytellers
              </span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
