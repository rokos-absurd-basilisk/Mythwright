import { StateCreator } from 'zustand'
import { SyncQueueItem, UUID } from '../../types'

export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline' | 'conflict' | 'disabled'

export interface SyncSlice {
  syncStatus: SyncStatus
  syncQueue: SyncQueueItem[]
  lastSyncAt: string | null
  conflictRecord: { local: unknown; remote: unknown; table: string; id: UUID } | null

  setSyncStatus: (status: SyncStatus) => void
  addToSyncQueue: (item: Omit<SyncQueueItem, 'id' | 'queuedAt' | 'attempts'>) => void
  removeFromSyncQueue: (id: UUID) => void
  clearSyncQueue: () => void
  setLastSynced: () => void
  setConflict: (conflict: SyncSlice['conflictRecord']) => void
  resolveConflict: () => void
}

export const createSyncSlice: StateCreator<SyncSlice> = (set) => ({
  syncStatus: 'disabled',
  syncQueue: [],
  lastSyncAt: null,
  conflictRecord: null,

  setSyncStatus: (status) => set({ syncStatus: status }),

  addToSyncQueue: (item) => set(s => ({
    syncQueue: [...s.syncQueue, {
      ...item,
      id: crypto.randomUUID(),
      queuedAt: new Date().toISOString(),
      attempts: 0,
    }]
  })),

  removeFromSyncQueue: (id) => set(s => ({
    syncQueue: s.syncQueue.filter(i => i.id !== id)
  })),

  clearSyncQueue: () => set({ syncQueue: [] }),

  setLastSynced: () => set({
    lastSyncAt: new Date().toISOString(),
    syncStatus: 'synced',
  }),

  setConflict: (conflict) => set({ conflictRecord: conflict, syncStatus: 'conflict' }),

  resolveConflict: () => set({ conflictRecord: null, syncStatus: 'synced' }),
})
