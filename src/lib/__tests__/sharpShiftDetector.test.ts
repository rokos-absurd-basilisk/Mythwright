import { describe, it, expect } from 'vitest'
import { detectSharpShifts } from '../sharpShiftDetector'
import type { Sensitivity } from '../sharpShiftDetector'

// 100-point flat line at y=0.5
const flat = Array.from({length:100}, (_,i) => ({x:i/99, y:0.5}))

// 100-point perfect step function at midpoint
const step = Array.from({length:100}, (_,i) => ({x:i/99, y: i<50 ? 0 : 1}))

// Gradual sine curve — no sharp shifts
const gentle = Array.from({length:200}, (_,i) => ({
  x: i/199,
  y: Math.sin(i/199 * Math.PI * 2) * 0.4,
}))

describe('detectSharpShifts', () => {
  it('returns [] for < 3 points', () => {
    expect(detectSharpShifts([], 'medium')).toHaveLength(0)
    expect(detectSharpShifts([{x:0,y:0},{x:1,y:1}], 'medium')).toHaveLength(0)
  })

  it('returns [] for sensitivity="off"', () => {
    expect(detectSharpShifts(step, 'off')).toHaveLength(0)
  })

  it('returns [] for flat line at any sensitivity', () => {
    const sensitivities: Sensitivity[] = ['low','medium','high']
    sensitivities.forEach(s => {
      expect(detectSharpShifts(flat, s)).toHaveLength(0)
    })
  })

  it('detects step function at medium sensitivity', () => {
    const shifts = detectSharpShifts(step, 'medium')
    expect(shifts.length).toBeGreaterThan(0)
  })

  it('step shift is near x=0.5', () => {
    const shifts = detectSharpShifts(step, 'medium')
    const nearMid = shifts.some(s => s.x > 0.35 && s.x < 0.65)
    expect(nearMid).toBe(true)
  })

  it('high sensitivity detects ≥ low sensitivity', () => {
    const low  = detectSharpShifts(step, 'low').length
    const high = detectSharpShifts(step, 'high').length
    expect(high).toBeGreaterThanOrEqual(low)
  })

  it('all returned shifts have positive severity', () => {
    detectSharpShifts(step, 'medium').forEach(s => {
      expect(s.severity).toBeGreaterThan(0)
    })
  })

  it('step function shifts have higher max severity than gentle sine', () => {
    const stepShifts   = detectSharpShifts(step, 'medium')
    const gentleShifts = detectSharpShifts(gentle, 'medium')
    const maxStep   = Math.max(...stepShifts.map(s => s.severity), 0)
    const maxGentle = Math.max(...gentleShifts.map(s => s.severity), 0)
    // A cliff step should produce at least one very severe shift
    expect(maxStep).toBeGreaterThan(maxGentle)
  })
})
