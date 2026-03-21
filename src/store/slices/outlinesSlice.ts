import { StateCreator } from 'zustand'
import { Outline, Beat, FrameworkId, UUID } from '../../types'
import { nanoid } from '../utils'

export interface OutlinesSlice {
  outlines: Outline[]
  beats: Beat[]
  addOutline: (storyId: UUID, title: string, frameworkId: FrameworkId) => Outline
  updateOutline: (id: UUID, updates: Partial<Outline>) => void
  deleteOutline: (id: UUID) => void
  addBeat: (outlineId: UUID, title: string, opts?: Partial<Beat>) => Beat
  updateBeat: (id: UUID, updates: Partial<Beat>) => void
  deleteBeat: (id: UUID) => void
  reorderBeats: (outlineId: UUID, ids: UUID[]) => void
  copyBeat: (beatId: UUID, toOutlineId: UUID) => Beat
  reorderOutlines: (storyId: UUID, ids: UUID[]) => void
}

export const createOutlinesSlice: StateCreator<OutlinesSlice> = (set, get) => ({
  outlines: [],
  beats: [],

  addOutline: (storyId, title, frameworkId) => {
    const outline: Outline = {
      id: nanoid(),
      storyId,
      title,
      frameworkId,
      labelColour: '#5ec8c8',
      status: 'draft',
      position: get().outlines.filter(o => o.storyId === storyId).length,
      keywords: [],
      customMetadata: [],
      vonnegutMode: 'freehand',
      vonnegutCurvePoints: null,
      vonnegutFormulaSegments: null,
      bookerArchetype: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set(s => ({ outlines: [...s.outlines, outline] }))
    return outline
  },

  updateOutline: (id, updates) => {
    set(s => ({
      outlines: s.outlines.map(o =>
        o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
      )
    }))
  },

  deleteOutline: (id) => {
    set(s => ({
      outlines: s.outlines.filter(o => o.id !== id),
      beats: s.beats.filter(b => b.outlineId !== id),
    }))
  },

  addBeat: (outlineId, title, opts = {}) => {
    const beat: Beat = {
      id: nanoid(),
      outlineId,
      title,
      synopsis: '',
      bodyJson: { type: 'doc', content: [] },
      labelColour: '#5ec8c8',
      status: 'draft',
      position: get().beats.filter(b => b.outlineId === outlineId).length,
      isMicroBeat: false,
      xPosition: null,
      yPosition: null,
      toolType: null,
      isLockedAnchor: false,
      keywords: [],
      customMetadata: [],
      snapshots: [],
      bookmarks: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...opts,
    }
    set(s => ({ beats: [...s.beats, beat] }))
    return beat
  },

  updateBeat: (id, updates) => {
    set(s => ({
      beats: s.beats.map(b =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
      )
    }))
  },

  deleteBeat: (id) => set(s => ({ beats: s.beats.filter(b => b.id !== id) })),

  reorderBeats: (outlineId, ids) => {
    set(s => ({
      beats: s.beats.map(b => {
        if (b.outlineId !== outlineId) return b
        const idx = ids.indexOf(b.id)
        return idx >= 0 ? { ...b, position: idx } : b
      })
    }))
  },

  copyBeat: (beatId, toOutlineId) => {
    const src = get().beats.find(b => b.id === beatId)!
    const copy: Beat = {
      ...src,
      id: nanoid(),
      outlineId: toOutlineId,
      position: get().beats.filter(b => b.outlineId === toOutlineId).length,
      snapshots: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set(s => ({ beats: [...s.beats, copy] }))
    return copy
  },

  reorderOutlines: (storyId, ids) => {
    set(s => ({
      outlines: s.outlines.map(o => {
        if (o.storyId !== storyId) return o
        const idx = ids.indexOf(o.id)
        return idx >= 0 ? { ...o, position: idx } : o
      })
    }))
  },
})

// Exposed for Binder drag-sort
export function reorderOutlines(outlineIds: string[], allOutlines: import('../../types').Outline[]) {
  return outlineIds.map((id, i) => {
    const o = allOutlines.find(x => x.id === id)!
    return { ...o, position: i }
  })
}
