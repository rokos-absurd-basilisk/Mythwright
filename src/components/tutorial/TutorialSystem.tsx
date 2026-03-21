// ============================================================
// MYTHWRIGHT — TUTORIAL SYSTEM
// Mode A: Element Spotlight (SVG mask + gold glow + zigzag wire)
// Mode B: Workflow Modal (centred, animated CSS simulations)
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────
export type TutorialMode = 'spotlight' | 'workflow'

export interface TutorialStep {
  id:       string
  mode:     TutorialMode
  title:    string
  body:     string
  target?:  string        // CSS selector for spotlight mode
  sim?:     'formula' | 'split' | 'csv' | 'toolbox' | 'mindmap'
}

interface TutorialProps {
  steps: TutorialStep[]
  onComplete: () => void
  onSkip:     () => void
}

const EASE = [0, 0, 0.2, 1] as const

// ── SVG Zigzag Wire ──────────────────────────────────────────
function buildZigzag(
  from: { x: number; y: number },
  to:   { x: number; y: number }
): string {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const perp = { x: -dy, y: dx }
  const len  = Math.sqrt(perp.x**2 + perp.y**2) || 1
  const norm = { x: perp.x/len, y: perp.y/len }
  const amp  = 50 + Math.random() * 30
  const wp1  = { x: from.x + dx*0.35 + norm.x*amp,  y: from.y + dy*0.35 + norm.y*amp }
  const wp2  = { x: from.x + dx*0.65 - norm.x*amp,  y: from.y + dy*0.65 - norm.y*amp }
  return `${from.x},${from.y} ${wp1.x},${wp1.y} ${wp2.x},${wp2.y} ${to.x},${to.y}`
}

function rectMidpoint(rect: DOMRect, side: 'top'|'bottom'|'left'|'right') {
  switch (side) {
    case 'top':    return { x: rect.left + rect.width/2,  y: rect.top }
    case 'bottom': return { x: rect.left + rect.width/2,  y: rect.bottom }
    case 'left':   return { x: rect.left,                  y: rect.top + rect.height/2 }
    case 'right':  return { x: rect.right,                 y: rect.top + rect.height/2 }
  }
}

// ── Animated Simulations (Mode B) ────────────────────────────
function FormulaSim() {
  const [formula, setFormula] = useState(0)
  const names = ['ease_in', 'ease_in_out', 'exponential_decay']
  const paths = [
    'M 40,160 C 40,160 180,160 360,40',
    'M 40,160 C 120,160 280,40 360,40',
    'M 40,160 C 40,80 320,70 360,40',
  ]
  useEffect(() => {
    const t = setInterval(() => setFormula(f => (f+1)%3), 2200)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="relative rounded-[var(--radius-lg)] overflow-hidden p-4" style={{background:'var(--bg-canvas)'}}>
      <svg viewBox="0 0 400 200" width="100%">
        <line x1="40" y1="20" x2="40" y2="180" stroke="white" strokeWidth="2"/>
        <line x1="40" y1="100" x2="380" y2="100" stroke="white" strokeWidth="2"/>
        <text x="44" y="36" fontSize="11" fill="var(--accent-orange)" fontFamily="Oswald,sans-serif">Good Fortune</text>
        <text x="44" y="178" fontSize="11" fill="var(--accent-orange)" fontFamily="Oswald,sans-serif">Ill Fortune</text>
        <path d={paths[formula]} fill="none" stroke="var(--accent-teal)" strokeWidth="3" strokeLinecap="round"
          style={{transition:'d 500ms cubic-bezier(0.4,0,0.2,1)'}}/>
        <circle cx="360" cy="40" r="5" fill="var(--accent-teal)"/>
        {formula === 2 && (
          <circle cx="340" cy="60" r="12" fill="var(--sharp-shift-glow)" opacity="0.35"
            style={{animation:'sharp-pulse 1.4s ease-in-out infinite'}}/>
        )}
      </svg>
      <p className="text-center text-[11px] font-[family-name:var(--font-heading)] uppercase tracking-widest mt-1"
        style={{color:'var(--accent-teal)'}}>
        {names[formula]}
      </p>
    </div>
  )
}

function CsvSim() {
  const [text, setText] = useState('')
  const [showed, setShowed] = useState(false)
  const full = 'Confrontation, Escalation, Betrayal'
  useEffect(() => {
    let i = 0
    setText(''); setShowed(false)
    const t = setInterval(() => {
      if (i <= full.length) { setText(full.slice(0, i)); i++ }
      else { setShowed(true); setTimeout(()=>{ i=0; setText(''); setShowed(false) }, 2000) }
    }, 60)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="p-3 rounded-[var(--radius-lg)] border border-[var(--border)]" style={{background:'var(--bg-input)'}}>
      <p className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--text-primary)] min-h-[20px]">
        {text}<span className="animate-pulse text-[var(--accent-teal)]">|</span>
      </p>
      {showed && (
        <div className="flex gap-2 mt-2">
          {['Confrontation','Escalation','Betrayal'].map((b,i) => (
            <motion.div key={b} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
              transition={{delay:i*0.1, duration:0.2}}
              className="px-2 py-1 rounded text-[10px] font-medium border"
              style={{background:'var(--bg-canvas)',borderColor:'var(--accent-orange)',color:'var(--accent-orange)'}}>
              {b}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

const SIMS = { formula: FormulaSim, csv: CsvSim }

// ── Spotlight Overlay ─────────────────────────────────────────
function SpotlightOverlay({ target, modal }: {
  target: DOMRect | null
  modal:  DOMRect | null
}) {
  const ww = window.innerWidth, wh = window.innerHeight
  if (!target) return null

  const pad = 6

  // Wire points
  const wirePoints = modal ? (() => {
    const tCx = target.left + target.width/2
    const mCx = modal.left  + modal.width/2
    const toSide   = tCx > mCx ? 'left' : 'right'
    const fromSide = mCx > tCx ? 'left' : 'right'
    return buildZigzag(rectMidpoint(modal, fromSide), rectMidpoint(target, toSide))
  })() : null

  return (
    <motion.div className="fixed inset-0 pointer-events-none z-[900]"
      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
      {/* Dark mask */}
      <svg width={ww} height={wh} style={{position:'absolute',inset:0}}>
        <defs>
          <clipPath id="spotlight-clip" clipRule="evenodd">
            <path d={`M0,0 H${ww} V${wh} H0 Z M${target.left-pad},${target.top-pad} H${target.right+pad} V${target.bottom+pad} H${target.left-pad} Z`}/>
          </clipPath>
        </defs>
        <rect width={ww} height={wh} fill="rgba(0,0,0,0.72)" clipPath="url(#spotlight-clip)"/>
        {/* Gold glow ring around target */}
        <rect
          x={target.left-pad} y={target.top-pad}
          width={target.width+pad*2} height={target.height+pad*2}
          rx="6" fill="none"
          stroke="var(--spotlight-gold)" strokeWidth="2.5"
          style={{
            filter:'drop-shadow(0 0 8px rgba(240,180,41,0.6))',
            animation:'spotlight-pulse 2s ease-in-out infinite',
          }}
        />
        {/* Zigzag wire */}
        {wirePoints && (
          <polyline
            points={wirePoints}
            fill="none" stroke="var(--spotlight-gold)" strokeWidth="9"
            strokeLinecap="round" strokeLinejoin="round"
            className="tutorial-wire"
          />
        )}
      </svg>
    </motion.div>
  )
}

// ── Coach Mark (spotlight tooltip) ──────────────────────────
function CoachMark({
  step, stepIdx, total, onNext, onPrev, onSkip, onComplete,
  targetRect, onMount,
}: {
  step: TutorialStep; stepIdx: number; total: number
  onNext: ()=>void; onPrev: ()=>void; onSkip: ()=>void; onComplete: ()=>void
  targetRect: DOMRect | null
  onMount: (r: DOMRect) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isLast = stepIdx === total - 1

  useEffect(() => {
    if (ref.current) onMount(ref.current.getBoundingClientRect())
  })

  // Position: prefer top-right of target, clamp to viewport
  const pos = (() => {
    if (!targetRect) return { top:'40vh', left:'50%', transform:'translateX(-50%)' }
    const w = 320, h = 160
    const margin = 16
    const vw = window.innerWidth, vh = window.innerHeight
    let top = targetRect.top - h - margin
    let left = targetRect.right + margin
    if (top < margin) top = targetRect.bottom + margin
    if (left + w > vw - margin) left = targetRect.left - w - margin
    top  = Math.max(margin, Math.min(top,  vh - h - margin))
    left = Math.max(margin, Math.min(left, vw - w - margin))
    return { top:`${top}px`, left:`${left}px`, transform:'none' }
  })()

  return (
    <motion.div
      ref={ref}
      className="fixed z-[950] w-80 rounded-[10px] border border-[var(--border-active)] p-4"
      style={{ ...pos, background:'var(--bg-secondary)', boxShadow:'var(--shadow-modal)' }}
      initial={{opacity:0, scale:0.97}} animate={{opacity:1, scale:1}}
      exit={{opacity:0, scale:0.97}}
      transition={{duration:0.18, ease:EASE}}
    >
      {/* Step counter */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-[family-name:var(--font-heading)] uppercase tracking-widest text-[var(--spotlight-gold)]">
          Step {stepIdx + 1} of {total}
        </span>
        <button onClick={onSkip} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <X size={14}/>
        </button>
      </div>
      <h3 className="font-[family-name:var(--font-heading)] text-[16px] font-semibold uppercase tracking-wide text-[var(--text-primary)] mb-2">
        {step.title}
      </h3>
      <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-4">
        {step.body}
      </p>
      <div className="flex items-center justify-between">
        <button onClick={onSkip}
          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
          Skip all
        </button>
        <div className="flex gap-2">
          {stepIdx > 0 && (
            <button onClick={onPrev}
              className="flex items-center gap-1 px-3 h-7 rounded-[var(--radius-md)] text-[12px] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-active)] transition-colors">
              <ChevronLeft size={12}/>Prev
            </button>
          )}
          <button onClick={isLast ? onComplete : onNext}
            className="flex items-center gap-1 px-3 h-7 rounded-[var(--radius-md)] text-[12px] text-white transition-colors"
            style={{background:'var(--accent-orange)'}}>
            {isLast ? <><Check size={12}/>Got it</> : <>Next<ChevronRight size={12}/></>}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Workflow Modal (Mode B) ──────────────────────────────────
function WorkflowModal({
  step, stepIdx, total, onNext, onPrev, onSkip, onComplete
}: {
  step: TutorialStep; stepIdx: number; total: number
  onNext:()=>void; onPrev:()=>void; onSkip:()=>void; onComplete:()=>void
}) {
  const isLast = stepIdx === total - 1
  const SimComponent = step.sim ? SIMS[step.sim as keyof typeof SIMS] : null
  return (
    <>
      {/* Soft backdrop */}
      <div className="fixed inset-0 z-[890]" style={{background:'rgba(0,0,0,0.4)'}} onClick={onSkip}/>
      <motion.div
        className="fixed z-[900] rounded-[14px] border border-[var(--border-active)] overflow-hidden"
        style={{
          top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          width:'min(600px, 90vw)', maxHeight:'75vh',
          background:'var(--bg-secondary)', boxShadow:'var(--shadow-modal)',
        }}
        initial={{opacity:0, y:12, scale:0.97}} animate={{opacity:1, y:0, scale:1}}
        exit={{opacity:0, y:-8, scale:0.97}} transition={{duration:0.22, ease:EASE}}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <h3 className="font-[family-name:var(--font-heading)] text-[18px] font-bold uppercase tracking-wide text-[var(--text-primary)]">
              {step.title}
            </h3>
            <span className="px-2 py-0.5 rounded-[var(--radius-pill)] text-[10px] font-medium border border-[var(--border)] text-[var(--text-muted)]">
              {stepIdx+1} of {total}
            </span>
          </div>
          <button onClick={onSkip} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={16}/>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4" style={{maxHeight:'calc(75vh - 120px)'}}>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">{step.body}</p>
          {SimComponent && <SimComponent />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
          <button onClick={onSkip} className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            Skip all
          </button>
          <div className="flex gap-2">
            {stepIdx > 0 && (
              <button onClick={onPrev}
                className="flex items-center gap-1 px-4 h-8 rounded-[var(--radius-md)] text-[13px] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-active)] transition-colors">
                <ChevronLeft size={13}/>Prev
              </button>
            )}
            <button onClick={isLast ? onComplete : onNext}
              className="flex items-center gap-1 px-4 h-8 rounded-[var(--radius-md)] text-[13px] text-white transition-colors"
              style={{background:'var(--accent-orange)'}}>
              {isLast ? <><Check size={13}/>Done</> : <>Next<ChevronRight size={13}/></>}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ── Main TutorialSystem ──────────────────────────────────────
export function TutorialSystem({ steps, onComplete, onSkip }: TutorialProps) {
  const [stepIdx, setStepIdx]       = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [modalRect,  setModalRect]  = useState<DOMRect | null>(null)

  const step = steps[stepIdx]
  if (!step) return null

  // Measure target element
  useEffect(() => {
    if (step.mode === 'spotlight' && step.target) {
      const el = document.querySelector(step.target)
      if (el) setTargetRect(el.getBoundingClientRect())
      else    setTargetRect(null)
    } else {
      setTargetRect(null)
    }
    const handleResize = () => {
      if (step.target) {
        const el = document.querySelector(step.target)
        if (el) setTargetRect(el.getBoundingClientRect())
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [step])

  const next = () => stepIdx < steps.length - 1 ? setStepIdx(i => i+1) : onComplete()
  const prev = () => stepIdx > 0 && setStepIdx(i => i-1)

  return (
    <AnimatePresence mode="wait">
      {step.mode === 'spotlight' ? (
        <div key={step.id}>
          <SpotlightOverlay target={targetRect} modal={modalRect}/>
          <CoachMark
            step={step} stepIdx={stepIdx} total={steps.length}
            onNext={next} onPrev={prev} onSkip={onSkip} onComplete={onComplete}
            targetRect={targetRect} onMount={setModalRect}
          />
        </div>
      ) : (
        <WorkflowModal key={step.id}
          step={step} stepIdx={stepIdx} total={steps.length}
          onNext={next} onPrev={prev} onSkip={onSkip} onComplete={onComplete}
        />
      )}
    </AnimatePresence>
  )
}
