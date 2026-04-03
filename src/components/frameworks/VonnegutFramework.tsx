import { useState, useRef, useCallback, useMemo } from 'react'
import { clsx } from 'clsx'
import { useBoundStore } from '../../store'
import { useBeats } from '../../store'
import { evaluateCurve, sampleBezier, type CurvePoint, type AnchorPoint, type Segment } from '../../lib/formulaEngine'
import { detectSharpShifts, type Sensitivity } from '../../lib/sharpShiftDetector'
import { type VonnegutFormula } from '../../types'
import { BeatCard } from '../canvas/BeatCard'

// ── Axis SVG dimensions ─────────────────────────────────────────
const W = 700; const H = 340
const PAD = { top: 32, bottom: 32, left: 56, right: 32 }
const CW  = W - PAD.left - PAD.right
const CH  = H - PAD.top  - PAD.bottom

// Normalised → SVG pixel
const toSvgX = (x: number) => PAD.left + x * CW
const toSvgY = (y: number) => PAD.top  + (1 - (y + 1) / 2) * CH
// SVG pixel → normalised
const toNormX = (px: number) => (px - PAD.left) / CW
const toNormY = (py: number) => 1 - (py - PAD.top) / CH * 2 - 1

// ── Preset curves ───────────────────────────────────────────────
const PRESETS = {
  'Man in a Hole': {
    anchors: [
      { id:'a', x:0.0,  y: 0.3 },
      { id:'b', x:0.45, y:-0.8 },
      { id:'c', x:1.0,  y: 0.7 },
    ],
    // Bezier ctrl points for freehand
    cp1: { x:0.15, y:-0.2 }, cp2: { x:0.3, y:-0.9 },
  },
  'Boy Gets Girl': {
    anchors: [
      { id:'a', x:0.0,  y: 0.0 },
      { id:'b', x:0.2,  y: 0.3 },
      { id:'c', x:0.5,  y:-0.3 },
      { id:'d', x:1.0,  y: 0.8 },
    ],
    cp1: { x:0.1, y:0.3 }, cp2: { x:0.4, y:-0.4 },
  },
  'Rags to Riches': {
    anchors: [
      { id:'a', x:0.0,  y:-0.9 },
      { id:'b', x:0.4,  y: 0.4 },
      { id:'c', x:0.6,  y:-0.2 },
      { id:'d', x:1.0,  y: 0.9 },
    ],
    cp1: { x:0.15, y:-0.4 }, cp2: { x:0.55, y:0.2 },
  },
  'Old Testament': {
    anchors: [
      { id:'a', x:0.0,  y: 0.0 },
      { id:'b', x:0.2,  y: 0.4 },
      { id:'c', x:0.4,  y:-0.3 },
      { id:'d', x:0.6,  y: 0.35 },
      { id:'e', x:0.8,  y:-0.2 },
      { id:'f', x:1.0,  y:-0.9 },
    ],
    cp1: { x:0.1, y:0.4 }, cp2: { x:0.9, y:-0.6 },
  },
}

// ── Default freehand curve (a gentle S-shape) ───────────────────
const DEFAULT_BEZIER = {
  p0: { x:0.0,  y: 0.0 },
  p1: { x:0.3,  y: 0.5 },
  p2: { x:0.7,  y:-0.4 },
  p3: { x:1.0,  y: 0.3 },
}

const FORMULA_OPTIONS: { value: VonnegutFormula; label: string }[] = [
  { value: 'linear',           label: 'Linear' },
  { value: 'ease_in',          label: 'Ease In' },
  { value: 'ease_out',         label: 'Ease Out' },
  { value: 'ease_in_out',      label: 'Ease In-Out' },
  { value: 'sine_wave',        label: 'Sine Wave' },
  { value: 'step',             label: 'Step' },
  { value: 'exponential_rise', label: 'Exponential Rise' },
  { value: 'exponential_decay', label: 'Exponential Decay' },
  { value: 'gaussian_peak',    label: 'Gaussian Peak' },
  { value: 'logistic',         label: 'Logistic (S-Curve)' },
]

function pointsToPath(pts: CurvePoint[]): string {
  if (!pts.length) return ''
  return pts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${toSvgX(p.x).toFixed(1)},${toSvgY(p.y).toFixed(1)}`
  ).join(' ')
}

// ── Freehand Canvas ─────────────────────────────────────────────
function FreehandCanvas({ outlineId }: { outlineId: string }) {
  const outline = useBoundStore(s => s.outlines.find(o => o.id === outlineId))
  const updateOutline = useBoundStore(s => s.updateOutline)
  const addBeat  = useBoundStore(s => s.addBeat)
  const beats    = useBeats(outlineId)

  // Bezier control points stored in outline.vonnegutCurvePoints as [{id,x,y}] x4
  const stored = outline?.vonnegutCurvePoints
  const p0 = useMemo(() => stored?.[0] ? { x: stored[0].x, y: stored[0].y } : DEFAULT_BEZIER.p0, [stored])
  const p1 = useMemo(() => stored?.[1] ? { x: stored[1].x, y: stored[1].y } : DEFAULT_BEZIER.p1, [stored])
  const p2 = useMemo(() => stored?.[2] ? { x: stored[2].x, y: stored[2].y } : DEFAULT_BEZIER.p2, [stored])
  const p3 = useMemo(() => stored?.[3] ? { x: stored[3].x, y: stored[3].y } : DEFAULT_BEZIER.p3, [stored])

  const [drag, setDrag] = useState<null | 'p1' | 'p2'>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const curvePoints = sampleBezier(p0, p1, p2, p3)
  const pathD = pointsToPath(curvePoints)

  // SVG drag for control handles
  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!drag || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const nx = toNormX(e.clientX - rect.left)
    const ny = toNormY(e.clientY - rect.top)
    const clamped = { x: Math.max(0,Math.min(1,nx)), y: Math.max(-1,Math.min(1,ny)) }
    const pts = [p0, p1, p2, p3].map((p, i) => {
      if ((drag === 'p1' && i === 1) || (drag === 'p2' && i === 2))
        return { id: String(i), x: clamped.x, y: clamped.y, beatId: null, label: '' }
      return { id: String(i), x: p.x, y: p.y, beatId: null, label: '' }
    })
    updateOutline(outlineId, { vonnegutCurvePoints: pts })
  }, [drag, p0, p1, p2, p3, outlineId, updateOutline])

  // Shift+click → micro-beat
  const onSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!e.shiftKey || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const nx = Math.max(0, Math.min(1, toNormX(e.clientX - rect.left)))
    addBeat(outlineId, 'Micro-beat', { isMicroBeat: true, xPosition: nx })
  }, [outlineId, addBeat])

  const loadPreset = (key: keyof typeof PRESETS) => {
    const p = PRESETS[key]
    updateOutline(outlineId, {
      vonnegutCurvePoints: [
        { id:'0', x: p.anchors[0].x, y: p.anchors[0].y, beatId:null, label:'' },
        { id:'1', x: p.cp1.x,        y: p.cp1.y,         beatId:null, label:'' },
        { id:'2', x: p.cp2.x,        y: p.cp2.y,         beatId:null, label:'' },
        { id:'3', x: p.anchors[p.anchors.length-1].x, y: p.anchors[p.anchors.length-1].y, beatId:null, label:'' },
      ]
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Preset buttons */}
      <div className="flex gap-2 flex-wrap">
        {Object.keys(PRESETS).map(k => (
          <button
            key={k}
            onClick={() => loadPreset(k as keyof typeof PRESETS)}
            className="px-3 h-7 rounded-[var(--radius-pill)] text-[11px] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors duration-[var(--dur-fast)]"
          >
            {k}
          </button>
        ))}
        <span className="text-[11px] text-[var(--text-muted)] self-center ml-2">
          Shift+click curve to pin a micro-beat
        </span>
      </div>

      {/* SVG canvas */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="rounded-[var(--radius-lg)] border border-[var(--border)] cursor-crosshair"
        style={{ background: 'var(--bg-canvas)', maxHeight: 360 }}
        onMouseMove={onMouseMove}
        onMouseUp={() => setDrag(null)}
        onMouseLeave={() => setDrag(null)}
        onClick={onSvgClick}
      >
        {/* Grid lines */}
        {[-0.8,-0.4,0,0.4,0.8].map(y => (
          <line key={y}
            x1={PAD.left} y1={toSvgY(y)} x2={W-PAD.right} y2={toSvgY(y)}
            stroke="var(--border)" strokeWidth="1" opacity="0.5"
          />
        ))}
        {[0.25,0.5,0.75].map(x => (
          <line key={x}
            x1={toSvgX(x)} y1={PAD.top} x2={toSvgX(x)} y2={H-PAD.bottom}
            stroke="var(--border)" strokeWidth="1" opacity="0.4"
          />
        ))}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H-PAD.bottom} stroke="white" strokeWidth="2"/>
        <line x1={PAD.left} y1={H/2} x2={W-PAD.right} y2={H/2} stroke="white" strokeWidth="2"/>

        {/* Axis labels */}
        <text x={PAD.left-8} y={PAD.top+6} textAnchor="end" fontSize="12" fill="var(--accent-orange)" fontFamily="Oswald,sans-serif">Good Fortune</text>
        <text x={PAD.left-8} y={H-PAD.bottom} textAnchor="end" fontSize="12" fill="var(--accent-orange)" fontFamily="Oswald,sans-serif">Ill Fortune</text>
        <text x={PAD.left} y={H-4} textAnchor="start" fontSize="12" fill="var(--accent-orange)" fontFamily="Oswald,sans-serif">Beginning</text>
        <text x={W-PAD.right} y={H-4} textAnchor="end" fontSize="12" fill="var(--accent-orange)" fontFamily="Oswald,sans-serif">End</text>

        {/* Story curve */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--accent-teal)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: 'd 300ms cubic-bezier(0.4,0,0.2,1)' }}
        />

        {/* End point dot */}
        <circle cx={toSvgX(p3.x)} cy={toSvgY(p3.y)} r="5" fill="var(--accent-teal)" />

        {/* Bezier control handles (P1 and P2) */}
        {[{pt:p1,id:'p1'},{pt:p2,id:'p2'}].map(({pt,id}) => (
          <g key={id}>
            <line
              x1={id==='p1'?toSvgX(p0.x):toSvgX(p3.x)} y1={id==='p1'?toSvgY(p0.y):toSvgY(p3.y)}
              x2={toSvgX(pt.x)} y2={toSvgY(pt.y)}
              stroke="var(--accent-orange)" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"
            />
            <circle
              cx={toSvgX(pt.x)} cy={toSvgY(pt.y)} r="7"
              fill="var(--accent-orange)" fillOpacity="0.8"
              stroke="white" strokeWidth="1.5"
              style={{ cursor: 'grab' }}
              onMouseDown={() => setDrag(id as 'p1'|'p2')}
            />
          </g>
        ))}

        {/* Micro-beat markers */}
        {beats.filter(b => b.isMicroBeat && b.xPosition != null).map(b => {
          const cx = toSvgX(b.xPosition!)
          const yOnCurve = curvePoints.find(p => Math.abs(p.x - b.xPosition!) < 0.01)?.y ?? 0
          const cy = toSvgY(yOnCurve)
          return (
            <g key={b.id}>
              <line x1={cx} y1={cy} x2={cx} y2={H-PAD.bottom} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={cx} cy={cy} r="5" fill="var(--accent-orange)" stroke="var(--bg-secondary)" strokeWidth="2"/>
              <text x={cx} y={H-PAD.bottom+14} textAnchor="middle" fontSize="9" fill="var(--text-muted)">{b.title.slice(0,12)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Formula Canvas ──────────────────────────────────────────────
function FormulaCanvas({ outlineId }: { outlineId: string }) {
  const outline       = useBoundStore(s => s.outlines.find(o => o.id === outlineId))
  const updateOutline = useBoundStore(s => s.updateOutline)
  const addBeat       = useBoundStore(s => s.addBeat)
  const [sensitivity, setSensitivity] = useState<Sensitivity>('medium')
  const [dismissedShifts, setDismissedShifts] = useState<number[]>([])
  const [activeSegIdx, setActiveSegIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<string | null>(null)

  const rawAnchors = outline?.vonnegutCurvePoints ?? []
  const anchors: AnchorPoint[] = rawAnchors.length >= 2
    ? rawAnchors.map(p => ({ id: p.id, x: p.x, y: p.y }))
    : [
        { id: crypto.randomUUID(), x: 0.1, y: 0.0 },
        { id: crypto.randomUUID(), x: 0.9, y: 0.5 },
      ]

  const rawSegs = outline?.vonnegutFormulaSegments ?? []
  const sortedAnchors = [...anchors].sort((a,b) => a.x - b.x)

  const segments: Segment[] = sortedAnchors.slice(0,-1).map((a, i) => {
    const b    = sortedAnchors[i+1]
    const saved = rawSegs.find(s => s.fromPointId === a.id && s.toPointId === b.id)
    return saved
      ? { fromPointId:a.id, toPointId:b.id, formula:saved.formula, tension:saved.tension, bias:saved.bias }
      : { fromPointId:a.id, toPointId:b.id, formula:'ease_in_out', tension:3, bias:0.5 }
  })

  const curvePoints = evaluateCurve(anchors, segments)
  const shifts       = detectSharpShifts(curvePoints, sensitivity)
    .filter((_,i) => !dismissedShifts.includes(i))

  const pathD = pointsToPath(curvePoints)

  const saveAnchors = (a: AnchorPoint[]) => {
    updateOutline(outlineId, {
      vonnegutCurvePoints: a.map(p => ({ id:p.id, x:p.x, y:p.y, beatId:null, label:'' }))
    })
  }

  const saveSegments = (s: Segment[]) => {
    updateOutline(outlineId, {
      vonnegutFormulaSegments: s.map(sg => ({
        id: crypto.randomUUID(),
        fromPointId: sg.fromPointId, toPointId: sg.toPointId,
        formula: sg.formula, tension: sg.tension, bias: sg.bias,
      }))
    })
  }

  const onSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || dragging) return
    const rect = svgRef.current.getBoundingClientRect()
    const nx = Math.max(0, Math.min(1, toNormX(e.clientX - rect.left)))
    const ny = Math.max(-1, Math.min(1, toNormY(e.clientY - rect.top)))
    if (e.shiftKey) {
      addBeat(outlineId, 'Micro-beat', { isMicroBeat: true, xPosition: nx })
      return
    }
    const newAnchor: AnchorPoint = { id: crypto.randomUUID(), x: nx, y: ny }
    saveAnchors([...anchors, newAnchor])
  }

  const onAnchorDrag = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const nx = Math.max(0, Math.min(1, toNormX(e.clientX - rect.left)))
    const ny = Math.max(-1, Math.min(1, toNormY(e.clientY - rect.top)))
    saveAnchors(anchors.map(a => a.id === dragging ? { ...a, x: nx, y: ny } : a))
  }

  const updateSegment = (idx: number, updates: Partial<Segment>) => {
    const updated = segments.map((s,i) => i === idx ? { ...s, ...updates } : s)
    saveSegments(updated)
  }

  const SENS_OPTIONS: { key: Sensitivity; label: string }[] = [
    { key:'off', label:'Off' }, { key:'low', label:'Low' },
    { key:'medium', label:'Medium' }, { key:'high', label:'High' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-[family-name:var(--font-heading)]">Detection</span>
        <div className="flex gap-1">
          {SENS_OPTIONS.map(o => (
            <button
              key={o.key}
              onClick={() => setSensitivity(o.key)}
              className={clsx(
                'px-3 h-6 rounded-[var(--radius-pill)] text-[11px] font-medium transition-colors duration-[var(--dur-fast)]',
                sensitivity === o.key
                  ? 'bg-[var(--accent-orange)] text-white'
                  : 'border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-orange)]'
              )}
            >{o.label}</button>
          ))}
        </div>
        <span className="text-[11px] text-[var(--text-muted)] ml-2">
          Click to add anchor · Drag to move · Right-click to remove · Shift+click → micro-beat
        </span>
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="rounded-[var(--radius-lg)] border border-[var(--border)] cursor-crosshair"
        style={{ background: 'var(--bg-canvas)', maxHeight: 360 }}
        onMouseMove={onAnchorDrag}
        onMouseUp={() => setDragging(null)}
        onMouseLeave={() => setDragging(null)}
        onClick={onSvgClick}
      >
        {/* Grid */}
        {[-0.8,-0.4,0,0.4,0.8].map(y => (
          <line key={y} x1={PAD.left} y1={toSvgY(y)} x2={W-PAD.right} y2={toSvgY(y)} stroke="var(--border)" strokeWidth="1" opacity="0.5"/>
        ))}
        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H-PAD.bottom} stroke="white" strokeWidth="2"/>
        <line x1={PAD.left} y1={H/2} x2={W-PAD.right} y2={H/2} stroke="white" strokeWidth="2"/>
        {/* Labels */}
        <text x={PAD.left-8} y={PAD.top+6} textAnchor="end" fontSize="12" fill="var(--accent-orange)" fontFamily="Oswald,sans-serif">Good Fortune</text>
        <text x={PAD.left-8} y={H-PAD.bottom} textAnchor="end" fontSize="12" fill="var(--accent-orange)" fontFamily="Oswald,sans-serif">Ill Fortune</text>
        <text x={PAD.left} y={H-4} textAnchor="start" fontSize="12" fill="var(--accent-orange)" fontFamily="Oswald,sans-serif">Beginning</text>
        <text x={W-PAD.right} y={H-4} textAnchor="end" fontSize="12" fill="var(--accent-orange)" fontFamily="Oswald,sans-serif">End</text>

        {/* Curve */}
        {curvePoints.length > 0 && (
          <path d={pathD} fill="none" stroke="var(--accent-teal)" strokeWidth="3" strokeLinecap="round"
            style={{ transition: 'd 300ms cubic-bezier(0.4,0,0.2,1)' }}
          />
        )}

        {/* Sharp-shift indicators */}
        {shifts.map((s,i) => (
          <g key={i}>
            <circle cx={toSvgX(s.x)} cy={toSvgY(s.y)} r="12"
              fill="var(--sharp-shift-glow)" className="animate-[sharp-pulse_1.4s_ease-in-out_infinite]" opacity="0.3"
            />
          </g>
        ))}

        {/* Segment midpoint click targets */}
        {sortedAnchors.slice(0,-1).map((a,i) => {
          const b   = sortedAnchors[i+1]
          const mx  = toSvgX((a.x + b.x) / 2)
          const my  = toSvgY((a.y + b.y) / 2)
          return (
            <g key={`seg-${i}`} onClick={e => { e.stopPropagation(); setActiveSegIdx(activeSegIdx===i?null:i) }}>
              <circle cx={mx} cy={my} r="8" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1.5"
                style={{cursor:'pointer'}} opacity="0.8"
              />
              <text x={mx} y={my+4} textAnchor="middle" fontSize="9" fill="var(--text-muted)">≡</text>
            </g>
          )
        })}

        {/* Anchor points */}
        {sortedAnchors.map(a => (
          <circle
            key={a.id}
            cx={toSvgX(a.x)} cy={toSvgY(a.y)} r="8"
            fill="var(--accent-orange)" stroke="white" strokeWidth="2"
            style={{ cursor: 'grab' }}
            onMouseDown={e => { e.stopPropagation(); setDragging(a.id) }}
            onContextMenu={e => {
              e.preventDefault(); e.stopPropagation()
              if (anchors.length > 2) saveAnchors(anchors.filter(p => p.id !== a.id))
            }}
          />
        ))}
      </svg>

      {/* Active segment editor */}
      {activeSegIdx !== null && (
        <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--border-active)] animate-dropdown"
          style={{ background: 'var(--bg-card)' }}
        >
          <p className="text-[11px] uppercase tracking-widest text-[var(--accent-orange)] font-[family-name:var(--font-heading)] mb-3">
            Segment {activeSegIdx + 1} Formula
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={segments[activeSegIdx]?.formula ?? 'ease_in_out'}
              onChange={e => updateSegment(activeSegIdx, { formula: e.target.value as VonnegutFormula })}
              className="h-8 px-2 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-input)] focus:border-[var(--border-active)] outline-none"
            >
              {FORMULA_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <label className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
              Tension
              <input type="range" min="0.1" max="10" step="0.1"
                value={segments[activeSegIdx]?.tension ?? 3}
                onChange={e => updateSegment(activeSegIdx, { tension: +e.target.value })}
                className="w-28"
              />
              <span className="w-8 text-[var(--text-muted)]">{(segments[activeSegIdx]?.tension ?? 3).toFixed(1)}</span>
            </label>
            <label className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
              Bias
              <input type="range" min="0" max="1" step="0.01"
                value={segments[activeSegIdx]?.bias ?? 0.5}
                onChange={e => updateSegment(activeSegIdx, { bias: +e.target.value })}
                className="w-28"
              />
              <span className="w-8 text-[var(--text-muted)]">{(segments[activeSegIdx]?.bias ?? 0.5).toFixed(2)}</span>
            </label>
          </div>
        </div>
      )}

      {/* Sharp shift suggestion chips */}
      {shifts.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {shifts.map((s,i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-pill)] text-[11px] text-white animate-beat-appear"
              style={{ background: 'var(--sharp-shift-chip)' }}
            >
              ⚡ Sharp shift at {(s.x*100).toFixed(0)}% — add micro-beat?
              <button onClick={() => { addBeat(outlineId,'Micro-beat',{isMicroBeat:true,xPosition:s.x}); setDismissedShifts(d=>[...d,i]) }}
                className="underline hover:no-underline">Add</button>
              <button onClick={() => setDismissedShifts(d=>[...d,i])} className="opacity-60 hover:opacity-100">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Vonnegut Framework ─────────────────────────────────────
export function VonnegutFramework({ outlineId }: { outlineId: string }) {
  const outline       = useBoundStore(s => s.outlines.find(o => o.id === outlineId))
  const updateOutline = useBoundStore(s => s.updateOutline)
  const mode          = outline?.vonnegutMode ?? 'freehand'
  const beats         = useBeats(outlineId).filter(b => !b.isMicroBeat)

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-page-enter">
      <div className="max-w-[760px] mx-auto flex flex-col gap-5">
        {/* Header + mode toggle */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold uppercase tracking-widest text-[var(--accent-orange)]">
              Vonnegut's Story Shapes
            </h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Shape your story's emotional arc over time.
            </p>
          </div>
          <div className="flex rounded-[var(--radius-pill)] border border-[var(--border)] overflow-hidden">
            {(['freehand','formula'] as const).map(m => (
              <button
                key={m}
                onClick={() => updateOutline(outlineId, { vonnegutMode: m })}
                className={clsx(
                  'px-4 h-8 text-[12px] font-medium capitalize transition-colors duration-[var(--dur-fast)]',
                  mode === m
                    ? 'bg-[var(--accent-orange)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >{m === 'freehand' ? 'Freehand' : 'Formula'}</button>
            ))}
          </div>
        </div>

        {mode === 'freehand'
          ? <FreehandCanvas outlineId={outlineId} />
          : <FormulaCanvas outlineId={outlineId} />
        }

        {/* Beat strip below canvas */}
        {beats.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] font-[family-name:var(--font-heading)] mb-2">Beats</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {beats.map(b => <BeatCard key={b.id} beat={b} compact />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
