// ============================================================
// MYTHWRIGHT — ONBOARDING TUTORIAL
// Uses tutorialSlice for persistent progress tracking.
// Syncs to Supabase via the standard sync queue.
// ============================================================
import { useEffect, useState } from 'react'
import { useBoundStore } from '../../store'
import { TutorialSystem, type TutorialStep } from './TutorialSystem'

const ONBOARDING_STEPS: TutorialStep[] = [
  {
    id: 'onboard-01', mode: 'workflow',
    title: 'Welcome to Mythwright',
    body: "Mythwright is a story-outlining workspace for novelists, screenwriters, and storytellers. You\'ll plot your stories using 7 different frameworks — from a simple archetype selector to a mathematical fortune curve. Let\'s take a quick tour.",
  },
  {
    id: 'onboard-02', mode: 'spotlight',
    title: 'Creating Your First Story',
    body: 'Click the bookmark-plus icon to create a new story. Every story is a container for your outlines, notes, and beats.',
    target: 'button[title="New Story"]',
  },
  {
    id: 'onboard-03', mode: 'spotlight',
    title: 'The Binder',
    body: 'The Binder (left column) lists all your stories. Expand a story to see its outlines. Drag stories and outlines to reorder them.',
    target: 'aside:first-of-type',
  },
  {
    id: 'onboard-04', mode: 'spotlight',
    title: 'The Narrative Anchor Strip',
    body: 'This strip holds your Dramatic Question, Logline, and Theme. Click any pill to write in the Narrative Context Panel — the left column switches without shifting the canvas.',
    target: 'button[title*="Dramatic"]',
  },
  {
    id: 'onboard-05', mode: 'spotlight',
    title: 'The Inspector',
    body: 'When you click a beat, the Inspector opens with 5 tabs: Notes, Info, Snapshots, Links, and Comments. In Notes, type #dramatic, #logline, or #theme to link back to your story anchors.',
    target: 'aside:last-of-type',
  },
  {
    id: 'onboard-06', mode: 'workflow',
    title: 'Vonnegut Formula Mode',
    body: 'In Framework 2, switch to Formula Mode to define your fortune arc using 10 mathematical curve types. The app detects sharp emotional shifts and suggests micro-beats.',
    sim: 'formula',
  },
  {
    id: 'onboard-07', mode: 'workflow',
    title: 'CSV Beat Import',
    body: 'In The Toolbox (Framework 7), CSV Mode lets you bulk-import beats by typing comma-separated names. Great for rapid outlining.',
    sim: 'csv',
  },
  {
    id: 'onboard-08', mode: 'spotlight',
    title: 'Quick Search',
    body: 'Press Cmd+K (or Ctrl+K) anytime to open Quick Search. Fuzzy-search across all your stories, outlines, and beats instantly.',
    target: 'body',
  },
]

export function OnboardingTutorial() {
  const [show, setShow] = useState(false)
  const tutorialDismissed = useBoundStore(s => s.tutorialDismissed)
  const markStep          = useBoundStore(s => s.markTutorialStep)
  const dismissTutorial   = useBoundStore(s => s.dismissTutorial)
  const isSomeDone        = useBoundStore(s => s.tutorialProgress.length > 0)

  useEffect(() => {
    if (tutorialDismissed || isSomeDone) return
    const t = setTimeout(() => setShow(true), 1200)
    return () => clearTimeout(t)
  }, [tutorialDismissed, isSomeDone])

  const finish = () => {
    ONBOARDING_STEPS.forEach(s => markStep(s.id, false))
    dismissTutorial()
    setShow(false)
  }

  const skip = () => {
    ONBOARDING_STEPS.forEach(s => markStep(s.id, true))
    dismissTutorial()
    setShow(false)
  }

  if (!show) return null
  return <TutorialSystem steps={ONBOARDING_STEPS} onComplete={finish} onSkip={skip} />
}

// Helper for Settings — replay tutorial
export function resetOnboarding() {
  // Cleared via store action — called from SettingsPanel
}
