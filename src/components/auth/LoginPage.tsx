import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Loader, Feather } from 'lucide-react'
import { clsx } from 'clsx'
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth'
import { isSupabaseAvailable } from '../../lib/supabaseClient'

type Mode = 'login' | 'signup' | 'magic'

export function LoginPage({ onSkip }: { onSkip: () => void }) {
  const [mode, setMode]       = useState<Mode>('login')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok'|'err'; text: string } | null>(null)

  const { signInWithEmail, signInWithMagicLink, signUp } = useSupabaseAuth()
  const hasSupabase = isSupabaseAvailable()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (mode === 'magic') {
        const { error } = await signInWithMagicLink(email)
        if (error) setMessage({ type:'err', text: error.message })
        else setMessage({ type:'ok', text:'Check your email for a magic link!' })
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password)
        if (error) setMessage({ type:'err', text: error.message })
        else setMessage({ type:'ok', text:'Account created! Check your email to confirm.' })
      } else {
        const { error } = await signInWithEmail(email, password)
        if (error) setMessage({ type:'err', text: error.message })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-secondary)' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0,0,0.2,1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center"
            style={{ background: 'var(--accent-orange)' }}>
            <Feather size={24} className="text-white" />
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-widest text-[var(--text-primary)]">
            Mythwright
          </h1>
          <p className="text-sm text-[var(--text-muted)]">Forge your narrative.</p>
        </div>

        {/* Card */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] p-6"
          style={{ background: 'var(--bg-primary)' }}>
          {/* Mode tabs */}
          <div className="flex rounded-[var(--radius-md)] overflow-hidden border border-[var(--border)] mb-5">
            {(['login','signup','magic'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setMessage(null) }}
                className={clsx(
                  'flex-1 h-8 text-[11px] font-medium uppercase tracking-wide transition-all duration-[var(--dur-fast)]',
                  mode === m
                    ? 'text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
                style={mode === m ? { background:'var(--accent-orange)' } : {}}>
                {m === 'magic' ? 'Magic Link' : m === 'signup' ? 'Sign Up' : 'Log In'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            {/* Email */}
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full h-10 pl-9 pr-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] outline-none transition-colors"
                style={{ background:'var(--bg-input)' }} />
            </div>

            {/* Password (not for magic link) */}
            {mode !== 'magic' && (
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input type="password" required value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-10 pl-9 pr-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)] outline-none transition-colors"
                  style={{ background:'var(--bg-input)' }} />
              </div>
            )}

            {/* Message */}
            {message && (
              <motion.p initial={{opacity:0}} animate={{opacity:1}}
                className={clsx('text-[12px] px-3 py-2 rounded-[var(--radius-md)]',
                  message.type === 'ok'
                    ? 'text-[var(--status-final)] bg-[var(--accent-teal-10)]'
                    : 'text-[var(--status-blocked)] bg-[rgba(196,80,80,0.1)]'
                )}>
                {message.text}
              </motion.p>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading || !hasSupabase}
              className="h-10 rounded-[var(--radius-md)] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-[var(--dur-fast)] disabled:opacity-50"
              style={{ background:'var(--accent-orange)' }}>
              {loading && <Loader size={14} className="animate-spin" />}
              {mode === 'magic' ? 'Send Magic Link' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {!hasSupabase && (
            <p className="text-[11px] text-[var(--text-muted)] text-center mt-3">
              Supabase not configured — working in local mode only.
            </p>
          )}
        </div>

        {/* Skip */}
        <button onClick={onSkip}
          className="w-full mt-4 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
          Skip — use locally without an account →
        </button>
      </motion.div>
    </div>
  )
}
