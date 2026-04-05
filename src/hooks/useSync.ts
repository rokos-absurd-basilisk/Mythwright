// ============================================================
// MYTHWRIGHT — SYNC HOOK
// localStorage-first write path + debounced Supabase upsert
// ============================================================
import { useEffect, useRef, useCallback } from 'react'
import { supabase, isSupabaseAvailable, type DbTable } from '../lib/supabaseClient'
import { useBoundStore } from '../store'

const DEBOUNCE_MS = 500

// Camel→snake_case for DB column names
function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    const snake = k.replace(/([A-Z])/g, '_$1').toLowerCase()
    out[snake] = v
  }
  return out
}

export function useSync() {
  const syncQueue      = useBoundStore(s => s.syncQueue)
  const removeFromQueue= useBoundStore(s => s.removeFromSyncQueue)
  const setSyncStatus  = useBoundStore(s => s.setSyncStatus)
  const setLastSynced  = useBoundStore(s => s.setLastSynced)
  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flush = useCallback(async () => {
    if (!isSupabaseAvailable() || !supabase) {
      setSyncStatus('disabled')
      return
    }
    if (!navigator.onLine) {
      setSyncStatus('offline')
      return
    }
    if (syncQueue.length === 0) {
      return
    }

    setSyncStatus('syncing')
    // Collections synced via useCollectionsSync hook

    // Group by table+operation to batch upserts
    const upserts = new Map<DbTable, Record<string, unknown>[]>()
    const deletes = new Map<DbTable, string[]>()

    for (const item of syncQueue) {
      if (item.operation === 'upsert') {
        const rows = upserts.get(item.table) ?? []
        rows.push(toSnake(item.payload as Record<string, unknown>))
        upserts.set(item.table, rows)
      } else {
        const ids = deletes.get(item.table) ?? []
        ids.push(item.recordId)
        deletes.set(item.table, ids)
      }
    }

    let hadError = false

    for (const [table, rows] of upserts.entries()) {
      const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
      if (error) { console.error(`Sync upsert ${table}:`, error); hadError = true }
    }
    for (const [table, ids] of deletes.entries()) {
      const { error } = await supabase.from(table).delete().in('id', ids)
      if (error) { console.error(`Sync delete ${table}:`, error); hadError = true }
    }

    if (!hadError) {
      // Clear queue items that succeeded
      for (const item of syncQueue) removeFromQueue(item.id)
      setLastSynced()
    }
  }, [syncQueue, removeFromQueue, setSyncStatus, setLastSynced])

  // Debounced auto-flush on queue change
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(flush, DEBOUNCE_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [syncQueue.length, flush])

  // Flush on app close
  useEffect(() => {
    const handler = () => flush()
    window.addEventListener('beforeunload', handler)
    window.addEventListener('visibilitychange', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
      window.removeEventListener('visibilitychange', handler)
    }
  }, [flush])

  // Retry when coming back online
  useEffect(() => {
    const handler = () => flush()
    window.addEventListener('online',  handler)
    window.addEventListener('offline', () => setSyncStatus('offline'))
    return () => {
      window.removeEventListener('online',  handler)
      window.removeEventListener('offline', handler)
    }
  }, [flush, setSyncStatus])

  // Initial status
  useEffect(() => {
    if (!isSupabaseAvailable()) { setSyncStatus('disabled'); return }
    if (!navigator.onLine)      { setSyncStatus('offline'); return }
    setSyncStatus(syncQueue.length > 0 ? 'pending' : 'synced')
  }, [])
}
