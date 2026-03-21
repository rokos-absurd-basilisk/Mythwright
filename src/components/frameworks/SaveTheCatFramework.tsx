import { useState } from 'react'
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import { clsx } from 'clsx'
import { useBoundStore, useBeats } from '../../store'
import { BeatCard } from '../canvas/BeatCard'

interface BeatDef { id:string; name:string; desc:string; t:number; above:boolean }

const BEATS_15: BeatDef[] = [
  { id:'oi',   name:'OPENING IMAGE',      desc:'Snapshot of the world before.',                  t:0.00, above:false },
  { id:'ts',   name:'THEME STATED',       desc:'Someone states what the story is really about.',  t:0.07, above:true  },
  { id:'su',   name:'SET-UP',             desc:'Introduce protagonist, world, flaw.',              t:0.13, above:false },
  { id:'ca',   name:'CATALYST',           desc:'The inciting incident.',                           t:0.19, above:true  },
  { id:'db',   name:'DEBATE',             desc:'Protagonist resists the call.',                    t:0.25, above:false },
  { id:'bi2',  name:'BREAK INTO 2',       desc:'Protagonist commits — enters new world.',          t:0.30, above:true  },
  { id:'bs',   name:'B STORY',            desc:'Secondary storyline introduced.',                  t:0.36, above:false },
  { id:'fg',   name:'FUN & GAMES',        desc:'Delivering on the promise of the premise.',        t:0.44, above:true  },
  { id:'mp',   name:'MIDPOINT',           desc:'False Victory or False Defeat.',                   t:0.50, above:false },
  { id:'bgci', name:'BAD GUYS CLOSE IN',  desc:'Antagonists tighten their grip.',                  t:0.58, above:true  },
  { id:'ail',  name:'ALL IS LOST',        desc:'The lowest point — whiff of death.',               t:0.65, above:false },
  { id:'dns',  name:'DARK NIGHT OF SOUL', desc:'Darkest moment before the breakthrough.',          t:0.72, above:true  },
  { id:'bi3',  name:'BREAK INTO 3',       desc:'Solution found — protagonist has the tools.',      t:0.78, above:false },
  { id:'fin',  name:'FINALE',             desc:'Protagonist proves the theme through action.',     t:0.87, above:true  },
  { id:'fi',   name:'FINAL IMAGE',        desc:'Mirror of Opening Image — shows change.',          t:1.00, above:false },
]

// Wide sinusoidal winding path — 2.5 cycles matching image 16
const W=760; const H=160; const pT=16; const pB=16; const pL=16; const pR=16
const CW=W-pL-pR; const MID=pT+(H-pT-pB)/2

function stcY(t:number) {
  return MID + Math.sin(t * Math.PI * 5) * ((H-pT-pB)/2 - 10)
}
const toX=(t:number)=>pL+t*CW

function buildStcPath() {
  return Array.from({length:240},(_,i)=>i/239)
    .map((t,i)=>`${i===0?'M':'L'}${toX(t).toFixed(1)},${stcY(t).toFixed(1)}`).join(' ')
}

export function SaveTheCatFramework({outlineId}:{outlineId:string}) {
  const beats   = useBeats(outlineId)
  const addBeat = useBoundStore(s=>s.addBeat)
  const [midType, setMidType] = useState<'victory'|'defeat'>('victory')

  const getBeat = (id:string) =>
    beats.find(b=>b.synopsis?.startsWith(`stc:${id}`))

  const addStcBeat = (def:BeatDef) =>
    addBeat(outlineId, def.name, { xPosition:def.t, synopsis:`stc:${def.id}` })

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-page-enter" style={{background:'var(--bg-canvas)'}}>
      <div className="max-w-[840px] mx-auto flex flex-col gap-5">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-widest"
          style={{color:'var(--accent-orange)'}}>
          Save the Cat
        </h2>

        {/* Winding path SVG */}
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="rounded-[var(--radius-lg)]"
          style={{background:'var(--bg-canvas)',maxHeight:180,filter:'drop-shadow(0 4px 24px rgba(0,0,0,0.5))'}}>

          {/* Path — thick orange */}
          <path d={buildStcPath()} fill="none" stroke="var(--accent-orange)" strokeWidth="6"
            strokeLinecap="round" strokeLinejoin="round"/>

          {/* Beat dots — teal filled circles like image 16 */}
          {BEATS_15.map(def=>{
            const cx=toX(def.t); const cy=stcY(def.t)
            const hasBeat=!!getBeat(def.id)
            return (
              <g key={def.id} style={{cursor:'pointer'}} onClick={()=>addStcBeat(def)}>
                <circle cx={cx} cy={cy} r="7"
                  fill="var(--canvas-label-teal)"
                  stroke={hasBeat?'white':'var(--bg-canvas)'}
                  strokeWidth={hasBeat?2:1}
                />
                <text x={cx} y={def.above ? cy-12 : cy+18}
                  textAnchor="middle" fontSize="8" fontWeight="600"
                  fill={def.id==='mp'?'var(--canvas-label-teal)':'white'}
                  fontFamily="Oswald,sans-serif" letterSpacing="0.5"
                >
                  {def.name.length>14 ? def.name.slice(0,12)+'…' : def.name}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Beat grid 3 cols */}
        <div className="grid grid-cols-3 gap-3">
          {BEATS_15.map(def=>{
            const beat=getBeat(def.id)
            const isMid=def.id==='mp'
            return (
              <div key={def.id}
                className={clsx('flex flex-col gap-1.5 rounded-[var(--radius-lg)] p-3 border',
                  isMid?'border-[var(--accent-teal)] bg-[var(--accent-teal-10)]':'border-[var(--border)] bg-[var(--bg-card)]'
                )}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-[family-name:var(--font-heading)] font-bold uppercase tracking-wide truncate"
                    style={{color:'var(--accent-orange)'}}>{def.name}</span>
                  {isMid && (
                    <button
                      onClick={()=>setMidType(t=>t==='victory'?'defeat':'victory')}
                      className={clsx('flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-[var(--radius-pill)] transition-colors flex-shrink-0',
                        midType==='victory'?'bg-[var(--accent-teal)] text-[var(--bg-secondary)]':'bg-[var(--status-blocked)] text-white'
                      )}>
                      {midType==='victory'?<ToggleRight size={10}/>:<ToggleLeft size={10}/>}
                      {midType==='victory'?'Victory':'Defeat'}
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">{def.desc}</p>
                {beat
                  ? <BeatCard beat={beat} compact/>
                  : <button onClick={()=>addStcBeat(def)}
                      className="h-8 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[11px] text-[var(--text-muted)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors flex items-center justify-center gap-1">
                      <Plus size={10}/>Add
                    </button>
                }
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
