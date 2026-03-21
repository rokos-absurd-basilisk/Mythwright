import { StateCreator } from 'zustand'
import { type UIState, type UUID, type ViewMode, type NarrativeAnchor } from '../../types'

type InspectorTab = UIState['activeInspectorTab']

export interface UISlice extends UIState {
  setBinderOpen:          (open: boolean) => void
  setInspectorOpen:       (open: boolean) => void
  toggleBinder:           () => void
  toggleInspector:        () => void
  setFocusMode:           (on: boolean) => void
  setSplitMode:           (on: boolean) => void
  setActiveStory:         (id: UUID | null) => void
  setActiveOutline:       (id: UUID | null) => void
  setViewMode:            (mode: ViewMode) => void
  setSplitOutlines:       (top: UUID | null, bottom: UUID | null) => void
  setSelectedBeat:        (id: UUID | null) => void
  toggleStoryExpanded:    (id: UUID) => void
  setActiveInspectorTab:  (tab: InspectorTab) => void
  setPendingTagHighlight: (tag: string | null) => void
  jumpToCompassTag:       (tag: string, beatId: UUID) => void
  // ── Narrative Panel ─────────────────────────────────────────
  openNarrativeAnchor:    (anchor: NarrativeAnchor) => void
  closeNarrativePanel:    () => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  // ── State ────────────────────────────────────────────────────
  binderOpen:             true,
  inspectorOpen:          true,
  focusMode:              false,
  splitMode:              false,
  activeStoryId:          null,
  activeOutlineId:        null,
  activeViewMode:         'framework',
  splitTopOutlineId:      null,
  splitBottomOutlineId:   null,
  selectedBeatId:         null,
  expandedStoryIds:       [],
  activeInspectorTab:     'notes',
  pendingTagHighlight:    null,
  leftPanelMode:          'binder',
  narrativeActiveAnchor:  'dramaticQuestion',

  // ── Actions ──────────────────────────────────────────────────
  setBinderOpen:          (open)    => set({ binderOpen: open }),
  setInspectorOpen:       (open)    => set({ inspectorOpen: open }),
  toggleBinder:           ()        => set(s => ({ binderOpen: !s.binderOpen })),
  toggleInspector:        ()        => set(s => ({ inspectorOpen: !s.inspectorOpen })),
  setFocusMode:           (on)      => set({ focusMode: on }),
  setSplitMode:           (on)      => set({ splitMode: on }),
  setActiveStory:         (id)      => set({ activeStoryId: id }),
  setActiveOutline:       (id)      => set({ activeOutlineId: id, selectedBeatId: null }),
  setViewMode:            (mode)    => set({ activeViewMode: mode }),
  setSplitOutlines:       (top, bottom) => set({ splitTopOutlineId: top, splitBottomOutlineId: bottom }),
  setSelectedBeat:        (id)      => set({ selectedBeatId: id }),
  setActiveInspectorTab:  (tab)     => set({ activeInspectorTab: tab }),
  setPendingTagHighlight: (tag)     => set({ pendingTagHighlight: tag }),

  // Open the narrative panel to a specific anchor (toggles if same anchor)
  openNarrativeAnchor: (anchor) => set(s => {
    const isAlreadyActive = s.leftPanelMode === 'narrative' && s.narrativeActiveAnchor === anchor
    return {
      leftPanelMode: isAlreadyActive ? 'binder' : 'narrative',
      narrativeActiveAnchor: anchor,
    }
  }),

  closeNarrativePanel: () => set({ leftPanelMode: 'binder' }),

  jumpToCompassTag: (tag, beatId) => set({
    selectedBeatId:      beatId,
    inspectorOpen:       true,
    activeInspectorTab:  'notes',
    pendingTagHighlight: tag,
  }),

  toggleStoryExpanded: (id) => set(s => ({
    expandedStoryIds: s.expandedStoryIds.includes(id)
      ? s.expandedStoryIds.filter(x => x !== id)
      : [...s.expandedStoryIds, id],
  })),
})
