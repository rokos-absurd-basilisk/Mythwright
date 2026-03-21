import { useBoundStore, useBeats } from '../../store'
import { BeatCard } from '../canvas/BeatCard'

const ANCHORS = [
  { id:'hook',   label:'HOOK',         desc:'Introduce the protagonist and their ordinary world.',       x:0.03, y:0.82, phase:'reaction' as const },
  { id:'pt1',    label:'PLOT TURN 1',  desc:'Gets the ball rolling — raises stakes.',                    x:0.20, y:0.58, phase:'reaction' as const },
  { id:'pinch1', label:'PINCH 1',      desc:"Pressure on the character's OLD identity.",                 x:0.33, y:0.72, phase:'reaction' as const },
  { id:'mid',    label:'MIDPOINT',     desc:'Character shifts from reactive to proactive.',              x:0.50, y:0.42, phase:'reaction' as const },
  { id:'pinch2', label:'PINCH 2',      desc:"Pressure on the character's NEW identity.",                 x:0.65, y:0.62, phase:'proaction' as const },
  { id:'pt2',    label:'PLOT TURN 2',  desc:'Character gains the wisdom needed for the climax.',         x:0.80, y:0.38, phase:'proaction' as const },
  { id:'res',    label:'RESOLUTION',   desc:'The conclusion. Start here when planning backwards.',       x:0.97, y:0.18, phase:'proaction' as const },
]

const W=760; const H=220; const pT=20; const pB=28; const pL=20; const pR=20
const CW=W-pL-pR; const CH=H-pT-pB
const toX = (n:number)=>pL+n*CW
const toY = (n:number)=>pT+n*CH

function buildPath() {
  const pts = ANCHORS.map(a=>({sx:toX(a.x),sy:toY(a.y)}))
  let d = `M${pts[0].sx},${pts[0].sy}`
  for(let i=1;i<pts.length;i++){
    const p=pts[i-1],c=pts[i],cx1=(p.sx+c.sx)/2
    d+=` C${cx1},${p.sy} ${cx1},${c.sy} ${c.sx},${c.sy}`
  }
  return d
}

export function SevenPointFramework({outlineId}:{outlineId:string}) {
  const beats   = useBeats(outlineId)
  const addBeat = useBoundStore(s=>s.addBeat)
  const setSel  = useBoundStore(s=>s.setSelectedBeat)

  const anchorBeats = ANCHORS.map(a=>
    beats.find(b=>b.xPosition!=null && Math.abs(b.xPosition-a.x)<0.08 && !b.isMicroBeat)
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-page-enter" style={{background:'var(--bg-canvas)'}}>
      <div className="max-w-[840px] mx-auto flex flex-col gap-5">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-widest"
            style={{color:'var(--accent-orange)'}}>
            7 Point Plot Structure
          </h2>
          <p className="text-[12px] mt-0.5" style={{color:'var(--text-muted)'}}>
            Start with the Resolution. Work backwards to the Hook.
          </p>
        </div>

        {/* Snake path */}
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="rounded-[var(--radius-lg)]"
          style={{background:'var(--bg-canvas)',maxHeight:240,filter:'drop-shadow(0 4px 24px rgba(0,0,0,0.5))'}}>

          {/* Phase backgrounds */}
          <rect x={toX(0)} y={pT} width={toX(0.5)-toX(0)} height={CH}
            fill="rgba(94,200,200,0.04)"/>
          <rect x={toX(0.5)} y={pT} width={toX(1)-toX(0.5)} height={CH}
            fill="rgba(232,147,58,0.04)"/>

          {/* Phase labels */}
          <text x={toX(0.25)} y={pT+16} textAnchor="middle" fontSize="9"
            fill="var(--canvas-label-teal)" fontFamily="Oswald,sans-serif" letterSpacing="3" opacity="0.8">
            REACTION
          </text>
          <text x={toX(0.75)} y={pT+16} textAnchor="middle" fontSize="9"
            fill="var(--accent-orange)" fontFamily="Oswald,sans-serif" letterSpacing="3" opacity="0.8">
            PROACTION
          </text>

          {/* Centre divider */}
          <line x1={toX(0.5)} y1={pT} x2={toX(0.5)} y2={H-pB}
            stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="6 4"/>

          {/* Winding path — thick orange */}
          <path d={buildPath()} fill="none" stroke="var(--accent-orange)" strokeWidth="6"
            strokeLinecap="round" strokeLinejoin="round"/>

          {/* Anchor dots + labels */}
          {ANCHORS.map((a,i)=>{
            const sx=toX(a.x),sy=toY(a.y)
            const above = sy > H/2
            const hasBeat=!!anchorBeats[i]
            return (
              <g key={a.id} style={{cursor:'pointer'}}
                onClick={()=>{
                  if(anchorBeats[i]) setSel(anchorBeats[i]!.id)
                  else addBeat(outlineId,a.label.replace(/ \d/,'').trim().toLowerCase().split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '),{xPosition:a.x})
                }}>
                <circle cx={sx} cy={sy} r="10"
                  fill={hasBeat?'var(--canvas-label-teal)':'white'}
                  stroke={hasBeat?'var(--canvas-label-teal)':'rgba(255,255,255,0.3)'}
                  strokeWidth="2"
                />
                <text x={sx} y={above ? sy-16 : sy+24}
                  textAnchor="middle" fontSize="10" fontWeight="700"
                  fill="white" fontFamily="Oswald,sans-serif" letterSpacing="1">
                  {a.label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Anchor card grid */}
        <div className="grid grid-cols-7 gap-2">
          {ANCHORS.map((a,i)=>(
            <div key={a.id} className="flex flex-col gap-1.5">
              <p className="text-[9px] font-[family-name:var(--font-heading)] uppercase tracking-wide truncate"
                style={{color:'var(--accent-orange)'}}>{a.label}</p>
              <p className="text-[10px] leading-relaxed hidden lg:block" style={{color:'var(--text-muted)'}}>{a.desc}</p>
              {anchorBeats[i]
                ? <BeatCard beat={anchorBeats[i]!} compact/>
                : <button onClick={()=>addBeat(outlineId,a.label,{xPosition:a.x})}
                    className="h-9 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[11px] text-[var(--text-muted)] hover:border-[var(--accent-orange)] hover:text-[var(--accent-orange)] transition-colors">+</button>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
