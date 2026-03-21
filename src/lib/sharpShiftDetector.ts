// ============================================================
// MYTHWRIGHT — SHARP-SHIFT DETECTOR
// Computes second derivative of curve; flags sharp transitions
// ============================================================
import { type CurvePoint } from './formulaEngine'

export interface SharpShift {
  x: number
  y: number
  severity: number  // |f''| value
}

const SENSITIVITY_THRESHOLDS = {
  low:    15,
  medium: 8,
  high:   4,
  off:    Infinity,
} as const

export type Sensitivity = keyof typeof SENSITIVITY_THRESHOLDS

export function detectSharpShifts(
  points: CurvePoint[],
  sensitivity: Sensitivity = 'medium'
): SharpShift[] {
  if (points.length < 3) return []

  const threshold = SENSITIVITY_THRESHOLDS[sensitivity]
  if (threshold === Infinity) return []

  const shifts: SharpShift[] = []
  const dx = 1 / points.length   // approximate Δx

  for (let i = 1; i < points.length - 1; i++) {
    // Numerical second derivative: (f(i+1) - 2f(i) + f(i-1)) / Δx²
    const d2 = (points[i + 1].y - 2 * points[i].y + points[i - 1].y) / (dx * dx)
    if (Math.abs(d2) > threshold) {
      // Merge with nearby flags (within 2% of timeline)
      const last = shifts[shifts.length - 1]
      if (last && Math.abs(points[i].x - last.x) < 0.02) {
        if (Math.abs(d2) > last.severity) {
          last.x        = points[i].x
          last.y        = points[i].y
          last.severity = Math.abs(d2)
        }
      } else {
        shifts.push({ x: points[i].x, y: points[i].y, severity: Math.abs(d2) })
      }
    }
  }

  return shifts
}
