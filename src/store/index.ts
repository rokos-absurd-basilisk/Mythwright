import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { useShallow } from 'zustand/shallow'
import { createStoriesSlice,  type StoriesSlice  } from './slices/storiesSlice'
import { createOutlinesSlice, type OutlinesSlice } from './slices/outlinesSlice'
import { createUISlice,       type UISlice       } from './slices/uiSlice'
import { createSyncSlice,     type SyncSlice     } from './slices/syncSlice'
import { createTutorialSlice, type TutorialSlice } from './slices/tutorialSlice'
import { createMindmapSlice,  type MindmapSlice  } from './slices/mindmapSlice'

export type BoundStore =
  StoriesSlice & OutlinesSlice & UISlice & SyncSlice &
  TutorialSlice & MindmapSlice

export const useBoundStore = create<BoundStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createStoriesSlice(...a),
        ...createOutlinesSlice(...a),
        ...createUISlice(...a),
        ...createSyncSlice(...a),
        ...createTutorialSlice(...a),
        ...createMindmapSlice(...a),
      }),
      {
        name: 'mythwright',
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({
          // Core data
          stories:          s.stories,
          notes:            s.notes,
          outlines:         s.outlines,
          beats:            s.beats,
          // Sync
          syncQueue:        s.syncQueue,
          lastSyncAt:       s.lastSyncAt,
          // UI preferences
          binderOpen:       s.binderOpen,
          inspectorOpen:    s.inspectorOpen,
          expandedStoryIds: s.expandedStoryIds,
          // Tutorial progress
          tutorialProgress:  s.tutorialProgress,
          tutorialDismissed: s.tutorialDismissed,
          // Mindmap
          mindmapNodes:    s.mindmapNodes,
          mindmapEdges:    s.mindmapEdges,
          mindmapViewport: s.mindmapViewport,
        }),
      }
    ),
    { name: 'Mythwright' }
  )
)

// ── Selectors (all array returns wrapped in useShallow) ──────
export const useStories = () =>
  useBoundStore(useShallow(s =>
    s.stories.filter(st => !st.archived).sort((a, b) => a.position - b.position)
  ))

export const useNotes = (storyId: string) =>
  useBoundStore(useShallow(s =>
    s.notes.filter(n => n.storyId === storyId).sort((a, b) => a.position - b.position)
  ))

export const useOutlines = (storyId: string) =>
  useBoundStore(useShallow(s =>
    s.outlines.filter(o => o.storyId === storyId).sort((a, b) => a.position - b.position)
  ))

export const useBeats = (outlineId: string) =>
  useBoundStore(useShallow(s =>
    s.beats.filter(b => b.outlineId === outlineId).sort((a, b) => a.position - b.position)
  ))

export const useUI = () =>
  useBoundStore(useShallow(s => ({
    binderOpen:             s.binderOpen,
    inspectorOpen:          s.inspectorOpen,
    focusMode:              s.focusMode,
    splitMode:              s.splitMode,
    activeStoryId:          s.activeStoryId,
    activeOutlineId:        s.activeOutlineId,
    activeViewMode:         s.activeViewMode,
    selectedBeatId:         s.selectedBeatId,
    expandedStoryIds:       s.expandedStoryIds,
    splitTopOutlineId:      s.splitTopOutlineId,
    splitBottomOutlineId:   s.splitBottomOutlineId,
    activeInspectorTab:     s.activeInspectorTab,
    pendingTagHighlight:    s.pendingTagHighlight,
    leftPanelMode:          s.leftPanelMode,
    narrativeActiveAnchor:  s.narrativeActiveAnchor,
  })))
