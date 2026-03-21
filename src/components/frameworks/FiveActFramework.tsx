import { useState } from 'react'
import { Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { useBoundStore, useBeats } from '../../store'
import { BeatCard } from '../canvas/BeatCard'

const ACTS_5 = [
  { label:'ACT 1', sublabel:'Exposition',    x:0,    beatLabel:'Exposition' },
  { label:'ACT 2', sublabel:'Rising Action', x:0.2,  beatLabel:'Rising Action' },
  { label:'ACT 3', sublabel:'Climax',        x:0.45, beatLabel:'Climax' },
  { label:'ACT 4', sublabel:'Falling Action',x:0.55, beatLabel:'Falling Action' },
  { label:'ACT 5', sublabel:'Denouement',    x:0.8,  beatLabel:'Denouement' },
]
const DIVS = [0.2, 0.45, 0.55, 0.8]

const W=760; const H=200; const pT=28; const pB=44; const pL=24; const pR=24
const CW=W-pL-pR

const toX = (n:number) => pL + n * CW

// Mountain shape: rises Act1→Act3 peak, falls Act3→Act5 base
function actY(x: number): number {
  const usable = H - pT - pB
  const peak = 0.5  // midpoint of canvas
  if (x <= peak) {
    const baseY = pT + usable * 0.85
    return baseY - (x / peak) * (usable * 0.75)
  } else {
    const peakY = pT + usable * 0.85 - (usable * 0.75)
    const baseY = pT + usable * 0.85
    return peakY + ((x - peak) / (1 - peak)) * (baseY - peakY)
  }
}

export function FiveActFramework({ outlineId }: { outlineId: string }) {
  const beats   = useBeats(outlineId)
  const addBeat = useBoundStore(s => s.addBeat)
  const [view, setView] = useState<'5act'|'pyramid'>('5act')

  const linePoints = Array.from({length:120},(_,i)=>i/119)
    .map(x=>`${toX(x).toFixed(1)},${actY(x).toFixed(1)}`).join(' ')

  const actBounds = [
    {start:0,end:0.2},{start:0.2,end:0.45},{start:0.45,end:0.55},{start:0.55,end:0.8},{start:0.8,end:1}
  ]
  const actBeats = actBounds.map(ab =>
    beats.filter(b=>b.xPosition!=null && b.xPosition>=ab.start && b.xPosition<ab.end)
  )
  const addBeatInAct = (ai:number) => {
    const ab = actBounds[ai]
    addBeat(outlineId, ACTS_5[ai].beatLabel, { xPosition:(ab.start+ab.end)/2 })
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-page-enter" style={{background:'var(--bg-canvas)'}}>
      <div className="max-w-[820px] mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-widest"
            style={{color:'var(--accent-orange)'}}>
            {view==='5act' ? '5 Act Structure' : "Freytag's Pyramid"}
          </h2>
          <div className="flex rounded-[var(--radius-pill)] border border-[var(--border)] overflow-hidden">
            {([['5act','5-Act'],['pyramid','Pyramid']] as const).map(([v,l]) => (
              <button key={v} onClick={()=>setView(v)}
                className={clsx('px-4 h-8 text-[12px] font-medium transition-colors duration-[var(--dur-fast)]',
                  view===v?'text-white':'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
                style={view===v?{background:'var(--accent-orange)'}:{}}
              >{l}</button>
            ))}
          </div>
        </div>

        {view==='5act' ? (
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="rounded-[var(--radius-lg)]"
            style={{background:'var(--bg-canvas)',maxHeight:220,filter:'drop-shadow(0 4px 24px rgba(0,0,0,0.5))'}}>
            {/* Dividers */}
            {DIVS.map((x,i)=>(
              <line key={i} x1={toX(x)} y1={pT-6} x2={toX(x)} y2={H-pB+6}
                stroke="white" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.35"/>
            ))}
            {/* Mountain line */}
            <polyline points={linePoints} fill="none" stroke="var(--accent-orange)" strokeWidth="6"
              strokeLinecap="round" strokeLinejoin="round"/>
            {/* Beat-label ticks at key inflection points */}
            {[{x:0.05,label:'Exposition'},{x:0.32,label:'Rising Action'},{x:0.5,label:'Climax'},
              {x:0.67,label:'Falling Action'},{x:0.92,label:'Denouement'}].map(({x,label})=>(
              <g key={label}>
                <line x1={toX(x)} y1={actY(x)+4} x2={toX(x)} y2={actY(x)+18}
                  stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
                <text x={toX(x)} y={actY(x)-8} textAnchor="middle" fontSize="9"
                  fill="rgba(255,255,255,0.7)" fontFamily="Inter,sans-serif">{label}</text>
              </g>
            ))}
            {/* Act labels */}
            {ACTS_5.map((act,i)=>{
              const ab = actBounds[i]
              const mx = (ab.start+ab.end)/2
              return(
                <g key={i}>
                  <text x={toX(mx)} y={H-14} textAnchor="middle" fontSize="14" fontWeight="700"
                    fill="white" fontFamily="Oswald,sans-serif" letterSpacing="3">{act.label}</text>
                </g>
              )
            })}
            {/* Climax tick */}
            <line x1={toX(0.5)} y1={actY(0.5)-6} x2={toX(0.5)} y2={pT+4}
              stroke="var(--canvas-label-teal)" strokeWidth="1" strokeDasharray="4 3" opacity="0.6"/>
            {/* User beats */}
            {beats.filter(b=>b.xPosition!=null).map(b=>(
              <circle key={b.id} cx={toX(b.xPosition!)} cy={actY(b.xPosition!)} r="6"
                fill={b.labelColour||'var(--accent-teal)'} stroke="var(--bg-canvas)" strokeWidth="2"/>
            ))}
          </svg>
        ) : (
          /* Freytag Pyramid */
          <svg viewBox={`0 0 ${W} ${H+20}`} width="100%" className="rounded-[var(--radius-lg)]"
            style={{background:'var(--bg-canvas)',maxHeight:240,filter:'drop-shadow(0 4px 24px rgba(0,0,0,0.5))'}}>
            {/* Triangle fill */}
            <polygon
              points={`${toX(0.08)},${H-20} ${toX(0.5)},${pT+4} ${toX(0.92)},${H-20}`}
              fill="rgba(232,147,58,0.2)" stroke="var(--accent-orange)" strokeWidth="2"
            />
            {/* Base measurement line */}
            <line x1={toX(0.08)} y1={H-20} x2={toX(0.92)} y2={H-20}
              stroke="var(--accent-orange)" strokeWidth="2"/>
            <line x1={toX(0.08)} y1={H-28} x2={toX(0.08)} y2={H-12} stroke="var(--accent-orange)" strokeWidth="2"/>
            <line x1={toX(0.5)} y1={H-28}  x2={toX(0.5)}  y2={H-12} stroke="var(--accent-orange)" strokeWidth="2"/>
            <line x1={toX(0.92)} y1={H-28} x2={toX(0.92)} y2={H-12} stroke="var(--accent-orange)" strokeWidth="2"/>
            {/* Apex */}
            <circle cx={toX(0.5)} cy={pT+4} r="8" fill="var(--canvas-label-teal)" stroke="white" strokeWidth="2"/>
            <text x={toX(0.5)} y={pT-8} textAnchor="middle" fontSize="13" fill="var(--canvas-label-teal)"
              fontFamily="Oswald,sans-serif" fontWeight="600">Climax?</text>
            {/* Slope labels */}
            <text x={toX(0.28)} y={(pT+H-20)/2-8} textAnchor="middle" fontSize="11"
              fill="white" fontFamily="Oswald,sans-serif"
              transform={`rotate(-51,${toX(0.28)},${(pT+H-20)/2-8})`}>Rising Action</text>
            <text x={toX(0.72)} y={(pT+H-20)/2-8} textAnchor="middle" fontSize="11"
              fill="white" fontFamily="Oswald,sans-serif"
              transform={`rotate(51,${toX(0.72)},${(pT+H-20)/2-8})`}>Falling Action</text>
            {/* Side labels */}
            <text x={toX(0.25)} y={(pT+H-20)/2-28} textAnchor="middle" fontSize="10"
              fill="var(--text-secondary)" fontFamily="Inter,sans-serif">Complications</text>
            <text x={toX(0.75)} y={(pT+H-20)/2-28} textAnchor="middle" fontSize="10"
              fill="var(--text-secondary)" fontFamily="Inter,sans-serif">Reversals</text>
            {/* Base labels */}
            <text x={toX(0.06)} y={H-2} textAnchor="start" fontSize="11"
              fill="var(--text-secondary)" fontFamily="Inter,sans-serif">Exposition</text>
            <text x={toX(0.06)} y={H+12} textAnchor="start" fontSize="9"
              fill="var(--text-muted)" fontFamily="Inter,sans-serif">Inciting Incident</text>
            <text x={toX(0.94)} y={H-2} textAnchor="end" fontSize="11"
              fill="var(--text-secondary)" fontFamily="Inter,sans-serif">Resolution</text>
            <text x={toX(0.94)} y={H+12} textAnchor="end" fontSize="9"
              fill="var(--text-muted)" fontFamily="Inter,sans-serif">Denouement</text>
            {/* Teal arrows */}
            <defs>
              <marker id="au" markerWidth="8" markerHeight="8" refX="4" refY="7" orient="auto">
                <path d="M2,7 L4,2 L6,7" fill="none" stroke="var(--canvas-label-teal)" strokeWidth="1.5"/>
              </marker>
              <marker id="ad" markerWidth="8" markerHeight="8" refX="4" refY="1" orient="auto">
                <path d="M2,1 L4,6 L6,1" fill="none" stroke="var(--canvas-label-teal)" strokeWidth="1.5"/>
              </marker>
            </defs>
            <line x1={toX(0.38)} y1={H-30} x2={toX(0.46)} y2={pT+28}
              stroke="var(--canvas-label-teal)" strokeWidth="2" markerEnd="url(#au)" opacity="0.8"/>
            <line x1={toX(0.54)} y1={pT+28} x2={toX(0.62)} y2={H-30}
              stroke="var(--canvas-label-teal)" strokeWidth="2" markerEnd="url(#ad)" opacity="0.8"/>
          </svg>
        )}

        {/* Act beat columns */}
        <div className="grid grid-cols-5 gap-3">
          {ACTS_5.map((act,ai)=>(
            <div key={ai} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-[family-name:var(--font-heading)] font-bold"
                  style={{color:'var(--accent-orange)'}}>{act.label}</span>
                <button onClick={()=>addBeatInAct(ai)}
                  className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--accent-orange)] transition-colors">
                  <Plus size={12}/>
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">{act.sublabel}</p>
              {actBeats[ai].map(b=><BeatCard key={b.id} beat={b} compact/>)}
              {actBeats[ai].length===0&&(
                <button onClick={()=>addBeatInAct(ai)}
                  className="h-9 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[11px] text-[var(--text-muted)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors">+</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
