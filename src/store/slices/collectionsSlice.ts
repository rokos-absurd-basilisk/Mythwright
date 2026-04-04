import { StateCreator } from 'zustand'
import { nanoid } from 'nanoid'
import { type UUID, type StatusType, type FrameworkId } from '../../types'

export interface CollectionFilter {
  statuses?:     StatusType[]
  frameworkIds?: FrameworkId[]
  keywords?:     string[]
}

export interface Collection {
  id:        UUID
  name:      string
  icon:      string
  filter:    CollectionFilter
  position:  number
  createdAt: string
}

export interface CollectionsState {
  collections:       Collection[]
  activeCollectionId: UUID | null
}

export interface CollectionsSlice extends CollectionsState {
  addCollection:      (name: string, filter: CollectionFilter) => Collection
  updateCollection:   (id: UUID, updates: Partial<Omit<Collection,'id'>>) => void
  deleteCollection:   (id: UUID) => void
  setActiveCollection:(id: UUID | null) => void
}

const DEFAULTS: Collection[] = [
  { id:'col-blocked', name:'Blocked', icon:'🚫', filter:{ statuses:['blocked'] }, position:0, createdAt:new Date().toISOString() },
  { id:'col-final',   name:'Final',   icon:'✓',  filter:{ statuses:['final']   }, position:1, createdAt:new Date().toISOString() },
  { id:'col-draft',   name:'Drafts',  icon:'✏️',  filter:{ statuses:['draft']   }, position:2, createdAt:new Date().toISOString() },
]

export const createCollectionsSlice: StateCreator<CollectionsSlice> = (set, get) => ({
  collections:        DEFAULTS,
  activeCollectionId: null,

  addCollection: (name, filter) => {
    const col: Collection = { id:nanoid(), name, icon:'📂', filter, position:get().collections.length, createdAt:new Date().toISOString() }
    set(s => ({ collections:[...s.collections, col] }))
    return col
  },
  updateCollection:    (id, u) => set(s => ({ collections:s.collections.map(c=>c.id===id?{...c,...u}:c) })),
  deleteCollection:    (id)    => set(s => ({ collections:s.collections.filter(c=>c.id!==id) })),
  setActiveCollection: (id)    => set({ activeCollectionId: id }),
})
