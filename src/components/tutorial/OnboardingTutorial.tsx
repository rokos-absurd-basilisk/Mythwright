// ============================================================
// MYTHWRIGHT — ONBOARDING TUTORIAL
// Defines the full onboarding step registry and manages
// first-launch detection via localStorage.
// ============================================================
import { useEffect, useState } from 'react'
import { TutorialSystem, type TutorialStep } from './TutorialSystem'

const STORAGE_KEY = 'mythwright-onboarding-done'

const ONBOARDING_STEPS: TutorialStep[] = [
  {
    id: 'onboard-01', mode: 'workflow',
    title: 'Welcome to Mythwright',
    body: 'Mythwright is a story-outlining workspace built for novelists, screenwriters, and storytellers. You\'ll plot your stories using 7 different frameworks — from a simple archetype selector to a mathematical fortune curve. Let\'s take a quick tour.',
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
    body: 'This strip holds your Dramatic Question, Logline, and Theme. Click any pill to write in the Narrative Context Panel — the same left column, switching modes without shifting the canvas.',
    target: 'button[title*="Dramatic"]',
  },
  {
    id: 'onboard-05', mode: 'spotlight',
    title: 'The Inspector',
    body: 'When you click a beat, the Inspector opens on the right with 5 tabs: Notes (rich text), Info, Snapshots, Links, and Comments. In Notes, type #dramatic, #logline, or #theme to create live hyperlinks.',
    target: 'aside:last-of-type',
  },
  {
    id: 'onboard-06', mode: 'workflow',
    title: 'Vonnegut Formula Mode',
    body: 'In Framework 2, switch to Formula Mode to define your story\'s fortune arc using 10 mathematical curve types. The app detects sharp emotional shifts and suggests micro-beats.',
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

  useEffect(() => {
    // Show on first launch — after a short delay so the app renders first
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setShow(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShow(false)
  }

  if (!show) return null
  return (
    <TutorialSystem
      steps={ONBOARDING_STEPS}
      onComplete={finish}
      onSkip={finish}
    />
  )
}

// Helper to replay onboarding (called from Settings)
export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY)
}
