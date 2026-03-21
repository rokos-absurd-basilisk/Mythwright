// ============================================================
// MYTHWRIGHT — MINDMAP SLICE
// Persists React Flow node positions, edges, and viewport per
// outline. Stored in Zustand (→ localStorage → Supabase).
// ============================================================
import { StateCreator } from 'zustand'
import { type UUID } from '../../types'

export interface MindmapNodeRecord {
  id:   string
  x:    number
  y:    number
  data: Record<string, unknown>
}

export interface MindmapEdgeRecord {
  id:       string
  source:   string
  target:   string
  animated: boolean
}

export interface MindmapViewport {
  x:    number
  y:    number
  zoom: number
}

export interface MindmapState {
  /** keyed by outline ID */
  mindmapNodes:    Record<UUID, MindmapNodeRecord[]>
  mindmapEdges:    Record<UUID, MindmapEdgeRecord[]>
  mindmapViewport: Record<UUID, MindmapViewport>
}

export interface MindmapSlice extends MindmapState {
  setMindmapNodes:    (outlineId: UUID, nodes: MindmapNodeRecord[]) => void
  setMindmapEdges:    (outlineId: UUID, edges: MindmapEdgeRecord[]) => void
  setMindmapViewport: (outlineId: UUID, vp: MindmapViewport) => void
  getMindmapNodes:    (outlineId: UUID) => MindmapNodeRecord[]
  getMindmapEdges:    (outlineId: UUID) => MindmapEdgeRecord[]
  getMindmapViewport: (outlineId: UUID) => MindmapViewport
}

const DEFAULT_VP: MindmapViewport = { x: 0, y: 0, zoom: 1 }

export const createMindmapSlice: StateCreator<MindmapSlice> = (set, get) => ({
  mindmapNodes:    {},
  mindmapEdges:    {},
  mindmapViewport: {},

  setMindmapNodes: (outlineId, nodes) =>
    set(s => ({ mindmapNodes: { ...s.mindmapNodes, [outlineId]: nodes } })),

  setMindmapEdges: (outlineId, edges) =>
    set(s => ({ mindmapEdges: { ...s.mindmapEdges, [outlineId]: edges } })),

  setMindmapViewport: (outlineId, vp) =>
    set(s => ({ mindmapViewport: { ...s.mindmapViewport, [outlineId]: vp } })),

  getMindmapNodes:    (outlineId) => get().mindmapNodes[outlineId]    ?? [],
  getMindmapEdges:    (outlineId) => get().mindmapEdges[outlineId]    ?? [],
  getMindmapViewport: (outlineId) => get().mindmapViewport[outlineId] ?? DEFAULT_VP,
})
