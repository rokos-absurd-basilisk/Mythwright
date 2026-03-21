// ============================================================
// MYTHWRIGHT — TUTORIAL SLICE
// Tracks tutorial step completion in Zustand (persisted to
// localStorage and synced to Supabase tutorial_progress table)
// ============================================================
import { StateCreator } from 'zustand'

export interface TutorialProgress {
  stepId:      string
  completedAt: string  // ISO8601
  skipped:     boolean
}

export interface TutorialState {
  tutorialProgress:    TutorialProgress[]
  tutorialDismissed:   boolean           // user dismissed onboarding entirely
}

export interface TutorialSlice extends TutorialState {
  markTutorialStep:    (stepId: string, skipped?: boolean) => void
  resetTutorial:       () => void
  dismissTutorial:     () => void
  isTutorialStepDone:  (stepId: string) => boolean
}

export const createTutorialSlice: StateCreator<TutorialSlice> = (set, get) => ({
  tutorialProgress:  [],
  tutorialDismissed: false,

  markTutorialStep: (stepId, skipped = false) => {
    const existing = get().tutorialProgress.find(p => p.stepId === stepId)
    if (existing) return // already recorded

    const entry: TutorialProgress = {
      stepId,
      completedAt: new Date().toISOString(),
      skipped,
    }
    set(s => ({ tutorialProgress: [...s.tutorialProgress, entry] }))
  },

  isTutorialStepDone: (stepId) =>
    get().tutorialProgress.some(p => p.stepId === stepId),

  dismissTutorial: () => set({ tutorialDismissed: true }),

  resetTutorial: () => set({
    tutorialProgress:  [],
    tutorialDismissed: false,
  }),
})
