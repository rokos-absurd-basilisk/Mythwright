// ============================================================
// MYTHWRIGHT — CORE TYPES
// ============================================================

export type UUID = string
export type ISO8601 = string
export type HexColour = string
export type TipTapJSON = Record<string, unknown>

export type StatusType = 'draft' | 'in_progress' | 'final' | 'blocked'
export type FrameworkId = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type ViewMode = 'framework' | 'corkboard' | 'mindmap' | 'outliner'
export type VonnegutMode = 'freehand' | 'formula'

export type BookerArchetype =
  | 'overcoming_the_monster' | 'rags_to_riches' | 'the_quest'
  | 'voyage_and_return' | 'comedy' | 'tragedy' | 'rebirth'

export type ToolboxTool =
  | 'misdirection' | 'sacrifice' | 'obstacle' | 'confrontation'
  | 'complication' | 'escalation' | 'surprise' | 'reversal'
  | 'decision' | 'revelation' | 'repetition' | 'betrayal'
  | 'inciting_incident' | 'tent_pole' | 'climax'

export type VonnegutFormula =
  | 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out'
  | 'sine_wave' | 'step' | 'exponential_rise' | 'exponential_decay'
  | 'gaussian_peak' | 'logistic'

export interface CustomMetadataField {
  key: string
  type: 'text' | 'number' | 'checkbox' | 'date' | 'dropdown'
  value: string | number | boolean
  options?: string[]
}

export interface Story {
  id: UUID
  title: string
  labelColour: HexColour
  status: StatusType
  archived: boolean
  position: number
  customMetadata: CustomMetadataField[]
  keywords: string[]
  createdAt: ISO8601
  updatedAt: ISO8601
}

export interface Note {
  id: UUID
  storyId: UUID
  title: string
  bodyJson: TipTapJSON
  labelColour: HexColour
  status: StatusType
  position: number
  keywords: string[]
  customMetadata: CustomMetadataField[]
  createdAt: ISO8601
  updatedAt: ISO8601
}

export interface VonnegutPoint {
  id: UUID
  x: number
  y: number
  beatId: UUID | null
  label: string
}

export interface VonnegutSegment {
  id: UUID
  fromPointId: UUID
  toPointId: UUID
  formula: VonnegutFormula
  tension: number
  bias: number
}

export interface Outline {
  id: UUID
  storyId: UUID
  title: string
  frameworkId: FrameworkId
  labelColour: HexColour
  status: StatusType
  position: number
  keywords: string[]
  customMetadata: CustomMetadataField[]
  vonnegutMode: VonnegutMode
  vonnegutCurvePoints: VonnegutPoint[] | null
  vonnegutFormulaSegments: VonnegutSegment[] | null
  bookerArchetype: BookerArchetype | null
  // ── Narrative Anchors ─────────────────────────────────────────
  // Rich-text (TipTap JSON). null = not yet written.
  dramaticQuestion: TipTapJSON | null
  logline:          TipTapJSON | null
  themeStated:      TipTapJSON | null
  createdAt: ISO8601
  updatedAt: ISO8601
}

export interface BeatSnapshot {
  id: UUID
  timestamp: ISO8601
  label: string | null
  bodyJson: TipTapJSON
  charCount: number
}

export interface Bookmark {
  id: UUID
  type: 'internal' | 'external'
  title: string
  targetType?: 'beat' | 'outline' | 'note'
  targetId?: UUID
  url?: string
}

export interface Comment {
  id: UUID
  body: string
  createdAt: ISO8601
}

export interface Beat {
  id: UUID
  outlineId: UUID
  title: string
  synopsis: string
  bodyJson: TipTapJSON
  labelColour: HexColour
  status: StatusType
  position: number
  isMicroBeat: boolean
  xPosition: number | null
  yPosition: number | null
  toolType: ToolboxTool | null
  isLockedAnchor: boolean
  keywords: string[]
  customMetadata: CustomMetadataField[]
  snapshots: BeatSnapshot[]
  bookmarks: Bookmark[]
  comments: Comment[]
  createdAt: ISO8601
  updatedAt: ISO8601
}

export interface MindmapNode {
  id: UUID
  outlineId: UUID
  beatId: UUID | null
  type: 'beatNode' | 'microBeatNode' | 'anchorNode' | 'freeNode'
  position: { x: number; y: number }
  data: { label: string; labelColour: HexColour; synopsis?: string }
}

export interface MindmapEdge {
  id: UUID
  outlineId: UUID
  source: UUID
  target: UUID
  label?: string
  animated: boolean
}

export interface Collection {
  id: UUID
  title: string
  filters: CollectionFilter[]
  createdAt: ISO8601
}

export interface CollectionFilter {
  field: 'status' | 'labelColour' | 'frameworkId' | 'keyword' | 'updatedAt'
  operator: 'equals' | 'contains' | 'before' | 'after'
  value: string
}

// ── UI State ────────────────────────────────────────────────────
export interface UIState {
  binderOpen: boolean
  inspectorOpen: boolean
  focusMode: boolean
  splitMode: boolean
  activeStoryId: UUID | null
  activeOutlineId: UUID | null
  activeViewMode: ViewMode
  splitTopOutlineId: UUID | null
  splitBottomOutlineId: UUID | null
  selectedBeatId: UUID | null
  expandedStoryIds: UUID[]          // ← binder chevron state
  activeInspectorTab: 'notes' | 'metadata' | 'snapshots' | 'bookmarks' | 'comments'
  pendingTagHighlight: string | null // e.g. '#Dramatic' → scroll TipTap to tag
  // ── Narrative Panel (left column bi-modal) ───────────────────
  leftPanelMode:        'binder' | 'narrative'
  narrativeActiveAnchor: 'dramaticQuestion' | 'logline' | 'themeStated'
  pendingTutorialStep:  string | null
}

export type NarrativeAnchor = 'dramaticQuestion' | 'logline' | 'themeStated'

// ── Sync types ──────────────────────────────────────────────────
export interface SyncQueueItem {
  id: UUID
  table: 'stories' | 'notes' | 'outlines' | 'beats' | 'mindmap_nodes' | 'mindmap_edges'
  recordId: UUID
  operation: 'upsert' | 'delete'
  payload: Record<string, unknown>
  queuedAt: ISO8601
  attempts: number
}
