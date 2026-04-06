// ============================================================
// MYTHWRIGHT — COLLECTIONS SYNC HOOK
// Syncs Binder collections to Supabase collections table.
// Debounced 2s — collections change rarely.
// ============================================================
import { useEffect, useRef } from 'react'
import { supabase, isSupabaseAvailable } from '../lib/supabaseClient'
import { useBoundStore } from '../store'
import { useSupabaseAuth } from './useSupabaseAuth'

const DEBOUNCE_MS = 2000

export function useCollectionsSync() {
  const collections = useBoundStore(s => s.collections)
  const { user }    = useSupabaseAuth()
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isSupabaseAvailable() || !supabase || !user) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const rows = collections.map(col => ({
        id:         col.id,
        user_id:    user.id,
        name:       col.name,
        icon:       col.icon,
        filter:     col.filter,
        position:   col.position,
        updated_at: new Date().toISOString(),
      }))

      const { error } = await supabase!
        .from('collections')
        .upsert(rows, { onConflict: 'id' })

      if (error) console.warn('Collections sync error:', error.message)
    }, DEBOUNCE_MS)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [collections, user])
}
