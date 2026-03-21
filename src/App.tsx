import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell }          from './components/layout/AppShell'
import { LoginPage }         from './components/auth/LoginPage'
import { ToastProvider }     from './components/shared/Toast'
import { useSupabaseAuth }   from './hooks/useSupabaseAuth'
import { useSync }           from './hooks/useSync'
import { isSupabaseAvailable } from './lib/supabaseClient'

const EASE = [0, 0, 0.2, 1] as const

function SyncRunner() { useSync(); return null }

function AppRoutes() {
  const { user, loading } = useSupabaseAuth()
  const [skipped, setSkipped] = useState(() =>
    localStorage.getItem('mythwright-skip-auth') === 'true'
  )

  const handleSkip = () => {
    localStorage.setItem('mythwright-skip-auth', 'true')
    setSkipped(true)
  }

  if (!isSupabaseAvailable()) {
    return <Routes><Route path="/*" element={<AppShell />} /></Routes>
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background:'var(--bg-secondary)' }}>
        <motion.div
          animate={{ opacity:[0.3,1,0.3] }}
          transition={{ repeat:Infinity, duration:1.6, ease:'easeInOut' }}
          className="font-[family-name:var(--font-heading)] text-sm tracking-widest uppercase text-[var(--accent-orange)]">
          Mythwright
        </motion.div>
      </div>
    )
  }

  if (!user && !skipped) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="login"
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:0.18, ease:EASE }}>
          <LoginPage onSkip={handleSkip} />
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key="app" className="h-screen"
        initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.2, ease:EASE }}>
        <Routes>
          <Route path="/"     element={<Navigate to="/app" replace />} />
          <Route path="/app/*" element={<AppShell />} />
          <Route path="*"     element={<Navigate to="/app" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <SyncRunner />
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  )
}
