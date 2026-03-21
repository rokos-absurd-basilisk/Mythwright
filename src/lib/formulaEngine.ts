// ============================================================
// MYTHWRIGHT — VONNEGUT FORMULA ENGINE
// Evaluates piecewise mathematical curves for Fortune Mode
// ============================================================
import { type VonnegutFormula } from '../types'

const SAMPLES = 200

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

export function evaluateSegment(
  formula: VonnegutFormula,
  t: number,          // 0..1 within this segment
  y0: number,         // start y (-1..1)
  y1: number,         // end y (-1..1)
  tension = 3.0,      // steepness k
  bias = 0.5          // peak/trough skew
): number {
  const k = Math.max(0.1, tension)

  switch (formula) {
    case 'linear':
      return lerp(y0, y1, t)

    case 'ease_in':
      return lerp(y0, y1, t * t * t)

    case 'ease_out':
      return lerp(y0, y1, 1 - Math.pow(1 - t, 3))

    case 'ease_in_out':
      return lerp(y0, y1, 3 * t * t - 2 * t * t * t)

    case 'sine_wave': {
      const freq = Math.max(0.5, k * 0.5)
      const base = lerp(y0, y1, t)
      const amp  = Math.abs(y1 - y0) * 0.4
      return base + amp * Math.sin(Math.PI * t * freq)
    }

    case 'step':
      return t < bias ? y0 : y1

    case 'exponential_rise': {
      const e = Math.exp(k)
      return y0 + (y1 - y0) * (Math.exp(k * t) - 1) / (e - 1)
    }

    case 'exponential_decay': {
      return y0 + (y1 - y0) * (1 - Math.exp(-k * t)) / (1 - Math.exp(-k))
    }

    case 'gaussian_peak': {
      // Bell curve peak at `bias` within the segment
      const center = bias
      const sigma  = 0.2 / (k * 0.3 + 0.1)
      const gauss  = Math.exp(-Math.pow(t - center, 2) / (2 * sigma * sigma))
      const base   = lerp(y0, y1, t)
      const amp    = (Math.max(Math.abs(y0), Math.abs(y1)) + 0.3)
      return base + amp * gauss * Math.sign(y1 - y0 + 0.001)
    }

    case 'logistic': {
      const s = 1 / (1 + Math.exp(-k * (t - bias)))
      return lerp(y0, y1, s)
    }

    default:
      return lerp(y0, y1, t)
  }
}

export interface CurvePoint { x: number; y: number }

export interface AnchorPoint { id: string; x: number; y: number }
export interface Segment {
  fromPointId: string
  toPointId: string
  formula: VonnegutFormula
  tension: number
  bias: number
}

export function evaluateCurve(
  anchors: AnchorPoint[],
  segments: Segment[]
): CurvePoint[] {
  if (anchors.length < 2) return []

  const sorted = [...anchors].sort((a, b) => a.x - b.x)
  const points: CurvePoint[] = []

  for (let si = 0; si < sorted.length - 1; si++) {
    const a0 = sorted[si]
    const a1 = sorted[si + 1]
    const seg = segments.find(
      s => s.fromPointId === a0.id && s.toPointId === a1.id
    ) ?? {
      formula: 'ease_in_out' as VonnegutFormula,
      tension: 3, bias: 0.5,
      fromPointId: a0.id, toPointId: a1.id,
    }

    const steps = Math.ceil(SAMPLES / (sorted.length - 1))
    for (let i = 0; i <= steps; i++) {
      const t  = i / steps
      const x  = lerp(a0.x, a1.x, t)
      const y  = evaluateSegment(seg.formula, t, a0.y, a1.y, seg.tension, seg.bias)
      points.push({ x: Math.max(0, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) })
    }
  }

  return points
}

// Convert a Bezier freehand curve (4 control points) into sampled CurvePoints
export function sampleBezier(
  p0: CurvePoint, p1: CurvePoint, p2: CurvePoint, p3: CurvePoint
): CurvePoint[] {
  const pts: CurvePoint[] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const t  = i / SAMPLES
    const mt = 1 - t
    pts.push({
      x: mt*mt*mt*p0.x + 3*mt*mt*t*p1.x + 3*mt*t*t*p2.x + t*t*t*p3.x,
      y: mt*mt*mt*p0.y + 3*mt*mt*t*p1.y + 3*mt*t*t*p2.y + t*t*t*p3.y,
    })
  }
  return pts
}
