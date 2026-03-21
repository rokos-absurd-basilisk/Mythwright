// ============================================================
// MYTHWRIGHT — EXPORT UTILITIES
// JSON / Markdown / HTML / PNG
// ============================================================
import { type Outline, type Beat, type Story } from '../types'

// ── JSON export ─────────────────────────────────────────────────
export function exportJSON(story: Story, outline: Outline, beats: Beat[]): void {
  const data = {
    exportedAt: new Date().toISOString(),
    app: 'Mythwright',
    version: '1.0',
    story: { id: story.id, title: story.title, status: story.status },
    outline: {
      id: outline.id, title: outline.title,
      frameworkId: outline.frameworkId,
      bookerArchetype: outline.bookerArchetype,
      vonnegutMode: outline.vonnegutMode,
    },
    beats: beats.map(b => ({
      id: b.id, title: b.title, synopsis: b.synopsis,
      bodyJson: b.bodyJson, status: b.status,
      labelColour: b.labelColour, position: b.position,
      isMicroBeat: b.isMicroBeat, toolType: b.toolType,
      keywords: b.keywords, snapshots: b.snapshots,
      bookmarks: b.bookmarks, comments: b.comments,
    })),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `${slug(outline.title)}.json`)
}

// ── Markdown export ──────────────────────────────────────────────
export function exportMarkdown(story: Story, outline: Outline, beats: Beat[]): void {
  const lines: string[] = [
    `# ${outline.title}`,
    ``,
    `**Story:** ${story.title}  `,
    `**Framework:** ${FRAMEWORK_NAMES[outline.frameworkId]}  `,
    `**Exported:** ${new Date().toLocaleDateString()}`,
    ``,
    `---`,
    ``,
  ]

  for (const beat of beats) {
    lines.push(`## ${beat.title}`)
    if (beat.synopsis) lines.push(`> ${beat.synopsis}`)
    lines.push(``)
    // Convert TipTap JSON to plain markdown text (simplified)
    const body = tiptapToMarkdown(beat.bodyJson)
    if (body) { lines.push(body); lines.push(``) }
    if (beat.keywords.length) lines.push(`*Tags: ${beat.keywords.join(', ')}*`)
    lines.push(``)
    lines.push(`---`)
    lines.push(``)
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  downloadBlob(blob, `${slug(outline.title)}.md`)
}

// ── HTML export ──────────────────────────────────────────────────
export function exportHTML(story: Story, outline: Outline, beats: Beat[]): void {
  const beatsHtml = beats.map(b => `
    <article class="beat">
      <h2>${esc(b.title)}</h2>
      ${b.synopsis ? `<blockquote class="synopsis">${esc(b.synopsis)}</blockquote>` : ''}
      <div class="body">${tiptapToHTML(b.bodyJson)}</div>
      ${b.keywords.length ? `<p class="tags">Tags: ${b.keywords.map(k=>`<span>${esc(k)}</span>`).join(' ')}</p>` : ''}
    </article>`).join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${esc(outline.title)} — Mythwright</title>
<style>
  body { font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 2rem; background: #0d1b2e; color: #e8e8e8; line-height: 1.7; }
  h1 { font-family: 'Arial Narrow', sans-serif; color: #e8933a; font-size: 2rem; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 2px solid #2a5050; padding-bottom: 0.5rem; }
  h2 { font-family: 'Arial Narrow', sans-serif; color: #5ec8c8; font-size: 1.2rem; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 2rem; }
  .meta { color: #5a8888; font-size: 0.85rem; margin-bottom: 2rem; }
  .synopsis { border-left: 3px solid #e8933a; padding-left: 1rem; color: #a8c8c8; font-style: italic; margin: 0.5rem 0; }
  .body { margin: 0.75rem 0; }
  .body p { margin: 0.5rem 0; }
  .tags span { display: inline-block; background: #1f4444; border: 1px solid #2a5050; border-radius: 3px; padding: 0.1rem 0.4rem; font-size: 0.75rem; color: #5a8888; margin: 0.15rem; }
  .beat { border-bottom: 1px solid #2a5050; padding-bottom: 1.5rem; margin-bottom: 1.5rem; }
  .beat:last-child { border-bottom: none; }
</style>
</head>
<body>
<h1>${esc(outline.title)}</h1>
<p class="meta"><strong>${esc(story.title)}</strong> · ${FRAMEWORK_NAMES[outline.frameworkId]} · Exported ${new Date().toLocaleDateString()}</p>
${beatsHtml}
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  downloadBlob(blob, `${slug(outline.title)}.html`)
}

// ── PNG export (canvas screenshot) ──────────────────────────────
export async function exportPNG(elementId: string, filename: string): Promise<void> {
  const { toPng } = await import('html-to-image')
  const el = document.getElementById(elementId)
  if (!el) return
  const dataUrl = await toPng(el, { backgroundColor: '#0d1b2e', pixelRatio: 2 })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename || 'mythwright-canvas.png'
  a.click()
}

// ── Helpers ──────────────────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'outline'
}

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// Simplified TipTap JSON → Markdown
function tiptapToMarkdown(json: Record<string, unknown>): string {
  if (!json?.content) return ''
  const nodes = json.content as Record<string, unknown>[]
  return nodes.map(nodeToMd).filter(Boolean).join('\n')
}

function nodeToMd(node: Record<string, unknown>): string {
  const type = node.type as string
  const content = (node.content as Record<string, unknown>[] | undefined) ?? []
  const text = content.map(nodeToMd).join('')
  switch(type) {
    case 'paragraph':    return text ? `${text}\n` : ''
    case 'heading':      return `${'#'.repeat((node.attrs as Record<string,number>)?.level ?? 2)} ${text}\n`
    case 'bulletList':   return content.map(li => `- ${(li.content as Record<string,unknown>[])?.map(nodeToMd).join('')}`).join('\n')
    case 'orderedList':  return content.map((li,i) => `${i+1}. ${(li.content as Record<string,unknown>[])?.map(nodeToMd).join('')}`).join('\n')
    case 'listItem':     return text
    case 'blockquote':   return `> ${text}`
    case 'text':         return (node.text as string) ?? ''
    default:             return text
  }
}

// Simplified TipTap JSON → HTML
function tiptapToHTML(json: Record<string, unknown>): string {
  if (!json?.content) return ''
  const nodes = json.content as Record<string, unknown>[]
  return nodes.map(nodeToHTML).join('')
}

function nodeToHTML(node: Record<string, unknown>): string {
  const type = node.type as string
  const content = (node.content as Record<string, unknown>[] | undefined) ?? []
  const inner = content.map(nodeToHTML).join('')
  switch(type) {
    case 'paragraph':    return `<p>${inner}</p>`
    case 'heading':      { const l=(node.attrs as Record<string,number>)?.level??2; return `<h${l}>${inner}</h${l}>` }
    case 'bulletList':   return `<ul>${inner}</ul>`
    case 'orderedList':  return `<ol>${inner}</ol>`
    case 'listItem':     return `<li>${inner}</li>`
    case 'blockquote':   return `<blockquote>${inner}</blockquote>`
    case 'text':         {
      let t = esc((node.text as string) ?? '')
      const marks = (node.marks as {type:string}[] | undefined) ?? []
      if (marks.find(m=>m.type==='bold'))   t = `<strong>${t}</strong>`
      if (marks.find(m=>m.type==='italic')) t = `<em>${t}</em>`
      return t
    }
    default: return inner
  }
}

const FRAMEWORK_NAMES: Record<number, string> = {
  1:"Booker's 7 Types", 2:"Vonnegut's Story Shapes",
  3:"3-Act Structure",  4:"5-Act / Freytag's Pyramid",
  5:"7-Point Plot",     6:"Save the Cat", 7:"The Toolbox",
}
