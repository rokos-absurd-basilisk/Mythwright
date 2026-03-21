// ============================================================
// MYTHWRIGHT — FOCUS TRAP HOOK
// Traps keyboard focus within a container (modals, panels).
// Implements WCAG 2.1 focus management for dialog roles.
// ============================================================
import { useEffect, type RefObject } from 'react'

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
  'input:not([disabled])', 'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean
) {
  useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const prevFocus  = document.activeElement as HTMLElement | null

    // Focus first focusable element
    const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE)
    firstFocusable?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(el => !el.closest('[hidden]') && el.offsetParent !== null)

      if (!focusable.length) { e.preventDefault(); return }

      const first = focusable[0]
      const last  = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      // Restore focus when trap deactivates
      prevFocus?.focus?.()
    }
  }, [active, containerRef])
}
