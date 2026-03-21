// ============================================================
// MYTHWRIGHT — SUPABASE AUTH HOOK
// ============================================================
import { useEffect, useState } from 'react'
import { type User } from '@supabase/supabase-js'
import { supabase, isSupabaseAvailable } from '../lib/supabaseClient'

export function useSupabaseAuth() {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseAvailable() || !supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signInWithMagicLink = async (email: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    return supabase.auth.signInWithOtp({ email })
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    return supabase.auth.signUp({ email, password })
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return { user, loading, signInWithEmail, signInWithMagicLink, signUp, signOut }
}
