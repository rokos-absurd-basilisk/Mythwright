// ============================================================
// MYTHWRIGHT — QUICK SEARCH HOOK
// Cmd+K / Ctrl+K command palette — fuzzy search across all data
// ============================================================
import { useMemo } from 'react'
import { useBoundStore } from '../store'

export interface SearchResult {
  type: 'story' | 'outline' | 'beat' | 'note'
  id:    string
  title: string
  subtitle?: string
  storyId?:   string
  outlineId?: string
  keywords?: string[]
  score:  number
}

/** Lightweight fuzzy score: consecutive-char bonus + prefix bonus */
function fuzzyScore(query: string, text: string): number {
  if (!query || !text) return 0
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.includes(q)) return 60
  // character subsequence
  let qi = 0
  let consecutive = 0
  let score = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++
      consecutive++
      score += 5 + consecutive * 2
    } else {
      consecutive = 0
    }
  }
  return qi === q.length ? score : 0
}

export function useQuickSearch(query: string): SearchResult[] {
  const stories  = useBoundStore(s => s.stories)
  const outlines = useBoundStore(s => s.outlines)
  const beats    = useBoundStore(s => s.beats)
  const notes    = useBoundStore(s => s.notes)

  return useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim()
    const results: SearchResult[] = []

    // Stories
    stories.filter(s => !s.archived).forEach(s => {
      const titleScore = fuzzyScore(q, s.title)
      const kwScore    = s.keywords.map(k => fuzzyScore(q, k)).reduce((a,b)=>Math.max(a,b), 0)
      const score      = Math.max(titleScore, kwScore * 0.7)
      if (score > 0) results.push({ type:'story', id:s.id, title:s.title, score })
    })

    // Outlines
    outlines.forEach(o => {
      const story = stories.find(s => s.id === o.storyId)
      const score = Math.max(fuzzyScore(q, o.title), o.keywords.map(k=>fuzzyScore(q,k)).reduce((a,b)=>Math.max(a,b),0)*0.7)
      if (score > 0) results.push({
        type:'outline', id:o.id, title:o.title,
        subtitle: story?.title, storyId:o.storyId, score,
      })
    })

    // Beats
    beats.forEach(b => {
      const outline = outlines.find(o => o.id === b.outlineId)
      const score = Math.max(
        fuzzyScore(q, b.title),
        fuzzyScore(q, b.synopsis) * 0.5,
        b.keywords.map(k=>fuzzyScore(q,k)).reduce((a,c)=>Math.max(a,c),0) * 0.6
      )
      if (score > 0) results.push({
        type:'beat', id:b.id, title:b.title,
        subtitle: outline?.title,
        outlineId:b.outlineId,
        storyId: outlines.find(o=>o.id===b.outlineId)?.storyId,
        score,
      })
    })

    // Notes
    notes.forEach(n => {
      const story = stories.find(s => s.id === n.storyId)
      const score = Math.max(fuzzyScore(q, n.title), n.keywords.map(k=>fuzzyScore(q,k)).reduce((a,b)=>Math.max(a,b),0)*0.7)
      if (score > 0) results.push({
        type:'note', id:n.id, title:n.title,
        subtitle: story?.title, storyId:n.storyId, score,
      })
    })

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)  // max 12 results
  }, [query, stories, outlines, beats, notes])
}
