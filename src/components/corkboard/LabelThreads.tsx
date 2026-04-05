// ============================================================
// MYTHWRIGHT — LABEL THREADS
// SVG overlay drawn above the corkboard grid. Connects all
// cards sharing the same label colour with a spline thread.
// One thread per unique colour, toggleable per colour.
// ============================================================
import { useMemo } from 'react'
import { type Beat } from '../../types'

interface LabelThreadsProps {
  /** Beat→centre-position map, built by CorkboardView measuring card positions */
  cardRects:       Record<string, { cx: number; cy: number }>
  beats:           Beat[]
  /** Which label colours are currently toggled ON */
  activeColours:   Set<string>
  width:           number
  height:          number
}

/** Catmull-Rom spline through an array of points → SVG path d string */
function catmullRomPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`

  const alpha = 0.5 // centripetal
  const parts: string[] = [`M${pts[0].x},${pts[0].y}`]

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]

    const cp1x = p1.x + (p2.x - p0.x) * alpha / 3
    const cp1y = p1.y + (p2.y - p0.y) * alpha / 3
    const cp2x = p2.x - (p3.x - p1.x) * alpha / 3
    const cp2y = p2.y - (p3.y - p1.y) * alpha / 3

    parts.push(`C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`)
  }
  return parts.join(' ')
}

export function LabelThreads({ cardRects, beats, activeColours, width, height }: LabelThreadsProps) {
  const threads = useMemo(() => {
    // Group beats by colour
    const groups = new Map<string, Beat[]>()
    beats.forEach(b => {
      if (!cardRects[b.id]) return
      const arr = groups.get(b.labelColour) ?? []
      arr.push(b)
      groups.set(b.labelColour, arr)
    })

    return Array.from(groups.entries())
      .filter(([colour, grp]) => activeColours.has(colour) && grp.length >= 2)
      .map(([colour, grp]) => {
        // Sort beats by position so thread follows story order
        const sorted = [...grp].sort((a, b) => a.position - b.position)
        const pts = sorted
          .map(b => cardRects[b.id])
          .filter(Boolean)
          .map(r => ({ x: r.cx, y: r.cy }))
        return { colour, path: catmullRomPath(pts), pts }
      })
  }, [beats, cardRects, activeColours])

  if (threads.length === 0) return null

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width} height={height}
      style={{ zIndex: 10 }}
      aria-hidden="true"
    >
      <defs>
        {threads.map(({ colour }) => (
          <marker
            key={colour}
            id={`thread-arrow-${colour.replace('#', '')}`}
            viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="6" markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={colour} opacity="0.6"/>
          </marker>
        ))}
      </defs>
      {threads.map(({ colour, path }) => (
        <path
          key={colour}
          d={path}
          fill="none"
          stroke={colour}
          strokeWidth="2"
          strokeOpacity="0.45"
          strokeDasharray="6 3"
          markerEnd={`url(#thread-arrow-${colour.replace('#', '')})`}
          style={{ transition: 'd 300ms ease' }}
        />
      ))}
      {/* Dots at each card centre */}
      {threads.map(({ colour, pts }) =>
        pts.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r={4}
            fill={colour} fillOpacity="0.5" stroke="white" strokeWidth="1.5"/>
        ))
      )}
    </svg>
  )
}
