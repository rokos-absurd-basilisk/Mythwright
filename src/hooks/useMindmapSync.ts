// ============================================================
// MYTHWRIGHT — MINDMAP SYNC HOOK
// Debounces mindmap edges + viewport into the outlines table.
// Fires when mindmapEdges[outlineId] or viewport changes.
// ============================================================
import { useEffect, useRef } from 'react'
import { supabase, isSupabaseAvailable } from '../lib/supabaseClient'
import { useBoundStore, useUI } from '../store'
import { useSupabaseAuth } from './useSupabaseAuth'

const DEBOUNCE_MS = 1500

export function useMindmapSync() {
  const { activeOutlineId } = useUI()
  const mindmapEdges        = useBoundStore(s => s.mindmapEdges)
  const mindmapViewport     = useBoundStore(s => s.mindmapViewport)
  const { user }            = useSupabaseAuth()
  const timerRef            = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isSupabaseAvailable() || !supabase || !user || !activeOutlineId) return

    // Debounce — mindmap drags fire rapidly
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const edges    = mindmapEdges[activeOutlineId]    ?? []
      const viewport = mindmapViewport[activeOutlineId] ?? { x: 0, y: 0, zoom: 1 }

      const { error } = await supabase!
        .from('outlines')
        .update({
          mindmap_edges_json: edges,
          mindmap_viewport:   viewport,
          updated_at:         new Date().toISOString(),
        })
        .eq('id', activeOutlineId)
        .eq('user_id', user.id)

      if (error) console.warn('Mindmap sync error:', error.message)
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mindmapEdges, mindmapViewport, activeOutlineId, user])
}
