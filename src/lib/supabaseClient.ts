// ============================================================
// MYTHWRIGHT — SUPABASE CLIENT
// Gracefully degrades to localStorage-only if env vars absent
// ============================================================
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession:    true,
          autoRefreshToken:  true,
          detectSessionInUrl:true,
        },
      })
    : null

export const isSupabaseAvailable = () => supabase !== null

// ── Typed table helpers ──────────────────────────────────────
export type DbTable =
  | 'stories' | 'notes' | 'outlines' | 'beats'
  | 'mindmap_nodes' | 'mindmap_edges' | 'collections'
  | 'tutorial_progress'
