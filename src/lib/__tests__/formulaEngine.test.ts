import { describe, it, expect } from 'vitest'
import { evaluateSegment, evaluateCurve, sampleBezier } from '../formulaEngine'
import type { VonnegutFormula } from '../../types'

describe('evaluateSegment', () => {
  it('linear: returns midpoint at t=0.5', () => {
    expect(evaluateSegment('linear', 0.5, 0, 1)).toBeCloseTo(0.5)
  })

  it('linear: clamps to y0 at t=0', () => {
    expect(evaluateSegment('linear', 0, -1, 1)).toBeCloseTo(-1)
  })

  it('linear: clamps to y1 at t=1', () => {
    expect(evaluateSegment('linear', 1, -1, 1)).toBeCloseTo(1)
  })

  it('ease_in: slow start — value at t=0.5 < linear midpoint', () => {
    const easeIn = evaluateSegment('ease_in', 0.5, 0, 1)
    const linear = evaluateSegment('linear',  0.5, 0, 1)
    expect(easeIn).toBeLessThan(linear)
  })

  it('ease_out: fast start — value at t=0.5 > linear midpoint', () => {
    const easeOut = evaluateSegment('ease_out', 0.5, 0, 1)
    const linear  = evaluateSegment('linear',   0.5, 0, 1)
    expect(easeOut).toBeGreaterThan(linear)
  })

  it('all 10 formulas return finite values across [0,1]', () => {
    const formulas: VonnegutFormula[] = [
      'linear','ease_in','ease_out','ease_in_out',
      'sine_wave','step','exponential_rise','exponential_decay',
      'gaussian_peak','logistic',
    ]
    for (const formula of formulas) {
      for (let t = 0; t <= 1; t += 0.1) {
        const v = evaluateSegment(formula, t, -1, 1)
        expect(Number.isFinite(v), `${formula} at t=${t} should be finite`).toBe(true)
      }
    }
  })
})

describe('evaluateCurve', () => {
  it('returns empty array for fewer than 2 anchors', () => {
    expect(evaluateCurve([{ id:'a', x:0.5, y:0 }], [])).toHaveLength(0)
  })

  it('returns point array for 2 anchors', () => {
    const pts = evaluateCurve(
      [{ id:'a', x:0, y:0 }, { id:'b', x:1, y:1 }],
      [{ fromPointId:'a', toPointId:'b', formula:'linear', tension:3, bias:0.5 }]
    )
    expect(pts.length).toBeGreaterThan(20)
  })

  it('curve points span from ~x=0 to ~x=1', () => {
    const pts = evaluateCurve(
      [{ id:'a', x:0, y:0 }, { id:'b', x:1, y:1 }],
      [{ fromPointId:'a', toPointId:'b', formula:'linear', tension:3, bias:0.5 }]
    )
    expect(pts[0].x).toBeCloseTo(0, 1)
    expect(pts[pts.length-1].x).toBeCloseTo(1, 1)
  })
})

describe('sampleBezier', () => {
  it('produces 201 points', () => {
    const pts = sampleBezier({x:0,y:0},{x:0.3,y:0.5},{x:0.7,y:-0.4},{x:1,y:0.3})
    expect(pts).toHaveLength(201)
  })

  it('starts at p0', () => {
    const pts = sampleBezier({x:0,y:0},{x:0.3,y:0.5},{x:0.7,y:-0.4},{x:1,y:0.3})
    expect(pts[0].x).toBeCloseTo(0)
    expect(pts[0].y).toBeCloseTo(0)
  })

  it('ends at p3', () => {
    const pts = sampleBezier({x:0,y:0},{x:0.3,y:0.5},{x:0.7,y:-0.4},{x:1,y:0.3})
    expect(pts[200].x).toBeCloseTo(1)
    expect(pts[200].y).toBeCloseTo(0.3)
  })
})
