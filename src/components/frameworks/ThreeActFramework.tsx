import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useBoundStore, useBeats } from '../../store'
import { BeatCard } from '../canvas/BeatCard'

// Acts: dividers at 28% and 72% of width
const ACT_DIVS = [0.28, 0.72]
const W = 760; const H = 200
const pT = 28; const pB = 44; const pL = 24; const pR = 24
const CW = W - pL - pR

const ACTS = [
  { label:'ACT 1', start:0,          end:ACT_DIVS[0], simpleBeats:['Inciting Incident','Second Thoughts'] },
  { label:'ACT 2', start:ACT_DIVS[0],end:ACT_DIVS[1], simpleBeats:['Obstacle','Obstacle','Midpoint Twist','Obstacle','Disaster','Crisis'] },
  { label:'ACT 3', start:ACT_DIVS[1],end:1,            simpleBeats:['Falling Action','End'] },
]

const toX = (n: number) => pL + n * CW

// Ascending-then-descending tension line (peaks at Act 2 climax ~72%, drops in Act 3)
function tensionY(x: number): number {
  const usable = H - pT - pB
  if (x <= ACT_DIVS[1]) {
    // Rise from bottom of Act 1 to peak at Act 2 climax
    const t = x / ACT_DIVS[1]
    return (pT + usable) - t * (usable * 0.72)
  } else {
    // Drop in Act 3
    const t = (x - ACT_DIVS[1]) / (1 - ACT_DIVS[1])
    const peakY = (pT + usable) - ACT_DIVS[1] / ACT_DIVS[1] * (usable * 0.72)
    return peakY + t * (usable * 0.55)
  }
}

export function ThreeActFramework({ outlineId }: { outlineId: string }) {
  const beats   = useBeats(outlineId)
  const addBeat = useBoundStore(s => s.addBeat)
  const [expanded, setExpanded] = useState(false)

  const linePoints = Array.from({length:120},(_,i)=>i/119)
    .map(x=>`${toX(x).toFixed(1)},${tensionY(x).toFixed(1)}`).join(' ')

  // Act 2 glow line (same path, just the Act 2 segment)
  const act2Points = Array.from({length:60},(_,i)=>i/59)
    .map(t => {
      const x = ACT_DIVS[0] + t * (ACT_DIVS[1] - ACT_DIVS[0])
      return `${toX(x).toFixed(1)},${tensionY(x).toFixed(1)}`
    }).join(' ')

  const actBeats = ACTS.map(act =>
    beats.filter(b => b.xPosition != null && b.xPosition >= act.start && b.xPosition < act.end)
  )

  const addDefaultBeat = (ai: number) => {
    const act = ACTS[ai]
    addBeat(outlineId, 'Beat', { xPosition: (act.start + act.end) / 2 })
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-page-enter"
      style={{ background:'var(--bg-canvas)' }}>
      <div className="max-w-[820px] mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-widest"
            style={{ color:'var(--accent-orange)' }}>
            3 Act Structure
          </h2>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-[11px] px-3 h-7 rounded-[var(--radius-pill)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors duration-[var(--dur-fast)]"
          >{expanded ? 'Simple' : 'Expanded'}</button>
        </div>

        {/* SVG diagram — dark navy canvas */}
        <svg viewBox={`0 0 ${W} ${H}`} width="100%"
          className="rounded-[var(--radius-lg)]"
          style={{ background:'var(--bg-canvas)', maxHeight:220, filter:'drop-shadow(0 4px 24px rgba(0,0,0,0.5))' }}>

          {/* Act 2 teal glow layer (behind orange line) */}
          <polyline points={act2Points} fill="none"
            stroke="var(--canvas-label-teal)" strokeWidth="16" strokeLinecap="round" opacity="0.18"/>

          {/* Main orange tension line */}
          <polyline points={linePoints} fill="none"
            stroke="var(--accent-orange)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>

          {/* Act dividers */}
          {ACT_DIVS.map((x,i) => (
            <line key={i}
              x1={toX(x)} y1={pT-6} x2={toX(x)} y2={H-pB+6}
              stroke="white" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4"
            />
          ))}

          {/* Act labels */}
          {ACTS.map((act, i) => (
            <text key={i}
              x={toX((act.start + act.end) / 2)} y={H - 10}
              textAnchor="middle" fontSize="14" fontWeight="700"
              fill="white" fontFamily="Oswald,sans-serif" letterSpacing="3"
            >{act.label}</text>
          ))}

          {/* Expanded beat tick marks */}
          {expanded && ACTS.map((act, ai) =>
            act.simpleBeats.map((name, bi) => {
              const x = act.start + (act.end - act.start) * (bi + 1) / (act.simpleBeats.length + 1)
              const ly = tensionY(x)
              const isAct2 = ai === 1
              return (
                <g key={`${ai}-${bi}`}>
                  <line x1={toX(x)} y1={ly - 5} x2={toX(x)} y2={ly + 18}
                    stroke={isAct2 ? 'var(--canvas-label-teal)' : 'rgba(255,255,255,0.5)'}
                    strokeWidth="1.5"/>
                  <text x={toX(x)} y={ly - 9}
                    textAnchor="middle" fontSize="9"
                    fill={isAct2 ? 'var(--canvas-label-teal)' : 'rgba(255,255,255,0.7)'}
                    fontFamily="Inter,sans-serif">{name}</text>
                </g>
              )
            })
          )}

          {/* Falling Action label in Act 3 */}
          {expanded && (
            <text x={toX((ACT_DIVS[1]+1)/2)+16} y={tensionY((ACT_DIVS[1]+1)/2)+14}
              fontSize="9" fill="var(--accent-orange)" fontFamily="Inter,sans-serif"
              transform={`rotate(30,${toX((ACT_DIVS[1]+1)/2)+16},${tensionY((ACT_DIVS[1]+1)/2)+14})`}>
              Falling Action
            </text>
          )}

          {/* User beat dots on line */}
          {beats.filter(b=>b.xPosition!=null).map(b => (
            <circle key={b.id}
              cx={toX(b.xPosition!)} cy={tensionY(b.xPosition!)} r="6"
              fill={b.labelColour||'var(--accent-teal)'}
              stroke="var(--bg-canvas)" strokeWidth="2"
            />
          ))}
        </svg>

        {/* Act columns */}
        <div className="grid grid-cols-3 gap-4">
          {ACTS.map((act, ai) => (
            <div key={ai} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest font-[family-name:var(--font-heading)] font-bold"
                  style={{ color:'var(--accent-orange)' }}>{act.label}</span>
                <button onClick={() => addDefaultBeat(ai)}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent-orange)] transition-colors">
                  <Plus size={13}/>
                </button>
              </div>
              {actBeats[ai].map(b => <div key={b.id} className="animate-beat-appear"><BeatCard beat={b}/></div>)}
              {actBeats[ai].length === 0 && (
                <button onClick={() => addDefaultBeat(ai)}
                  className="h-10 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[12px] text-[var(--text-muted)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors">
                  + Add beat
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
