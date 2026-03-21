// ============================================================
// MYTHWRIGHT — ANIMATION CONFIG HOOK
// Provides animation settings that respect prefers-reduced-motion.
// Use this instead of hardcoded durations in Framer Motion.
// ============================================================
import { useReducedMotion } from 'framer-motion'

export function useAnimationConfig() {
  const reduced = useReducedMotion()

  return {
    // Standard panel/modal transitions
    transition: {
      duration: reduced ? 0.01 : 0.18,
      ease:     [0, 0, 0.2, 1] as const,
    },
    // Slower transitions (panels sliding)
    slowTransition: {
      duration: reduced ? 0.01 : 0.24,
      ease:     [0.4, 0, 0.2, 1] as const,
    },
    // Initial/animate/exit for fade+slide
    fadeUp: {
      initial: { opacity: 0, y: reduced ? 0 : 8  },
      animate: { opacity: 1, y: 0 },
      exit:    { opacity: 0, y: reduced ? 0 : -4 },
    },
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit:    { opacity: 0 },
    },
    scaleIn: {
      initial: { opacity: 0, scale: reduced ? 1 : 0.97 },
      animate: { opacity: 1, scale: 1 },
      exit:    { opacity: 0, scale: reduced ? 1 : 0.97 },
    },
    reduced,
  }
}
