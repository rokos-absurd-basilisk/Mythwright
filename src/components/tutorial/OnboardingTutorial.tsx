import { useEffect, useState } from 'react'
import { TutorialSystem, type TutorialStep } from './TutorialSystem'
import { useBoundStore } from '../../store'

const ONBOARDING_STEPS: TutorialStep[] = [
  {
    id: 'onboard-01', mode: 'workflow',
    title: 'Welcome to Mythwright',
    body: 'Mythwright is a story-outlining workspace for novelists, screenwriters, and storytellers. Plot with 7 frameworks — from simple archetype selectors to mathematical fortune curves. Let\'s take a quick tour.',
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
    body: 'The Binder lists all your stories. Expand a story to see its outlines. Drag stories and outlines to reorder them with the grip handles.',
    target: 'aside[aria-label="Stories and outlines"]',
  },
  {
    id: 'onboard-04', mode: 'spotlight',
    title: 'The Narrative Anchor Strip',
    body: 'These three pills are your story\'s North Star — Dramatic Question, Logline, and Theme. Click any pill to edit it in the left panel without moving the canvas.',
    target: '[aria-label="Story narrative anchors"]',
  },
  {
    id: 'onboard-05', mode: 'spotlight',
    title: 'The Inspector Panel',
    body: 'Click any beat to open the Inspector. You\'ll find 5 tabs: Notes (TipTap rich text), Info, Snapshots, Links, and Comments. Type #dramatic, #logline, or #theme in Notes to create live hyperlinks back to your anchors.',
    target: 'aside[aria-label="Inspector panel"]',
  },
  {
    id: 'onboard-06', mode: 'workflow',
    title: 'Vonnegut Formula Mode',
    body: 'Framework 2 has a Formula Mode — define your story\'s emotional arc using 10 mathematical curves. The app detects sharp emotional shifts and suggests micro-beats automatically.',
    sim: 'formula',
  },
  {
    id: 'onboard-07', mode: 'workflow',
    title: 'CSV Beat Import',
    body: 'In The Toolbox (Framework 7), CSV Mode lets you bulk-import beats instantly. Type comma-separated names and hit Create.',
    sim: 'csv',
  },
  {
    id: 'onboard-08', mode: 'spotlight',
    title: 'Quick Search (⌘K)',
    body: 'Press Cmd+K anytime to search across all your stories, outlines, and beats with fuzzy matching. Navigate by keyboard — arrow keys move, Enter opens.',
    target: 'body',
  },
]

export function OnboardingTutorial() {
  const [show, setShow] = useState(false)
  const tutorialDismissed = useBoundStore(s => s.tutorialDismissed)
  const tutorialProgress  = useBoundStore(s => s.tutorialProgress)
  const markStep          = useBoundStore(s => s.markTutorialStep)
  const dismissTutorial   = useBoundStore(s => s.dismissTutorial)

  useEffect(() => {
    // Show if not dismissed and not all steps done
    if (tutorialDismissed) return
    const allDone = ONBOARDING_STEPS.every(s => tutorialProgress.some(p => p.stepId === s.id))
    if (allDone) return
    // Delay for app to render first
    const t = setTimeout(() => setShow(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const handleStepComplete = (stepId: string, skipped: boolean) => {
    markStep(stepId, skipped)
  }

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

  return (
    <TutorialSystem
      steps={ONBOARDING_STEPS}
      onStepChange={handleStepComplete}
      onComplete={finish}
      onSkip={skip}
    />
  )
}

export function resetOnboarding() {
  // Called from Settings — resets Zustand state (will be synced to Supabase)
  useBoundStore.getState().resetTutorial()
}
