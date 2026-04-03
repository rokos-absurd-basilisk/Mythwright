// ============================================================
// MYTHWRIGHT — TUTORIAL SYNC HOOK
// Syncs tutorial progress to Supabase tutorial_progress table.
// One row per (user_id, step_id) — upsert on completion.
// Runs independently from the main syncQueue (tutorial progress
// is small, immediate, and doesn't need the 500ms debounce).
// ============================================================
import { useEffect, useRef } from 'react'
import { supabase, isSupabaseAvailable } from '../lib/supabaseClient'
import { useBoundStore } from '../store'
import { useSupabaseAuth } from './useSupabaseAuth'

export function useTutorialSync() {
  const tutorialProgress = useBoundStore(s => s.tutorialProgress)
  const { user }         = useSupabaseAuth()
  const syncedRef        = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!isSupabaseAvailable() || !supabase || !user) return

    // Find steps not yet synced this session
    const unsyncedSteps = tutorialProgress.filter(p => !syncedRef.current.has(p.stepId))
    if (unsyncedSteps.length === 0) return

    const rows = unsyncedSteps.map(p => ({
      user_id:      user.id,
      step_id:      p.stepId,
      completed_at: p.completedAt,
      skipped:      p.skipped,
    }))

    supabase
      .from('tutorial_progress')
      .upsert(rows, { onConflict: 'user_id,step_id' })
      .then(({ error }) => {
        if (!error) {
          unsyncedSteps.forEach(p => syncedRef.current.add(p.stepId))
        } else {
          console.warn('Tutorial sync error:', error.message)
        }
      })
  }, [tutorialProgress, user])
}
