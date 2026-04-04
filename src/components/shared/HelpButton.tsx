// ============================================================
// MYTHWRIGHT — HELP BUTTON
// Small ? icon that opens the tutorial to a specific step ID.
// Placed on panel headers and major UI sections.
// ============================================================
import { HelpCircle } from 'lucide-react'
import { useBoundStore } from '../../store'

interface HelpButtonProps {
  stepId:  string
  title?:  string
  size?:   number
}

export function HelpButton({ stepId, title = 'Show tutorial for this panel', size = 13 }: HelpButtonProps) {
  // Opening a specific tutorial step: mark all prior steps done, reset dismissed,
  // so OnboardingTutorial will show starting from this step.
  // We use a simpler approach: store a pendingTutorialStep in UISlice.
  const openTutorial = useBoundStore(s => s.openTutorialAtStep)

  if (!openTutorial) return null

  return (
    <button
      onClick={() => openTutorial(stepId)}
      title={title}
      aria-label={title}
      className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--spotlight-gold)] hover:bg-[rgba(240,180,41,0.12)] transition-all duration-[var(--dur-fast)]"
    >
      <HelpCircle size={size} />
    </button>
  )
}
